from fastapi import APIRouter, Depends, HTTPException

from beanie import PydanticObjectId

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.schemas.relacion import RelacionResponse
from app.services import relacion_service

router = APIRouter(prefix="/relaciones", tags=["relaciones"])


def _to_response(r) -> RelacionResponse:
    return RelacionResponse(
        id=str(r.id),
        empresaId=str(r.empresa_id),
        clienteId=str(r.cliente_id),
        visitasTotales=r.visitas_totales,
        montoAcumulado=r.monto_acumulado,
        rachaActual=r.racha_actual,
        rachaMaxima=r.racha_maxima,
        ultimaVisita=r.ultima_visita,
        segmento=r.segmento,
        puntos=r.puntos,
    )


@router.get("/", response_model=list[RelacionResponse])
async def listar_relaciones(empresa: Empresa = Depends(get_current_empresa)):
    relaciones = await relacion_service.listar_relaciones_empresa(empresa.id)
    return [_to_response(r) for r in relaciones]


@router.get("/{cliente_id}", response_model=RelacionResponse)
async def obtener_relacion(cliente_id: str, empresa: Empresa = Depends(get_current_empresa)):
    try:
        cid = PydanticObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cliente_id inválido")
    relacion = await relacion_service.obtener_relacion(empresa.id, cid)
    if not relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    return _to_response(relacion)
