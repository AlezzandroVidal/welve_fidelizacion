from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId

from app.core.security import create_access_token
from app.models.empresa import Empresa
from app.models.enums import SegmentoCliente
from app.models.relacion import RelacionClienteEmpresa
from app.services import cliente_service, recompensas_engine

# Umbral de sección 6.4 de PRODUCTO.md: más de 10 visitas -> segmento exclusivo.
SEGMENTO_EXCLUSIVO_VISITAS = 10


def ya_visito_hoy(relacion: RelacionClienteEmpresa) -> bool:
    """True si ya se registró una visita hoy (UTC) — límite de 1 visita/día por QR."""
    if relacion.ultima_visita is None:
        return False
    ultima = relacion.ultima_visita
    if ultima.tzinfo is None:
        ultima = ultima.replace(tzinfo=timezone.utc)
    return ultima.date() == datetime.now(timezone.utc).date()


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

    segmento = relacion.segmento
    fecha_entrada_segmento = relacion.fecha_entrada_segmento
    subio_a_exclusivo = False
    if relacion.segmento != SegmentoCliente.exclusivo and relacion.visitas_totales > SEGMENTO_EXCLUSIVO_VISITAS:
        segmento = SegmentoCliente.exclusivo
        fecha_entrada_segmento = now
        subio_a_exclusivo = True

    await relacion.set({
        "racha_actual": racha_actual,
        "racha_maxima": racha_maxima,
        "segmento": segmento,
        "fecha_entrada_segmento": fecha_entrada_segmento,
        "updated_at": now,
    })

    recompensas = await recompensas_engine.evaluar_recompensas_automaticas(
        empresa, cliente_id, relacion.visitas_totales
    )
    retos = await recompensas_engine.evaluar_retos(empresa, cliente_id, relacion.visitas_totales)

    return {
        "visitas_totales": relacion.visitas_totales,
        "racha_actual": racha_actual,
        "recompensas_desbloqueadas": recompensas,
        "retos_completados": retos,
        "subio_a_exclusivo": subio_a_exclusivo,
        "mensaje": _construir_mensaje(relacion.visitas_totales, recompensas, retos, subio_a_exclusivo),
        "ya_registrado_hoy": False,
    }


async def registrar_visita(
    cliente_id: PydanticObjectId, empresa_id: PydanticObjectId, canal: str = "qr"
) -> dict:
    """Único punto que incrementa visitas_totales. Efectos: racha, segmento,
    recompensas automáticas y retos por número de visitas (ver PRODUCTO.md 6.2-6.4)."""
    relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente_id)
    empresa = await Empresa.get(empresa_id)

    ultima_visita_anterior = relacion.ultima_visita
    now = datetime.now(timezone.utc)
    nuevas_visitas = relacion.visitas_totales + 1
    await relacion.set({
        "visitas_totales": nuevas_visitas,
        "ultima_visita": now,
        "updated_at": now,
    })
    relacion.visitas_totales = nuevas_visitas

    return await _evaluar_y_actualizar(empresa, relacion, cliente_id, ultima_visita_anterior)


async def registrar_visita_con_registro(
    nombre: str | None,
    email: str | None,
    whatsapp: str | None,
    empresa_id: PydanticObjectId,
) -> dict:
    """Para clientes que escanean el QR de empresa sin sesión — crea cuenta/relación si hace falta."""
    cliente = await cliente_service.obtener_o_crear_cliente(nombre, email, whatsapp)
    relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente.id)

    if ya_visito_hoy(relacion):
        resultado = {
            "visitas_totales": relacion.visitas_totales,
            "racha_actual": relacion.racha_actual,
            "recompensas_desbloqueadas": [],
            "retos_completados": [],
            "subio_a_exclusivo": False,
            "mensaje": "Ya registraste tu visita hoy. ¡Vuelve mañana!",
            "ya_registrado_hoy": True,
        }
    else:
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
        "resultado_visita": resultado,
    }
