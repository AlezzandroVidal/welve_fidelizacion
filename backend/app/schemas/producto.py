from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.enums import EstadoProducto, TipoMovimiento, TipoProducto, UnidadMedida


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    descripcion_larga: Optional[str] = None
    tipo: TipoProducto = TipoProducto.producto
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    sku: Optional[str] = None  # auto-generado si no se provee
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    precio_base: float
    tiene_igv: bool = True
    gestionar_inventario: bool = True
    stock_actual: int = 0
    stock_minimo: int = 5
    stock_maximo: Optional[int] = None
    unidad_medida: UnidadMedida = UnidadMedida.unidad
    imagen_url: Optional[str] = None
    imagenes_adicionales: list[str] = []
    tags: list[str] = []

    @field_validator("nombre")
    @classmethod
    def nombre_min_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v.strip()

    @field_validator("precio_base")
    @classmethod
    def precio_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("precio_base debe ser mayor a 0")
        return v

    @field_validator("stock_actual", "stock_minimo")
    @classmethod
    def stock_no_negativo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    descripcion_larga: Optional[str] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    sku: Optional[str] = None
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    precio_base: Optional[float] = None
    tiene_igv: Optional[bool] = None
    gestionar_inventario: Optional[bool] = None
    stock_minimo: Optional[int] = None
    stock_maximo: Optional[int] = None
    unidad_medida: Optional[UnidadMedida] = None
    imagen_url: Optional[str] = None
    imagenes_adicionales: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    estado: Optional[EstadoProducto] = None
    disponible_para_venta: Optional[bool] = None


class ActualizarStockRequest(BaseModel):
    cantidad: int  # delta: positivo = entrada, negativo = salida
    tipo: TipoMovimiento
    motivo: Optional[str] = None


class ProductoResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    descripcion: Optional[str] = None
    descripcionLarga: Optional[str] = None
    tipo: TipoProducto
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    sku: str
    codigoBarras: Optional[str] = None
    codigoQr: Optional[str] = None
    precioBase: float
    precioConIgv: float
    moneda: str
    tieneIgv: bool
    gestionarInventario: bool
    stockActual: int
    stockMinimo: int
    stockMaximo: Optional[int] = None
    unidadMedida: UnidadMedida
    imagenUrl: Optional[str] = None
    imagenesAdicionales: list[str] = []
    estado: EstadoProducto
    disponibleParaVenta: bool
    tags: list[str] = []
    enAlertaStock: bool
    createdAt: datetime
    updatedAt: datetime


class MovimientoInventarioResponse(BaseModel):
    id: str
    empresaId: str
    productoId: str
    productoNombre: Optional[str] = None
    productoSku: Optional[str] = None
    tipo: TipoMovimiento
    cantidad: int
    stockAnterior: int
    stockNuevo: int
    motivo: Optional[str] = None
    ventaId: Optional[str] = None
    createdAt: datetime
    createdBy: str
