from datetime import datetime, timezone

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, EmailStr, Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoEmpresa, PlanSuscripcion, RubroEmpresa


class RecompensaAutomatica(BaseModel):
    """Regla 'en la visita N -> entrega este cupón', configurada por la empresa."""

    visitas_requeridas: int
    cupon_id: PydanticObjectId
    activa: bool = True
    descripcion: str


class EmpresaConfig(BaseModel):
    racha_dias_ruptura: int = 7
    soles_por_punto: float = 1.0
    expiracion_meses: int = 12
    recompensas_automaticas: list[RecompensaAutomatica] = Field(default_factory=list)
    # Umbral de segmento exclusivo (PRODUCT.MD 6.4): ventana móvil de canjes, no
    # visitas de por vida. Ver app/services/segmento_service.py.
    umbral_exclusivo_canjes: int = 10
    umbral_exclusivo_dias: int = 90
    dias_gracia_exclusivo: int = 30


class Empresa(Document):
    nombre: str
    rubro: RubroEmpresa
    logo_url: str | None = None          # data URI base64 o URL externa
    imagen_portada_url: str | None = None          # data URI base64 o URL externa
    telefono_contacto: str | None = None
    descripcion: str | None = None
    direccion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    horario: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    tiktok: str | None = None
    sitio_web: str | None = None
    admin_email: Indexed(EmailStr, unique=True)
    admin_password_hash: str
    plan_suscripcion: PlanSuscripcion = PlanSuscripcion.starter
    fecha_vencimiento_plan: datetime | None = None
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
