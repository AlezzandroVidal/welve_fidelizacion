from pydantic import BaseModel, model_validator

from app.models.enums import RubroEmpresa
from app.schemas.canje import CanjeResponse


class EmpresaInfoResponse(BaseModel):
    """Info pública para la pantalla de escaneo antes de que el cliente se registre."""

    id: str
    nombre: str
    rubro: RubroEmpresa
    logoUrl: str | None = None
    descripcion: str | None = None
    totalCuponesActivos: int


class RegistroQRRequest(BaseModel):
    nombre: str
    email: str | None = None
    whatsapp: str | None = None

    @model_validator(mode="after")
    def requiere_contacto(self) -> "RegistroQRRequest":
        if not self.email and not self.whatsapp:
            raise ValueError("Se requiere email o whatsapp")
        return self


class RecompensaDesbloqueada(BaseModel):
    cuponId: str
    nombre: str
    tipo: str | None = None


class RetoCompletadoQR(BaseModel):
    retoId: str
    nombre: str
    recompensa: str | None = None


class ResultadoVisitaResponse(BaseModel):
    visitasTotales: int
    rachaActual: int
    recompensasDesbloqueadas: list[RecompensaDesbloqueada] = []
    retosCompletados: list[RetoCompletadoQR] = []
    subioAExclusivo: bool
    mensaje: str
    yaRegistradoHoy: bool = False


class AfiliarResponse(BaseModel):
    """Respuesta de la afiliación — la única visita que el cliente registra solo."""
    accessToken: str
    tokenType: str = "bearer"
    clienteId: str
    codigoCliente: str
    resultado: ResultadoVisitaResponse


class ValidarCuponRequest(BaseModel):
    cliente_id: str
    monto: float | None = None


class ValidarCuponResponse(BaseModel):
    canje: CanjeResponse
    resultadoVisita: ResultadoVisitaResponse
