from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_empresa_admin
from app.models.empresa import Empresa
from app.models.enums import EstadoProducto, TipoMovimiento, TipoProducto
from app.models.producto import MovimientoInventario, Producto
from app.schemas.producto import (
    ActualizarStockRequest,
    MovimientoInventarioResponse,
    ProductoCreate,
    ProductoResponse,
    ProductoUpdate,
)
from app.services import producto_service

router = APIRouter(prefix="/productos", tags=["productos"])


def _parse_id(value: str, campo: str = "producto_id") -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"{campo} inválido")


def _mov_to_response(m: MovimientoInventario, producto: Optional[Producto] = None) -> MovimientoInventarioResponse:
    return MovimientoInventarioResponse(
        id=str(m.id), empresaId=str(m.empresa_id), productoId=str(m.producto_id),
        productoNombre=producto.nombre if producto else None,
        productoSku=producto.sku if producto else None,
        tipo=m.tipo, cantidad=m.cantidad, stockAnterior=m.stock_anterior, stockNuevo=m.stock_nuevo,
        motivo=m.motivo, ventaId=str(m.venta_id) if m.venta_id else None,
        createdAt=m.created_at, createdBy=m.created_by,
    )


@router.get("", response_model=list[ProductoResponse])
async def listar_productos(
    estado: Optional[EstadoProducto] = None,
    tipo: Optional[TipoProducto] = None,
    categoria: Optional[str] = None,
    q: Optional[str] = Query(None, description="Búsqueda por nombre/SKU/código de barras"),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    productos = await producto_service.listar_productos(empresa.id, estado, tipo, categoria, q)
    return [producto_service.producto_to_response(p) for p in productos]


@router.get("/buscar", response_model=ProductoResponse)
async def buscar_por_codigo(codigo: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    producto = await producto_service.buscar_por_codigo(empresa.id, codigo)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado para ese código")
    return producto_service.producto_to_response(producto)


@router.get("/alertas-stock", response_model=list[ProductoResponse])
async def alertas_stock(empresa: Empresa = Depends(get_current_empresa_admin)):
    productos = await producto_service.alertas_stock(empresa.id)
    return [producto_service.producto_to_response(p) for p in productos]


@router.get("/movimientos/todos", response_model=list[MovimientoInventarioResponse])
async def historial_movimientos_empresa(
    producto_id: Optional[str] = None,
    tipo: Optional[TipoMovimiento] = None,
    limit: int = Query(50, ge=1, le=200),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    pid = _parse_id(producto_id, "producto_id") if producto_id else None
    movimientos = await producto_service.historial_movimientos_empresa(empresa.id, pid, tipo, limit)

    producto_ids = {m.producto_id for m in movimientos}
    productos = await Producto.find({"_id": {"$in": list(producto_ids)}}).to_list() if producto_ids else []
    productos_map = {p.id: p for p in productos}

    return [_mov_to_response(m, productos_map.get(m.producto_id)) for m in movimientos]


@router.get("/{producto_id}", response_model=ProductoResponse)
async def obtener_producto(producto_id: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    producto = await producto_service.obtener_producto(empresa.id, _parse_id(producto_id))
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_service.producto_to_response(producto)


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def crear_producto(data: ProductoCreate, empresa: Empresa = Depends(get_current_empresa_admin)):
    producto = await producto_service.crear_producto(empresa.id, data)
    return producto_service.producto_to_response(producto)


@router.patch("/{producto_id}", response_model=ProductoResponse)
async def actualizar_producto(
    producto_id: str, data: ProductoUpdate, empresa: Empresa = Depends(get_current_empresa_admin),
):
    producto = await producto_service.actualizar_producto(empresa.id, _parse_id(producto_id), data)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_service.producto_to_response(producto)


@router.patch("/{producto_id}/stock", response_model=ProductoResponse)
async def actualizar_stock(
    producto_id: str, data: ActualizarStockRequest, empresa: Empresa = Depends(get_current_empresa_admin),
):
    producto = await producto_service.actualizar_stock(
        empresa.id, _parse_id(producto_id), data.cantidad, data.tipo, data.motivo,
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_service.producto_to_response(producto)


@router.get("/{producto_id}/movimientos", response_model=list[MovimientoInventarioResponse])
async def historial_movimientos(
    producto_id: str,
    limit: int = Query(20, ge=1, le=100),
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    pid = _parse_id(producto_id)
    producto = await producto_service.obtener_producto(empresa.id, pid)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    movimientos = await producto_service.historial_movimientos(empresa.id, pid, limit)
    return [_mov_to_response(m) for m in movimientos]


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_producto(producto_id: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    try:
        deleted = await producto_service.eliminar_producto(empresa.id, _parse_id(producto_id))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
