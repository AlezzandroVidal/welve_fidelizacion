from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId

from app.core.security import create_access_token
from app.models.empresa import Empresa
from app.models.historial_visita import HistorialVisita
from app.models.relacion import RelacionClienteEmpresa
from app.services import cliente_service, cupon_desbloqueo_service, recompensas_engine, segmento_service


def _construir_mensaje(
    visitas_totales: int, recompensas: list[dict], retos: list[dict], subio_a_exclusivo: bool
) -> str:
    if recompensas:
        return f"¡Desbloqueaste {recompensas[0]['nombre']}!"
    if retos:
        return f"¡Completaste el reto {retos[0]['nombre']}!"
    if subio_a_exclusivo:
        return "¡Ahora eres cliente VIP!"
    return f"Visita registrada. Ya llevas {visitas_totales} visitas."


async def _evaluar_y_actualizar(
    empresa: Empresa,
    relacion: RelacionClienteEmpresa,
    cliente_id: PydanticObjectId,
    ultima_visita_anterior: datetime | None,
) -> dict:
    """Evalúa racha/segmento/recompensas/retos sobre visitas_totales ya incrementado
    (el llamador es responsable de haber hecho ese incremento)."""
    now = datetime.now(timezone.utc)

    ruptura = timedelta(days=empresa.config.racha_dias_ruptura)
    if ultima_visita_anterior is None:
        racha_actual = 1
    else:
        anterior = ultima_visita_anterior
        if anterior.tzinfo is None:
            anterior = anterior.replace(tzinfo=timezone.utc)
        racha_actual = relacion.racha_actual + 1 if (now - anterior) <= ruptura else 1
    racha_maxima = max(relacion.racha_maxima, racha_actual)

    await relacion.set({
        "racha_actual": racha_actual,
        "racha_maxima": racha_maxima,
        "updated_at": now,
    })
    relacion.racha_actual = racha_actual

    resultado_segmento = await segmento_service.evaluar_segmento(empresa, relacion)
    subio_a_exclusivo = resultado_segmento["subio_a_exclusivo"]

    recompensas = await recompensas_engine.evaluar_recompensas_automaticas(
        empresa, cliente_id, relacion.visitas_totales
    )
    retos = await recompensas_engine.evaluar_retos(empresa, cliente_id, relacion)

    # Cupones visibilidad=por_reto/por_requisito — distinto de `recompensas`
    # arriba (canal=automatico, otorga Y canjea en el mismo paso): esto solo
    # desbloquea (CuponDesbloqueado), el cliente todavía tiene que canjearlo.
    # Se llama una sola vez acá (tail común de registrar_visita), nunca
    # duplicado en venta_service.procesar_venta — ese ya pasa por acá.
    cupones_desbloqueados = await cupon_desbloqueo_service.verificar_y_desbloquear_cupones(
        cliente_id, empresa.id
    )

    return {
        "visitas_totales": relacion.visitas_totales,
        "racha_actual": racha_actual,
        "recompensas_desbloqueadas": recompensas,
        "retos_completados": retos,
        "cupones_desbloqueados": cupones_desbloqueados,
        "subio_a_exclusivo": subio_a_exclusivo,
        "mensaje": _construir_mensaje(relacion.visitas_totales, recompensas, retos, subio_a_exclusivo),
        "ya_registrado_hoy": False,
    }


async def registrar_visita(
    cliente_id: PydanticObjectId, empresa_id: PydanticObjectId, canal: str = "qr", monto: float | None = None
) -> dict:
    """Único punto que incrementa visitas_totales. Efectos: racha, segmento,
    recompensas automáticas y retos por número de visitas (ver PRODUCTO.md 6.2-6.4).
    `monto` (opcional) es el monto de la compra de esta visita — se suma a
    monto_acumulado, base de los retos por monto y del monto_minimo de cupones."""
    relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente_id)
    empresa = await Empresa.get(empresa_id)

    ultima_visita_anterior = relacion.ultima_visita
    now = datetime.now(timezone.utc)
    nuevas_visitas = relacion.visitas_totales + 1
    nuevo_monto_acumulado = relacion.monto_acumulado + monto if monto else relacion.monto_acumulado
    # 1 punto por sol gastado — visitas sin compra (monto=None) no ganan puntos.
    nuevos_puntos = relacion.puntos + int(monto) if monto else relacion.puntos
    await relacion.set({
        "visitas_totales": nuevas_visitas,
        "monto_acumulado": nuevo_monto_acumulado,
        "puntos": nuevos_puntos,
        "ultima_visita": now,
        "updated_at": now,
    })
    relacion.visitas_totales = nuevas_visitas
    relacion.monto_acumulado = nuevo_monto_acumulado
    relacion.puntos = nuevos_puntos

    # Historial con fecha por evento — RelacionClienteEmpresa solo trae totales
    # acumulados, esto es lo que permite progreso "en los últimos N días"
    # (ver cupon_acceso_service / recompensas_engine). Mismo punto exacto donde
    # se actualizan los totales, para que nunca queden desincronizados.
    await HistorialVisita(empresa_id=empresa_id, cliente_id=cliente_id, fecha=now, monto=monto).insert()

    return await _evaluar_y_actualizar(empresa, relacion, cliente_id, ultima_visita_anterior)


async def romper_rachas_inactivas() -> int:
    """Job diario: resetea racha_actual a 0 para relaciones cuya última visita
    superó racha_dias_ruptura de su empresa. Hoy la racha solo se corrige en la
    SIGUIENTE visita del cliente — este job la rompe aunque nunca vuelva."""
    now = datetime.now(timezone.utc)
    rotas = 0
    for empresa in await Empresa.find_all().to_list():
        ruptura = timedelta(days=empresa.config.racha_dias_ruptura)
        candidatas = await RelacionClienteEmpresa.find(
            RelacionClienteEmpresa.empresa_id == empresa.id,
            RelacionClienteEmpresa.racha_actual > 0,
        ).to_list()
        for relacion in candidatas:
            if relacion.ultima_visita is None:
                continue
            ultima = relacion.ultima_visita
            if ultima.tzinfo is None:
                ultima = ultima.replace(tzinfo=timezone.utc)
            if (now - ultima) > ruptura:
                await relacion.set({"racha_actual": 0, "updated_at": now})
                rotas += 1
    return rotas


async def afiliar_cliente(
    nombre: str | None,
    email: str | None,
    whatsapp: str | None,
    empresa_id: PydanticObjectId,
) -> dict | None:
    """Primera visita / afiliación — la única acción que el cliente hace por sí
    mismo (ver reglas de anti-fraude en PRODUCT.MD). Retorna None si ya existe
    una RelacionClienteEmpresa para este cliente en esta empresa (el router
    lanza 409): nunca se cuenta una visita adicional para alguien que ya está
    afiliado — esas las registra el staff (ver routers/staff.py).
    """
    cliente = await cliente_service.obtener_o_crear_cliente(nombre, email, whatsapp)

    ya_afiliado = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente.id,
    )
    if ya_afiliado:
        return None

    resultado = await registrar_visita(cliente.id, empresa_id, canal="qr")

    token = create_access_token(
        subject=str(cliente.id),
        extra={"rol": "cliente", "empresa_id": str(empresa_id)},
    )
    return {
        "jwt": token,
        "cliente": {
            "id": str(cliente.id),
            "nombre": cliente.nombre,
            "email": cliente.email,
            "whatsapp": cliente.whatsapp,
        },
        "codigo_cliente": cliente.codigo_cliente,
        "resultado_visita": resultado,
    }
