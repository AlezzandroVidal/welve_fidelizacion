from fastapi import APIRouter, Depends, HTTPException, status

from beanie import PydanticObjectId

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.models.cupon import Cupon
from app.schemas.reto import AsignarCuponesRequest, RetoCreate, RetoResponse, RetoUpdate
from app.services import reto_service
from beanie.operators import In

router = APIRouter(prefix="/retos", tags=["retos"])


def _to_response(r, cupon_nombre: str = None) -> RetoResponse:
    return RetoResponse(
        id=str(r.id),
        empresaId=str(r.empresa_id),
        nombre=r.nombre,
        condicionTipo=r.condicion_tipo,
        condicionValor=r.condicion_valor,
        periodoDias=r.periodo_dias,
        productoObjetivoId=str(r.producto_objetivo_id) if r.producto_objetivo_id else None,
        categoriaObjetivo=r.categoria_objetivo,
        fechaInicio=r.fecha_inicio,
        fechaFin=r.fecha_fin,
        recompensaCuponId=str(r.recompensa_cupon_id) if r.recompensa_cupon_id else None,
        recompensaCuponNombre=cupon_nombre,
        descripcionRecompensa=r.descripcion_recompensa,
        mostrarProgresoPublico=r.mostrar_progreso_publico,
        notificarAlCompletar=r.notificar_al_completar,
        mensajeCompletado=r.mensaje_completado,
        notificado=r.notificado,
        cancelado=r.cancelado,
    )

async def _hydrate_retos(retos):
    if not retos:
        return []
    cupon_ids = [r.recompensa_cupon_id for r in retos if r.recompensa_cupon_id]
    cupones = await Cupon.find(In(Cupon.id, cupon_ids)).to_list() if cupon_ids else []
    cupmap = {c.id: c.nombre for c in cupones}
    return [_to_response(r, cupmap.get(r.recompensa_cupon_id)) for r in retos]


@router.post("", response_model=RetoResponse, status_code=status.HTTP_201_CREATED)
async def crear_reto(data: RetoCreate, empresa: Empresa = Depends(get_current_empresa)):
    reto = await reto_service.crear_reto(empresa.id, data)
    res = await _hydrate_retos([reto])
    return res[0]

@router.get("", response_model=list[RetoResponse])
async def listar_retos(empresa: Empresa = Depends(get_current_empresa)):
    retos = await reto_service.listar_retos(empresa.id)
    return await _hydrate_retos(retos)


@router.get("/{reto_id}", response_model=RetoResponse)
async def obtener_reto(reto_id: str, empresa: Empresa = Depends(get_current_empresa)):
    try:
        rid = PydanticObjectId(reto_id)
    except Exception:
        raise HTTPException(status_code=422, detail="reto_id inválido")
    reto = await reto_service.obtener_reto(empresa.id, rid)
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado")
    res = await _hydrate_retos([reto])
    return res[0]


def _parse_id(reto_id: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(reto_id)
    except Exception:
        raise HTTPException(status_code=422, detail="reto_id inválido")


@router.patch("/{reto_id}", response_model=RetoResponse)
async def actualizar_reto(reto_id: str, data: RetoUpdate, empresa: Empresa = Depends(get_current_empresa)):
    reto = await reto_service.actualizar_reto(empresa.id, _parse_id(reto_id), data)
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado")
    res = await _hydrate_retos([reto])
    return res[0]


@router.post("/{reto_id}/cancelar", response_model=RetoResponse)
async def cancelar_reto(reto_id: str, empresa: Empresa = Depends(get_current_empresa)):
    reto = await reto_service.cancelar_reto(empresa.id, _parse_id(reto_id))
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado")
    res = await _hydrate_retos([reto])
    return res[0]


@router.post("/{reto_id}/reactivar", response_model=RetoResponse)
async def reactivar_reto(reto_id: str, empresa: Empresa = Depends(get_current_empresa)):
    reto = await reto_service.reactivar_reto(empresa.id, _parse_id(reto_id))
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado")
    res = await _hydrate_retos([reto])
    return res[0]


@router.put("/{reto_id}/cupones", response_model=list[str])
async def asignar_cupones(reto_id: str, data: AsignarCuponesRequest, empresa: Empresa = Depends(get_current_empresa)):
    """Cupones que este reto desbloquea (visibilidad=por_reto) — un reto
    puede desbloquear varios a la vez. Reemplaza la lista completa (no es
    un append); el frontend manda siempre el set final seleccionado."""
    rid = _parse_id(reto_id)
    if not await reto_service.obtener_reto(empresa.id, rid):
        raise HTTPException(status_code=404, detail="Reto no encontrado")
    cupones = await reto_service.asignar_cupones(empresa.id, rid, data.cupon_ids)
    return [str(c.id) for c in cupones]
