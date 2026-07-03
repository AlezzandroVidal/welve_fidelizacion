from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoProducto, TipoMovimiento, TipoProducto, UnidadMedida


class Producto(Document):
    empresa_id: Indexed(PydanticObjectId)

    nombre: str
    descripcion: Optional[str] = None
    descripcion_larga: Optional[str] = None
    tipo: TipoProducto = TipoProducto.producto
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None

    sku: str
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None

    precio_base: float
    precio_con_igv: float
    moneda: str = "PEN"
    tiene_igv: bool = True

    gestionar_inventario: bool = True
    stock_actual: int = 0
    stock_minimo: int = 5
    stock_maximo: Optional[int] = None
    unidad_medida: UnidadMedida = UnidadMedida.unidad

    imagen_url: Optional[str] = None
    imagenes_adicionales: list[str] = Field(default_factory=list)

    estado: EstadoProducto = EstadoProducto.activo
    disponible_para_venta: bool = True

    tags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "productos"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("sku", ASCENDING)], unique=True),
            IndexModel([("empresa_id", ASCENDING), ("codigo_barras", ASCENDING)]),
            IndexModel([("empresa_id", ASCENDING), ("estado", ASCENDING)]),
        ]


class MovimientoInventario(Document):
    empresa_id: Indexed(PydanticObjectId)
    producto_id: Indexed(PydanticObjectId)
    tipo: TipoMovimiento
    cantidad: int  # positivo = entrada, negativo = salida
    stock_anterior: int
    stock_nuevo: int
    motivo: Optional[str] = None
    venta_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "staff"

    class Settings:
        name = "movimientos_inventario"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("producto_id", ASCENDING), ("created_at", ASCENDING)]),
        ]
