from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoMembresiaCliente


class MembresiaCliente(Document):
    """Estado de suscripción de un cliente a una membresía. Sin pasarela de pago real en v1."""

    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Indexed(PydanticObjectId)
    membresia_id: Indexed(PydanticObjectId)
    estado: EstadoMembresiaCliente = EstadoMembresiaCliente.activa
    fecha_inicio: datetime
    fecha_proximo_cobro: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "membresias_clientes"
        indexes = [
            IndexModel(
                [("empresa_id", ASCENDING), ("cliente_id", ASCENDING), ("membresia_id", ASCENDING)],
                unique=True,
                name="empresa_cliente_membresia_unique",
            ),
        ]
