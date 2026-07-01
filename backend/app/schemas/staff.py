from pydantic import BaseModel

from app.schemas.canje import CanjeResponse
from app.schemas.cupon import CuponResponse
from app.schemas.qr import ResultadoVisitaResponse


class VisitaPorCodigoRequest(BaseModel):
    codigo_cliente: str
    monto: float | None = None


class VisitaPorQRRequest(BaseModel):
    cliente_id: str
    monto: float | None = None


class CanjePorCodigoRequest(BaseModel):
    codigo_cliente: str
    cupon_id: str
    monto: float | None = None


class CanjePorQRRequest(BaseModel):
    cliente_id: str
    cupon_id: str
    monto: float | None = None


class ClienteInfoStaff(BaseModel):
    nombre: str
    email: str | None = None
    whatsapp: str | None = None
    codigoCliente: str


class RelacionInfoStaff(BaseModel):
    visitasTotales: int
    rachaActual: int
    puntos: int
    segmento: str


class ClienteStaffResponse(BaseModel):
    cliente: ClienteInfoStaff
    relacion: RelacionInfoStaff
    cuponesDisponibles: list[CuponResponse]
    canjesRecientes: list[CanjeResponse]


class VisitaStaffResponse(BaseModel):
    clienteNombre: str
    resultado: ResultadoVisitaResponse


class CanjeStaffResponse(BaseModel):
    clienteNombre: str
    canje: CanjeResponse
    resultado: ResultadoVisitaResponse
