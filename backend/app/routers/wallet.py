from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Dict, List, Optional
from beanie import PydanticObjectId

from app.core.deps import get_global_cliente, get_optional_cliente
from app.models.cliente import Cliente
from app.schemas.cliente import CambiarPasswordRequest, FotoClienteUpload, PerfilUpdateRequest
from app.schemas.cupon import CuponDetalleResponse
from app.schemas.notificacion import NotificacionResponse
from app.services import cliente_service, notificacion_service, wallet_service

router = APIRouter(tags=["wallet"])


def _notificacion_to_response(n) -> NotificacionResponse:
    return NotificacionResponse(
        id=str(n.id),
        clienteId=str(n.cliente_id),
        empresaId=str(n.empresa_id),
        tipo=n.tipo,
        titulo=n.titulo,
        mensaje=n.mensaje,
        datos=n.datos,
        leida=n.leida,
        createdAt=n.created_at,
    )

@router.get("/empresas", response_model=Dict[str, List[Dict[str, Any]]])
async def get_empresas(cliente: Cliente = Depends(get_global_cliente)):
    empresas = await wallet_service.get_empresas_wallet(cliente.id)
    return {"empresas": empresas}

@router.get("/empresas/{empresa_id}", response_model=Dict[str, Any])
async def get_empresa_detalle(empresa_id: PydanticObjectId, cliente: Optional[Cliente] = Depends(get_optional_cliente)):
    """Público (como get_cupon_detalle) — la página de empresa del wallet es
    compartible sin sesión; sin cliente, mi_relacion/progreso de retos caen
    a None/0 pero el contenido (cupones públicos, retos, info) se ve igual."""
    return await wallet_service.get_empresa_detalle(empresa_id, cliente.id if cliente else None)

@router.get("/empresas/{empresa_id}/cupones", response_model=Dict[str, List[Dict[str, Any]]])
async def get_cupones_por_empresa(
    empresa_id: PydanticObjectId,
    tag: Optional[str] = None,
    destacado: Optional[bool] = None,
    cliente: Cliente = Depends(get_global_cliente),
):
    cupones = await wallet_service.get_cupones_por_empresa(empresa_id, tag=tag, destacado=destacado)
    return {"cupones": cupones}

@router.get("/cupones/destacados", response_model=Dict[str, List[Dict[str, Any]]])
async def get_cupones_destacados(cliente: Cliente = Depends(get_global_cliente)):
    cupones = await wallet_service.get_cupones_destacados()
    return {"cupones": cupones}

@router.get("/cupones/{cupon_id}/detalle", response_model=CuponDetalleResponse)
async def get_cupon_detalle(cupon_id: PydanticObjectId, cliente: Optional[Cliente] = Depends(get_optional_cliente)):
    """Único endpoint público del router: no requiere sesión (usado por la
    página compartible /wallet/cupon/:id), pero es auth-aware vía
    `get_optional_cliente` para calcular `estaDisponibleParaMi`."""
    return await wallet_service.get_cupon_detalle(cupon_id, cliente)

@router.get("/mis-cupones", response_model=Dict[str, Any])
async def get_mis_cupones(cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_mis_cupones(cliente.id)

@router.get("/cupones", response_model=Dict[str, Any])
async def get_cupones(cliente: Cliente = Depends(get_global_cliente)):
    """Todos los cupones que el cliente puede ver de TODAS las empresas
    activas (público/vip/en-progreso/desbloqueados), sin exigir afiliación
    previa — a diferencia de /mis-cupones. Usado por los tabs Disponibles/
    En progreso de MisCuponesPage."""
    return await wallet_service.get_cupones_wallet(cliente.id)

@router.get("/cupones/desbloqueados", response_model=List[Dict[str, Any]])
async def get_cupones_desbloqueados(cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_cupones_desbloqueados(cliente.id)

@router.post("/cupones/{cupon_id}/desbloquear", response_model=Dict[str, Any])
async def desbloquear_cupon(cupon_id: PydanticObjectId, cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.confirmar_desbloqueo_cupon(cupon_id, cliente.id)

@router.get("/notificaciones", response_model=List[NotificacionResponse])
async def get_notificaciones(cliente: Cliente = Depends(get_global_cliente)):
    notifs = await notificacion_service.listar_no_leidas(cliente.id)
    return [_notificacion_to_response(n) for n in notifs]

@router.post("/notificaciones/{notificacion_id}/leer", status_code=204)
async def marcar_notificacion_leida(notificacion_id: PydanticObjectId, cliente: Cliente = Depends(get_global_cliente)):
    await notificacion_service.marcar_leida(notificacion_id, cliente.id)

@router.post("/notificaciones/leer-todas", response_model=Dict[str, int])
async def marcar_todas_notificaciones_leidas(cliente: Cliente = Depends(get_global_cliente)):
    total = await notificacion_service.marcar_todas_leidas(cliente.id)
    return {"marcadas": total}

@router.get("/mis-retos", response_model=List[Dict[str, Any]])
async def get_mis_retos(cliente: Cliente = Depends(get_global_cliente)):
    return await wallet_service.get_mis_retos(cliente.id)

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
