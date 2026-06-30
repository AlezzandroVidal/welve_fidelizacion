from fastapi import APIRouter, Depends, Query
from typing import Any, Dict, List
from beanie import PydanticObjectId

from app.core.deps import get_global_cliente
from app.models.cliente import Cliente
from app.services import wallet_service

router = APIRouter(tags=["wallet"])

@router.get("/empresas", response_model=Dict[str, List[Dict[str, Any]]])
async def get_empresas(cliente: Cliente = Depends(get_global_cliente)):
    empresas = await wallet_service.get_empresas_wallet(cliente.id)
    return {"empresas": empresas}

@router.get("/empresas/{empresa_id}", response_model=Dict[str, Any])
async def get_empresa_detalle(empresa_id: PydanticObjectId, cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_empresa_detalle(empresa_id, cliente.id)

@router.get("/mis-cupones", response_model=Dict[str, Any])
async def get_mis_cupones(cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_mis_cupones(cliente.id)

@router.get("/historial", response_model=Dict[str, Any])
async def get_historial(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_historial(cliente.id, page, limit)

@router.get("/perfil", response_model=Dict[str, Any])
async def get_perfil(cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_perfil(cliente.id)
