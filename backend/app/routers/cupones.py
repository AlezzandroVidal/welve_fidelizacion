import json
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.models.enums import EstadoCupon
from app.schemas.canje import CanjeResponse
from app.schemas.cupon import CuponCreate, CuponResponse, CuponUpdate
from app.schemas.venta import ItemCarritoInput
from app.services import cupon_service, venta_service

router = APIRouter(prefix="/cupones", tags=["cupones"])


def _parse_id(cupon_id: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(cupon_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cupon_id inválido")


def _to_response(c) -> CuponResponse:
    return cupon_service.cupon_to_response(c)


def _canje_to_response(c) -> CanjeResponse:
    return CanjeResponse(
        id=str(c.id),
        empresaId=str(c.empresa_id),
        clienteId=str(c.cliente_id),
        cuponId=str(c.cupon_id),
        fecha=c.fecha,
        canal=c.canal,
        staffRef=c.staff_ref,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CuponResponse])
async def listar_cupones(
    estado: Optional[EstadoCupon] = Query(None, description="Filtrar por estado"),
    empresa: Empresa = Depends(get_current_empresa),
):
    cupones = await cupon_service.listar_cupones(empresa.id, filtro_estado=estado)
    return [_to_response(c) for c in cupones]


@router.post("", response_model=CuponResponse, status_code=status.HTTP_201_CREATED)
async def crear_cupon(data: CuponCreate, empresa: Empresa = Depends(get_current_empresa)):
    try:
        cupon = await cupon_service.crear_cupon(empresa.id, data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Ese código ya lo usa otro cupón")
    return _to_response(cupon)


@router.get("/buscar", response_model=CuponResponse)
async def buscar_por_codigo(codigo: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.buscar_por_codigo(empresa.id, codigo)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado para ese código")
    return _to_response(cupon)


@router.get("/validos-para-carrito", response_model=list[CuponResponse])
async def cupones_validos_para_carrito(
    items: str = Query(..., description='JSON: [{"producto_id": "...", "cantidad": 1}]'),
    cliente_id: str = Query(...),
    empresa: Empresa = Depends(get_current_empresa),
):
    try:
        crudos = json.loads(items)
        parsed = [ItemCarritoInput(**item) for item in crudos]
    except Exception:
        raise HTTPException(status_code=422, detail='items inválido — debe ser JSON: [{"producto_id", "cantidad"}]')

    cupones = await venta_service.listar_cupones_validos_para_carrito(
        empresa.id, parsed, _parse_id(cliente_id),
    )
    return [_to_response(c) for c in cupones]


@router.get("/{cupon_id}", response_model=CuponResponse)
async def obtener_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.obtener_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}", response_model=CuponResponse)
async def actualizar_cupon(
    cupon_id: str, data: CuponUpdate, empresa: Empresa = Depends(get_current_empresa),
):
    try:
        cupon = await cupon_service.actualizar_cupon(empresa.id, _parse_id(cupon_id), data)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Ese código ya lo usa otro cupón")
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}/pausar", response_model=CuponResponse)
async def pausar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.pausar_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}/activar", response_model=CuponResponse)
async def activar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.activar_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado o ya expirado")
    return _to_response(cupon)


@router.delete("/{cupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    try:
        deleted = await cupon_service.eliminar_cupon(empresa.id, _parse_id(cupon_id))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")


@router.get("/{cupon_id}/canjes", response_model=list[CanjeResponse])
async def listar_canjes_cupon(
    cupon_id: str,
    limit: int = Query(5, ge=1, le=50),
    empresa: Empresa = Depends(get_current_empresa),
):
    cid = _parse_id(cupon_id)
    cupon = await cupon_service.obtener_cupon(empresa.id, cid)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    canjes = await cupon_service.listar_canjes_cupon(empresa.id, cid, limit)
    return [_canje_to_response(c) for c in canjes]
