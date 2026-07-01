from pydantic import BaseModel, EmailStr

from app.models.enums import EstadoEmpresa, PlanSuscripcion, RubroEmpresa


class EmpresaRegister(BaseModel):
    nombre: str
    rubro: RubroEmpresa
    admin_email: EmailStr
    admin_password: str
    plan_suscripcion: PlanSuscripcion = PlanSuscripcion.starter


class EmpresaResponse(BaseModel):
    id: str
    nombre: str
    rubro: RubroEmpresa
    logoUrl: str | None = None
    telefonoContacto: str | None = None
    adminEmail: EmailStr
    planSuscripcion: PlanSuscripcion
    estado: EstadoEmpresa
    rachaDiasRuptura: int
    solesPorPunto: float
    expiracionMeses: int

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    admin_email: EmailStr
    admin_password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"

class EmpresaUpdate(BaseModel):
    nombre: str | None = None
    telefono_contacto: str | None = None
    racha_dias_ruptura: int | None = None
    soles_por_punto: float | None = None
    expiracion_meses: int | None = None
    logo_url: str | None = None


class EmpresaLogoUpload(BaseModel):
    """data URI base64 (data:image/...;base64,...) — máx ~2 MB."""
    data_uri: str


class RecompensaAutomaticaCreate(BaseModel):
    visitas_requeridas: int
    cupon_id: str
    descripcion: str


class RecompensaAutomaticaUpdate(BaseModel):
    visitas_requeridas: int | None = None
    cupon_id: str | None = None
    descripcion: str | None = None
    activa: bool | None = None


class RecompensaAutomaticaResponse(BaseModel):
    index: int
    visitasRequeridas: int
    cuponId: str
    cuponNombre: str | None = None
    activa: bool
    descripcion: str
