from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class Resena(Document):
    """Calificación (1-5 estrellas) + comentario opcional de un cliente sobre
    una empresa. Una por (empresa, cliente) — dejar una nueva reseña actualiza
    la existente en vez de duplicarla."""

    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Indexed(PydanticObjectId)
    estrellas: int
    comentario: Optional[str] = None
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resenas"
        indexes = [
            IndexModel(
                [("empresa_id", ASCENDING), ("cliente_id", ASCENDING)],
                unique=True,
                name="empresa_cliente_unique",
            ),
            IndexModel([("empresa_id", ASCENDING), ("fecha", ASCENDING)]),
        ]
