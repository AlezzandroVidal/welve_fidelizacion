from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoEmpresa, PlanSuscripcion, RubroEmpresa


class EmpresaConfig(BaseModel):
    racha_dias_ruptura: int = 7
    soles_por_punto: float = 1.0
    expiracion_meses: int = 12


class Empresa(Document):
    nombre: str
    rubro: RubroEmpresa
    logo_url: str | None = None          # data URI base64 o URL externa
    telefono_contacto: str | None = None
    admin_email: Indexed(EmailStr, unique=True)
    admin_password_hash: str
    plan_suscripcion: PlanSuscripcion = PlanSuscripcion.starter
    estado: EstadoEmpresa = EstadoEmpresa.activo
    config: EmpresaConfig = Field(default_factory=EmpresaConfig)
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "empresas"
        indexes = [
            IndexModel([("admin_email", ASCENDING)], unique=True),
        ]
