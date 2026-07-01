from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Dict, List
from beanie import PydanticObjectId

from app.core.deps import get_global_cliente
from app.models.cliente import Cliente
from app.schemas.cliente import CambiarPasswordRequest, FotoClienteUpload, PerfilUpdateRequest
from app.services import cliente_service, wallet_service

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

@router.get("/mi-qr/{empresa_id}", response_model=Dict[str, Any])
async def get_mi_qr(empresa_id: PydanticObjectId, cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_mi_qr(empresa_id, cliente.id)

@router.patch("/perfil", response_model=Dict[str, Any])
async def actualizar_perfil(data: PerfilUpdateRequest, cliente: Cliente = Depends(get_global_cliente)):
    _, error = await cliente_service.actualizar_perfil(cliente, data.nombre, data.email, data.whatsapp)
    if error:
        raise HTTPException(status_code=409, detail=error)
    return await wallet_service.get_perfil(cliente.id)

@router.post("/perfil/password", response_model=Dict[str, Any])
async def cambiar_password(data: CambiarPasswordRequest, cliente: Cliente = Depends(get_global_cliente)):
    ok, error = await cliente_service.cambiar_password(cliente, data.password_actual, data.password_nueva)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return await wallet_service.get_perfil(cliente.id)

@router.post("/perfil/foto", response_model=Dict[str, Any])
async def subir_foto(data: FotoClienteUpload, cliente: Cliente = Depends(get_global_cliente)):
    """Recibe un data URI base64 (data:image/png;base64,...), máx ~2 MB — mismo
    esquema que el logo de empresa (ver routers/empresas.py)."""
    data_uri = data.data_uri.strip()
    if not data_uri.startswith("data:image/"):
        raise HTTPException(status_code=422, detail="Formato inválido: se espera un data URI de imagen")
    if len(data_uri) > 2_800_000:
        raise HTTPException(status_code=413, detail="La imagen supera el límite de 2 MB")

    cliente.foto_url = data_uri
    await cliente.save()
    return await wallet_service.get_perfil(cliente.id)

@router.delete("/perfil/foto", response_model=Dict[str, Any])
async def eliminar_foto(cliente: Cliente = Depends(get_global_cliente)):
    cliente.foto_url = None
    await cliente.save()
    return await wallet_service.get_perfil(cliente.id)
