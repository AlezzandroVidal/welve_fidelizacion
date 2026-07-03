from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ResenaCreate(BaseModel):
    estrellas: int = Field(ge=1, le=5)
    comentario: Optional[str] = None


class ResenaResponse(BaseModel):
    id: str
    empresaId: str
    clienteId: str
    clienteNombre: str
    clienteFotoUrl: Optional[str] = None
    estrellas: int
    comentario: Optional[str] = None
    fecha: datetime


class ResenaResumen(BaseModel):
    promedio: float
    total: int
    distribucion: dict[str, int]  # claves "1".."5" -> cantidad


class ResenasEmpresaResponse(BaseModel):
    resumen: ResenaResumen
    resenas: list[ResenaResponse]
