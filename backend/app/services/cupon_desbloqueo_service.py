"""Escritura del desbloqueo de cupones — separado de cupon_acceso_service.py
(que es solo lectura: evaluar_acceso_cupon) para mantener cada archivo bajo
el límite de 200 líneas del proyecto."""

from beanie.operators import In
from typing import Optional

from beanie import PydanticObjectId

from app.models.cupon import Cupon
from app.models.cupon_desbloqueado import CuponDesbloqueado
from app.models.enums import AccesoVisibilidad, EstadoCupon, TipoNotificacion
from app.models.notificacion import Notificacion
from app.models.relacion import RelacionClienteEmpresa
from app.services.cupon_acceso_service import progreso_condicion_cupon


async def desbloquear_cupon(
    cupon_id: PydanticObjectId, cliente_id: PydanticObjectId, empresa_id: PydanticObjectId,
) -> Optional[CuponDesbloqueado]:
    """Idempotente — el índice único (cliente_id, cupon_id) evita duplicados
    ante carreras (ej. dos visitas casi simultáneas cruzando el umbral)."""
    existente = await CuponDesbloqueado.find_one(
        CuponDesbloqueado.cliente_id == cliente_id, CuponDesbloqueado.cupon_id == cupon_id,
    )
    if existente:
        return existente

    cupon = await Cupon.get(cupon_id)
    if not cupon:
        return None

    desbloqueo = CuponDesbloqueado(cliente_id=cliente_id, cupon_id=cupon_id, empresa_id=empresa_id)
    try:
        await desbloqueo.insert()
    except Exception:
        return await CuponDesbloqueado.find_one(
            CuponDesbloqueado.cliente_id == cliente_id, CuponDesbloqueado.cupon_id == cupon_id,
        )

    if cupon.notificar_al_desbloquear:
        await Notificacion(
            cliente_id=cliente_id,
            empresa_id=empresa_id,
            tipo=TipoNotificacion.cupon_desbloqueado,
            titulo="¡Nuevo cupón desbloqueado!",
            mensaje=cupon.mensaje_notificacion or f"¡Desbloqueaste {cupon.nombre}!",
            datos={"cupon_id": str(cupon_id)},
        ).insert()
        await desbloqueo.set({"notificado": True})

    return desbloqueo


async def verificar_y_desbloquear_cupones(
    cliente_id: PydanticObjectId, empresa_id: PydanticObjectId,
) -> list[dict]:
    """Se llama una vez tras cada visita/venta (ver
    visita_service._evaluar_y_actualizar). Evalúa los cupones por_reto/
    por_requisito/privado (estos últimos solo si tienen reto_id o requisito
    configurado — un privado sin condición nunca se auto-desbloquea) activos
    de la empresa y desbloquea los que el cliente recién alcanzó."""
    candidatos = await Cupon.find(
        Cupon.empresa_id == empresa_id,
        Cupon.estado == EstadoCupon.activo,
        In(Cupon.visibilidad, [
            AccesoVisibilidad.por_reto, AccesoVisibilidad.por_requisito, AccesoVisibilidad.privado,
        ]),
    ).to_list()

    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if relacion is None:
        return []

    desbloqueados = []
    for cupon in candidatos:
        if not cupon.reto_id and not cupon.requisito:
            continue
        ya = await CuponDesbloqueado.find_one(
            CuponDesbloqueado.cliente_id == cliente_id, CuponDesbloqueado.cupon_id == cupon.id,
        )
        if ya:
            continue
        progreso, meta = await progreso_condicion_cupon(cupon, relacion, empresa_id, cliente_id)
        if meta <= 0 or progreso < meta:
            continue
        resultado = await desbloquear_cupon(cupon.id, cliente_id, empresa_id)
        if resultado:
            desbloqueados.append({"cupon_id": str(cupon.id), "nombre": cupon.nombre})
    return desbloqueados
