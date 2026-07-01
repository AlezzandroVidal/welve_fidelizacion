from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import EstadoMembresia, EstadoMembresiaCliente, FrecuenciaMembresia


class MembresiaCreate(BaseModel):
    nombre: str
    precio: float
    beneficio_descripcion: str
    frecuencia: FrecuenciaMembresia = FrecuenciaMembresia.mensual


class MembresiaUpdate(BaseModel):
    nombre: str | None = None
    precio: float | None = None
    beneficio_descripcion: str | None = None


class MembresiaResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    precio: float
    beneficioDescripcion: str
    frecuencia: FrecuenciaMembresia
    estado: EstadoMembresia


class MembresiaClienteCreate(BaseModel):
    membresia_id: str
    cliente_id: str
    fecha_inicio: datetime
    fecha_proximo_cobro: Optional[datetime] = None


class MembresiaClienteResponse(BaseModel):
    id: str
    empresaId: str
    clienteId: str
    membresiaId: str
    estado: EstadoMembresiaCliente
    fechaInicio: datetime
    fechaProximoCobro: Optional[datetime] = None
    clienteNombre: Optional[str] = None


class MembresiaClienteUpdate(BaseModel):
    estado: EstadoMembresiaCliente
