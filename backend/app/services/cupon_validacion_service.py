"""Validación de canje y filtrado de cupones disponibles — separado de
cupon_service.py (CRUD) para mantener cada archivo bajo el límite de
200 líneas del proyecto."""

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import AccesoVisibilidad, EstadoCupon, SegmentoCliente
from app.models.relacion import RelacionClienteEmpresa
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
    """Cupones que un cliente concreto puede canjear ahora mismo: vigentes,
    respetando el gate VIP por segmento y límite de uso ya alcanzado por él.
    Usado por el panel de staff antes de mostrarle qué puede canjear.

    Solo cubre visibilidad=publico/vip — por_reto/por_requisito/privado
    requieren evaluar progreso y estado de desbloqueo (CuponDesbloqueado),
    eso lo resuelve cupon_acceso_service.evaluar_acceso_cupon, no esta
    función legacy."""
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    es_exclusivo_cliente = relacion is not None and relacion.segmento == SegmentoCliente.exclusivo

    cupones = await cupon_service.listar_cupones(empresa_id, filtro_estado=EstadoCupon.activo)
    disponibles = []
    for cupon in cupones:
        if cupon.visibilidad not in (AccesoVisibilidad.publico, AccesoVisibilidad.vip):
            continue
        ok, _ = es_canjeable(cupon)
        if not ok:
            continue
        if cupon.visibilidad == AccesoVisibilidad.vip and not es_exclusivo_cliente:
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
