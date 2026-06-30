from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_empresa_admin
from app.models.empresa import Empresa
from app.schemas.metricas import PuntoTiempo, ResumenResponse, TopCupon
from app.services import metricas_service

router = APIRouter(prefix="/metricas", tags=["metricas"])


@router.get("/resumen", response_model=ResumenResponse)
async def resumen(empresa: Empresa = Depends(get_current_empresa_admin)):
    return await metricas_service.obtener_resumen(empresa.id)


@router.get("/canjes-por-dia", response_model=list[PuntoTiempo])
async def canjes_por_dia(
    dias: int = Query(default=30, ge=1, le=365),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    return await metricas_service.canjes_por_dia(empresa.id, dias)


@router.get("/top-cupones", response_model=list[TopCupon])
async def top_cupones(
    limit: int = Query(default=5, ge=1, le=20),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    return await metricas_service.top_cupones(empresa.id, limit)


@router.get("/clientes-nuevos", response_model=list[PuntoTiempo])
async def clientes_nuevos(
    dias: int = Query(default=30, ge=1, le=365),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    return await metricas_service.clientes_nuevos_por_dia(empresa.id, dias)
