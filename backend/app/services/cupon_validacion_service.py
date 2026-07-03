"""Validación de canje y filtrado de cupones disponibles — separado de
cupon_service.py (CRUD) para mantener cada archivo bajo el límite de
200 líneas del proyecto."""

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.services import cupon_service


def es_canjeable(cupon: Cupon, monto: Optional[float] = None) -> tuple[bool, str]:
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
    """Cupones que un cliente concreto puede canjear ahora mismo — vigentes,
    respetando el gate VIP por segmento, el límite de uso ya alcanzado por
    él, y el estado de desbloqueo para por_reto/por_requisito/privado.
    Usado por el panel de staff y por Caja antes de mostrar qué puede
    canjear. Delega toda la evaluación a cupon_acceso_service (import local
    para evitar el ciclo: cupon_acceso_service ya importa este módulo para
    es_canjeable)."""
    from app.services import cupon_acceso_service

    cupones = await cupon_service.listar_cupones(empresa_id, filtro_estado=EstadoCupon.activo)
    disponibles = []
    for cupon in cupones:
        acceso = await cupon_acceso_service.evaluar_acceso_cupon(cupon, cliente_id, empresa_id)
        if acceso.puede_canjear:
            disponibles.append(cupon)
    return disponibles
