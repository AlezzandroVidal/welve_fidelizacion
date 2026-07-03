from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.enums import EstadoPago, MetodoPago, PlanSuscripcion


class Pago(Document):
    empresa_id: Indexed(PydanticObjectId)
    monto: float
    moneda: str = "PEN"
    plan: PlanSuscripcion
    concepto: str
    estado: EstadoPago = EstadoPago.pendiente
    metodo_pago: MetodoPago

    # Datos de tarjeta enmascarados — nunca se guarda el número completo ni el CVV.
    ultimos_4: Optional[str] = None
    marca_tarjeta: Optional[str] = None
    nombre_titular: Optional[str] = None

    referencia: Indexed(str, unique=True)
    fecha_pago: Optional[datetime] = None
    fecha_vencimiento_plan: Optional[datetime] = None
    motivo_rechazo: Optional[str] = None
    ip_origen: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "pagos"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("referencia", ASCENDING)], unique=True),
        ]
