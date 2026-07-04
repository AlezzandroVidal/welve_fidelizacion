from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.core.cache import cache_delete, cache_delete_pattern
from app.models.canje import Canje
from app.models.enums import CanalCanje
from app.services import cliente_service, cupon_service, cupon_validacion_service

# Límite defensivo para listas que crecen indefinidamente con la actividad del
# negocio (a diferencia de "mis cupones configurados", que se mantiene chico
# por naturaleza) — a esta escala no hace falta paginación real todavía.
LIMITE_HISTORIAL = 200


async def crear_canje(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    canal: CanalCanje,
    staff_ref: str | None = None,
    registrar_visita: bool = True,
    monto: float | None = None,
) -> tuple[Canje, str | None]:
    """
    Retorna (canje, error_msg). Si error_msg is not None, el canje no se creó.
    Efecto: incrementa cupon.usos_actuales y, si registrar_visita=True (default),
    también actualiza visitas_totales/monto_acumulado/ultima_visita en
    RelacionClienteEmpresa.

    registrar_visita=False lo usa el flujo de validación de cupón por QR
    (routers/qr.py), que delega el conteo completo de la visita —racha, segmento,
    retos, recompensas automáticas— a visita_service.registrar_visita() para no
    contar la visita dos veces.

    Cuando registrar_visita=True, la RelacionClienteEmpresa se crea si no
    existía (afiliación como efecto secundario del canje, no un prerequisito
    — ver routers/canjes.py, el flujo de canje manual por staff).

    `monto` es el monto de la compra que dio pie a este canje — se valida contra
    cupon.monto_minimo. Los canjes automáticos (canal=automatico: recompensas por
    visitas/retos) no representan una compra en curso, así que no exigen monto
    aunque el cupón tenga mínimo configurado.
    """
    cupon = await cupon_service.obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None, "Cupón no encontrado en esta empresa"

    ok, motivo = cupon_validacion_service.es_canjeable(cupon, monto)
    if not ok:
        return None, motivo
    if canal != CanalCanje.automatico and cupon.monto_minimo is not None and monto is None:
        return None, f"Este cupón requiere registrar el monto de la compra (mínimo S/{cupon.monto_minimo:.2f})"

    # Verificar límite por cliente
    if cupon.limite_usos_por_cliente is not None:
        usos_cliente = await Canje.find(
            Canje.empresa_id == empresa_id,
            Canje.cliente_id == cliente_id,
            Canje.cupon_id == cupon_id,
        ).count()
        if usos_cliente >= cupon.limite_usos_por_cliente:
            return None, "Límite de usos por cliente alcanzado"

    # Crear el canje (inmutable)
    canje = Canje(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        cupon_id=cupon_id,
        canal=canal,
        staff_ref=staff_ref,
    )
    await canje.insert()

    # Actualizar usos del cupón
    await cupon.set({"usos_actuales": cupon.usos_actuales + 1, "updated_at": datetime.now(timezone.utc)})

    # Actualizar RelacionClienteEmpresa — se crea si no existía (afiliación
    # como efecto secundario del canje, ver docstring arriba).
    if registrar_visita:
        relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente_id)
        now = datetime.now(timezone.utc)
        await relacion.set({
            "visitas_totales": relacion.visitas_totales + 1,
            "monto_acumulado": relacion.monto_acumulado + monto if monto else relacion.monto_acumulado,
            "ultima_visita": now,
            "updated_at": now,
        })

    await cache_delete(f"metricas:resumen:{empresa_id}")
    await cache_delete_pattern(f"metricas:canjes_por_dia:{empresa_id}:*")
    await cache_delete_pattern(f"metricas:top_cupones:{empresa_id}:*")

    return canje, None


async def listar_canjes_empresa(empresa_id: PydanticObjectId) -> list[Canje]:
    return await Canje.find(Canje.empresa_id == empresa_id).sort("-fecha").limit(LIMITE_HISTORIAL).to_list()


async def listar_canjes_cliente(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> list[Canje]:
    return await Canje.find(
        Canje.empresa_id == empresa_id,
        Canje.cliente_id == cliente_id,
    ).sort("-fecha").limit(LIMITE_HISTORIAL).to_list()
