from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import CanalCanje


class Canje(Document):
    """Registro inmutable de cada redención. Nunca se actualiza, solo se inserta."""

    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Indexed(PydanticObjectId)
    cupon_id: Indexed(PydanticObjectId)
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    canal: CanalCanje
    staff_ref: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "canjes"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("cliente_id", ASCENDING), ("fecha", ASCENDING)]),
            IndexModel([("empresa_id", ASCENDING), ("cupon_id", ASCENDING)]),
        ]
