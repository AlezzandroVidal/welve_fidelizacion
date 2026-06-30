from datetime import datetime, timezone

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoMembresia, FrecuenciaMembresia


class Membresia(Document):
    """Definición del club mensual que la empresa ofrece (el plan, no la suscripción del cliente)."""

    empresa_id: Indexed(PydanticObjectId)
    nombre: str
    precio: float
    beneficio_descripcion: str
    frecuencia: FrecuenciaMembresia = FrecuenciaMembresia.mensual
    estado: EstadoMembresia = EstadoMembresia.activa
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "membresias"
        indexes = [
            IndexModel([("empresa_id", ASCENDING)]),
        ]
