from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.schemas.cupon import CuponCreate, CuponUpdate

_ALLOWED_UPDATE = frozenset({
    "nombre", "monto_minimo", "fecha_expiracion",
    "limite_usos_total", "limite_usos_por_cliente", "estado", "exclusivo",
})


async def listar_cupones(
    empresa_id: PydanticObjectId,
    filtro_estado: Optional[EstadoCupon] = None,
) -> list[Cupon]:
    query = Cupon.find(Cupon.empresa_id == empresa_id)
    if filtro_estado is not None:
        query = query.find(Cupon.estado == filtro_estado)
    return await query.sort("-created_at").to_list()


async def obtener_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    """Siempre filtra por empresa_id para garantizar aislamiento multi-tenant."""
    return await Cupon.find_one(Cupon.empresa_id == empresa_id, Cupon.id == cupon_id)


async def crear_cupon(empresa_id: PydanticObjectId, data: CuponCreate) -> Cupon:
    cupon = Cupon(
        empresa_id=empresa_id,
        estado=EstadoCupon.activo,
        usos_actuales=0,
        **data.model_dump(),
    )
    await cupon.insert()
    return cupon


async def actualizar_cupon(
    empresa_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    data: CuponUpdate,
) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    # Solo campos permitidos — tipo y valor no modificables tras creación
    update_data = {
        k: v for k, v in data.model_dump(exclude_unset=True).items()
        if k in _ALLOWED_UPDATE
    }
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await cupon.set(update_data)
    return cupon


async def pausar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    await cupon.set({"estado": EstadoCupon.pausado, "updated_at": datetime.now(timezone.utc)})
    return cupon


async def activar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    now = datetime.now(timezone.utc)
    fecha_exp = cupon.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    if fecha_exp < now:
        return None  # No se puede activar un cupón ya expirado
    await cupon.set({"estado": EstadoCupon.activo, "updated_at": now})
    return cupon


async def eliminar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> bool:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return False
    if cupon.usos_actuales > 0:
        raise ValueError("No se puede eliminar un cupón con canjes registrados")
    await cupon.delete()
    return True


async def listar_canjes_cupon(
    empresa_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    limit: int = 5,
) -> list[Canje]:
    return await (
        Canje.find(Canje.empresa_id == empresa_id, Canje.cupon_id == cupon_id)
        .sort("-fecha")
        .limit(limit)
        .to_list()
    )


def es_canjeable(cupon: Cupon) -> tuple[bool, str]:
    """Retorna (es_canjeable, motivo). Llamar antes de crear un Canje."""
    now = datetime.now(timezone.utc)
    if cupon.estado != EstadoCupon.activo:
        return False, f"Cupón en estado {cupon.estado.value}"
    fecha_exp = cupon.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    if fecha_exp < now:
        return False, "Cupón expirado"
    fecha_ini = cupon.fecha_inicio
    if fecha_ini.tzinfo is None:
        fecha_ini = fecha_ini.replace(tzinfo=timezone.utc)
    if fecha_ini > now:
        return False, "Cupón aún no vigente"
    if cupon.limite_usos_total is not None and cupon.usos_actuales >= cupon.limite_usos_total:
        return False, "Cupón sin usos disponibles"
    return True, ""
