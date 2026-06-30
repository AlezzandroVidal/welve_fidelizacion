from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import EmailStr, Field

from app.models.enums import WelveAdminRol


class WelveAdmin(Document):
    """Administrador interno de la plataforma Welve (no es un admin de empresa)."""

    email: Indexed(EmailStr, unique=True)
    password_hash: str
    nombre: str
    rol: WelveAdminRol = WelveAdminRol.soporte
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "welve_admins"
