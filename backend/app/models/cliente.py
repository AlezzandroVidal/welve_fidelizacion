from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class Cliente(Document):
    """Identidad global del cliente B2C. Sin historial por empresa — eso vive en RelacionClienteEmpresa."""

    nombre: str
    email: Optional[str] = None       # al menos uno de email/whatsapp requerido
    whatsapp: Optional[str] = None    # formato E.164
    password_hash: Optional[str] = None # Added for email/password login
    fecha_alta: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clientes"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True, sparse=True),
            IndexModel([("whatsapp", ASCENDING)], unique=True, sparse=True),
        ]
