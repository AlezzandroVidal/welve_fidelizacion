from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoVenta, MetodoPagoVenta


class ItemVenta(BaseModel):
    producto_id: PydanticObjectId
    nombre_producto: str  # snapshot al momento de venta
    sku: str
    cantidad: int
    precio_unitario: float  # snapshot del precio en el momento de la venta
    subtotal: float  # cantidad * precio_unitario
    descuento_item: float = 0.0


class Venta(Document):
    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Optional[PydanticObjectId] = None
    codigo_cliente: Optional[str] = None

    items: list[ItemVenta]

    subtotal: float
    descuento_monto: float = 0.0
    descuento_porcentaje: float = 0.0
    igv: float
    total: float

    cupon_id: Optional[PydanticObjectId] = None
    cupon_codigo: Optional[str] = None
    canje_id: Optional[PydanticObjectId] = None

    metodo_pago: MetodoPagoVenta
    monto_efectivo: Optional[float] = None
    monto_tarjeta: Optional[float] = None
    monto_yape: Optional[float] = None
    vuelto: Optional[float] = None

    estado: EstadoVenta = EstadoVenta.completada

    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "staff"

    class Settings:
        name = "ventas"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("created_at", ASCENDING)]),
            IndexModel([("empresa_id", ASCENDING), ("cliente_id", ASCENDING)]),
        ]
