from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from app.models.enums import EstadoCupon, TipoCupon


class CuponCreate(BaseModel):
    nombre: str
    tipo: TipoCupon
    valor: Optional[float] = None
    monto_minimo: Optional[float] = None
    fecha_inicio: datetime
    fecha_expiracion: datetime
    limite_usos_total: Optional[int] = None
    limite_usos_por_cliente: Optional[int] = 1
    exclusivo: bool = False

    @field_validator("nombre")
    @classmethod
    def nombre_min_length(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v.strip()

    @model_validator(mode="after")
    def validar_campos(self) -> "CuponCreate":
        if self.tipo in (TipoCupon.descuento_porcentual, TipoCupon.descuento_fijo):
            if self.valor is None:
                raise ValueError(f"valor es requerido para tipo {self.tipo.value}")
        if self.tipo == TipoCupon.descuento_porcentual and self.valor is not None:
            if not (1 <= self.valor <= 100):
                raise ValueError("El porcentaje debe estar entre 1 y 100")
        if self.fecha_expiracion <= self.fecha_inicio:
            raise ValueError("fecha_expiracion debe ser posterior a fecha_inicio")
        return self


class CuponUpdate(BaseModel):
    nombre: Optional[str] = None
    monto_minimo: Optional[float] = None
    fecha_expiracion: Optional[datetime] = None
    limite_usos_total: Optional[int] = None
    limite_usos_por_cliente: Optional[int] = None
    estado: Optional[EstadoCupon] = None
    exclusivo: Optional[bool] = None


class CuponResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    tipo: TipoCupon
    valor: Optional[float] = None
    montoMinimo: Optional[float] = None
    fechaInicio: datetime
    fechaExpiracion: datetime
    estado: EstadoCupon
    limiteUsosTotal: Optional[int] = None
    limiteUsosPorCliente: Optional[int] = None
    usosActuales: int
    exclusivo: bool
    estaVigente: bool
    createdAt: datetime
    updatedAt: datetime
