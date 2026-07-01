from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon, SegmentoCliente
from app.models.relacion import RelacionClienteEmpresa
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


def es_canjeable(cupon: Cupon, monto: float | None = None) -> tuple[bool, str]:
    """Retorna (es_canjeable, motivo). Llamar antes de crear un Canje.
    `monto` es opcional acá a propósito: se usa para filtrar la lista de
    cupones disponibles (sin monto todavía, ver listar_cupones_disponibles_cliente)
    y también en el canje final — solo rechaza si vino un monto insuficiente,
    nunca por monto ausente (esa exigencia vive en canje_service.crear_canje,
    el punto que sí sabe si el canje es manual o automático)."""
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
    if cupon.monto_minimo is not None and monto is not None and monto < cupon.monto_minimo:
        return False, f"Requiere compra mínima de S/{cupon.monto_minimo:.2f}"
    return True, ""


async def expirar_cupones_vencidos() -> int:
    """Job diario: pasa a `expirado` los cupones activos cuya fecha_expiracion
    ya pasó. Antes solo se inferían como no vigentes al vuelo (estaVigente),
    pero el campo estado persistido nunca se corregía solo."""
    now = datetime.now(timezone.utc)
    vencidos = await Cupon.find(
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_expiracion < now,
    ).to_list()
    for cupon in vencidos:
        await cupon.set({"estado": EstadoCupon.expirado, "updated_at": now})
    return len(vencidos)


async def listar_cupones_disponibles_cliente(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> list[Cupon]:
    """Cupones que un cliente concreto puede canjear ahora mismo: vigentes,
    respetando exclusividad por segmento y límite de uso ya alcanzado por él.
    Usado por el panel de staff antes de mostrarle qué puede canjear."""
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    es_exclusivo_cliente = relacion is not None and relacion.segmento == SegmentoCliente.exclusivo

    cupones = await listar_cupones(empresa_id, filtro_estado=EstadoCupon.activo)
    disponibles = []
    for cupon in cupones:
        ok, _ = es_canjeable(cupon)
        if not ok:
            continue
        if cupon.exclusivo and not es_exclusivo_cliente:
            continue
        if cupon.limite_usos_por_cliente is not None:
            usos = await Canje.find(
                Canje.empresa_id == empresa_id,
                Canje.cliente_id == cliente_id,
                Canje.cupon_id == cupon.id,
            ).count()
            if usos >= cupon.limite_usos_por_cliente:
                continue
        disponibles.append(cupon)
    return disponibles
