from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import EstadoEmpresa, PlanSuscripcion, RubroEmpresa


class EmpresaRegister(BaseModel):
    nombre: str
    rubro: RubroEmpresa
    admin_nombre: str
    admin_email: EmailStr
    admin_password: str
    admin_telefono: str | None = None
    direccion: str | None = None
    descripcion: str | None = None
    plan_suscripcion: PlanSuscripcion = PlanSuscripcion.starter


class EmpresaResponse(BaseModel):
    id: str
    nombre: str
    rubro: RubroEmpresa
    logoUrl: str | None = None
    imagenPortadaUrl: str | None = None
    telefonoContacto: str | None = None
    descripcion: str | None = None
    direccion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    horario: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    tiktok: str | None = None
    sitioWeb: str | None = None
    adminNombre: str
    adminEmail: EmailStr
    adminTelefono: str | None = None
    planSuscripcion: PlanSuscripcion
    fechaVencimientoPlan: datetime | None = None
    estado: EstadoEmpresa
    rachaDiasRuptura: int
    solesPorPunto: float
    expiracionMeses: int
    umbralExclusivoCanjes: int
    umbralExclusivoDias: int
    diasGraciaExclusivo: int

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    admin_email: EmailStr
    admin_password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"

class EmpresaUpdate(BaseModel):
    nombre: str | None = None
    rubro: RubroEmpresa | None = None
    telefono_contacto: str | None = None
    racha_dias_ruptura: int | None = None
    soles_por_punto: float | None = None
    expiracion_meses: int | None = None
    logo_url: str | None = None
    imagen_portada_url: str | None = None
    umbral_exclusivo_canjes: int | None = None
    umbral_exclusivo_dias: int | None = None
    dias_gracia_exclusivo: int | None = None
    descripcion: str | None = None
    direccion: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    horario: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    tiktok: str | None = None
    sitio_web: str | None = None


class EmpresaLogoUpload(BaseModel):
    """data URI base64 (data:image/...;base64,...) — máx ~2 MB."""
    data_uri: str


class EmpresaPortadaUpload(BaseModel):
    """data URI base64 (data:image/...;base64,...) — máx ~2 MB."""
    data_uri: str


class CambiarPasswordEmpresaRequest(BaseModel):
    password_actual: str
    password_nueva: str


class DesactivarCuentaRequest(BaseModel):
    """El panel exige reescribir el nombre exacto de la empresa como confirmación."""
    nombre_confirmacion: str


class MensajeResponse(BaseModel):
    mensaje: str


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
