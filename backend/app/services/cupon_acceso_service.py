"""Visibilidad/desbloqueo de cupones (visibilidad=publico/vip/por_reto/
por_requisito/privado). Distinto de recompensas_engine: ahí un Canje
automático otorga Y canjea en el mismo paso; acá solo se desbloquea
(CuponDesbloqueado) — el cliente todavía tiene que mostrar su QR para
canjear. Progreso siempre en vivo, nunca cacheado."""

from typing import Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.cupon_desbloqueado import CuponDesbloqueado
from app.models.enums import AccesoVisibilidad, EstadoAcceso, SegmentoCliente
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.schemas.cupon_acceso import AccesoCupon
from app.services import cupon_validacion_service, progreso_service


def _acceso_oculto(mensaje: str = "") -> AccesoCupon:
    return AccesoCupon(
        puede_ver=False, puede_canjear=False, estado=EstadoAcceso.bloqueado,
        progreso_actual=0, progreso_meta=0, progreso_porcentaje=0, mensaje=mensaje,
    )


async def _limite_por_cliente_alcanzado(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, cupon: Cupon,
) -> bool:
    if cupon.limite_usos_por_cliente is None:
        return False
    usos = await Canje.find(
        Canje.empresa_id == empresa_id, Canje.cliente_id == cliente_id, Canje.cupon_id == cupon.id,
    ).count()
    return usos >= cupon.limite_usos_por_cliente


async def progreso_condicion_cupon(
    cupon: Cupon, relacion: RelacionClienteEmpresa, empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> tuple[float, float]:
    """(progreso_actual, meta) del reto o requisito ligado al cupón —
    (0, 0) si no tiene ninguno configurado (nada que evaluar)."""
    if cupon.reto_id:
        reto = await Reto.get(cupon.reto_id)
        if not reto:
            return 0.0, 0.0
        progreso = await progreso_service.calcular_progreso_reto(reto, relacion, empresa_id, cliente_id)
        return progreso, reto.condicion_valor
    if cupon.requisito:
        progreso = await progreso_service.calcular_progreso_requisito(cupon.requisito, relacion, empresa_id, cliente_id)
        return progreso, cupon.requisito.valor
    return 0.0, 0.0


async def _acceso_ya_desbloqueado(
    cupon: Cupon, cliente_id: PydanticObjectId, empresa_id: PydanticObjectId,
    progreso: float, meta: float, desbloqueo: CuponDesbloqueado,
) -> AccesoCupon:
    ok, motivo = cupon_validacion_service.es_canjeable(cupon)
    limite = await _limite_por_cliente_alcanzado(empresa_id, cliente_id, cupon)
    puede_canjear = ok and not limite
    return AccesoCupon(
        puede_ver=True, puede_canjear=puede_canjear,
        estado=EstadoAcceso.disponible if puede_canjear else EstadoAcceso.bloqueado,
        progreso_actual=progreso, progreso_meta=meta, progreso_porcentaje=100.0,
        mensaje="" if puede_canjear else (motivo if not ok else "Ya alcanzaste el límite de usos"),
        desbloqueado_en=desbloqueo.desbloqueado_en,
    )


async def evaluar_acceso_cupon(
    cupon: Cupon, cliente_id: Optional[PydanticObjectId], empresa_id: PydanticObjectId,
) -> AccesoCupon:
    """Determina si un cliente puede ver/canjear un cupón, y su progreso si
    aplica. Progreso siempre se computa en vivo (nunca cacheado)."""
    relacion: Optional[RelacionClienteEmpresa] = None
    if cliente_id is not None:
        relacion = await RelacionClienteEmpresa.find_one(
            RelacionClienteEmpresa.empresa_id == empresa_id,
            RelacionClienteEmpresa.cliente_id == cliente_id,
        )

    if cupon.visibilidad == AccesoVisibilidad.publico:
        ok, motivo = cupon_validacion_service.es_canjeable(cupon)
        limite = cliente_id is not None and await _limite_por_cliente_alcanzado(empresa_id, cliente_id, cupon)
        puede_canjear = cliente_id is not None and ok and not limite
        return AccesoCupon(
            puede_ver=True, puede_canjear=puede_canjear,
            estado=EstadoAcceso.disponible if puede_canjear else EstadoAcceso.bloqueado,
            progreso_actual=1, progreso_meta=1, progreso_porcentaje=100.0,
            mensaje="" if puede_canjear else (motivo if not ok else ""),
        )

    if cupon.visibilidad == AccesoVisibilidad.vip:
        es_vip = bool(relacion and relacion.segmento == SegmentoCliente.exclusivo)
        if not es_vip:
            return _acceso_oculto()
        ok, motivo = cupon_validacion_service.es_canjeable(cupon)
        limite = await _limite_por_cliente_alcanzado(empresa_id, cliente_id, cupon)
        puede_canjear = ok and not limite
        return AccesoCupon(
            puede_ver=True, puede_canjear=puede_canjear,
            estado=EstadoAcceso.disponible if puede_canjear else EstadoAcceso.bloqueado,
            progreso_actual=1, progreso_meta=1, progreso_porcentaje=100.0,
            mensaje="" if puede_canjear else motivo,
        )

    if cupon.visibilidad in (AccesoVisibilidad.por_reto, AccesoVisibilidad.por_requisito):
        mostrar_progreso = True
        if cupon.visibilidad == AccesoVisibilidad.por_reto:
            reto = await Reto.get(cupon.reto_id) if cupon.reto_id else None
            if not reto:
                return _acceso_oculto("Reto no encontrado")
            mostrar_progreso = reto.mostrar_progreso_publico
        elif not cupon.requisito:
            return _acceso_oculto("Requisito no configurado")

        if cliente_id is None or relacion is None:
            if not mostrar_progreso:
                return _acceso_oculto()
            return AccesoCupon(
                puede_ver=True, puede_canjear=False, estado=EstadoAcceso.bloqueado,
                progreso_actual=0, progreso_meta=0, progreso_porcentaje=0,
                mensaje="Inicia sesión para ver tu progreso",
            )

        desbloqueo = await CuponDesbloqueado.find_one(
            CuponDesbloqueado.cliente_id == cliente_id, CuponDesbloqueado.cupon_id == cupon.id,
        )
        progreso, meta = await progreso_condicion_cupon(cupon, relacion, empresa_id, cliente_id)
        if desbloqueo:
            return await _acceso_ya_desbloqueado(cupon, cliente_id, empresa_id, progreso, meta, desbloqueo)

        if meta > 0 and progreso >= meta:
            return AccesoCupon(
                puede_ver=True, puede_canjear=False, estado=EstadoAcceso.desbloqueado_pendiente,
                progreso_actual=progreso, progreso_meta=meta, progreso_porcentaje=100.0,
                mensaje="¡Ya cumpliste la condición! Tu cupón se está desbloqueando.",
            )
        if not mostrar_progreso:
            return _acceso_oculto()
        porcentaje = min(100.0, (progreso / meta * 100)) if meta > 0 else 0.0
        faltante = max(0.0, meta - progreso)
        return AccesoCupon(
            puede_ver=True, puede_canjear=False, estado=EstadoAcceso.en_progreso,
            progreso_actual=progreso, progreso_meta=meta, progreso_porcentaje=porcentaje,
            mensaje=f"Te falta {faltante:.0f} para desbloquear este cupón",
        )

    # privado — nunca visible sin importar el progreso, ni siquiera "en progreso"
    if cliente_id is None:
        return _acceso_oculto()
    desbloqueo = await CuponDesbloqueado.find_one(
        CuponDesbloqueado.cliente_id == cliente_id, CuponDesbloqueado.cupon_id == cupon.id,
    )
    if not desbloqueo:
        return _acceso_oculto()
    return await _acceso_ya_desbloqueado(cupon, cliente_id, empresa_id, 1, 1, desbloqueo)
