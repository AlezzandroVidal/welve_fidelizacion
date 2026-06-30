from typing import Optional

from pydantic import BaseModel, model_validator


class ClienteCreate(BaseModel):
    nombre: str
    email: Optional[str] = None
    whatsapp: Optional[str] = None

    @model_validator(mode="after")
    def requiere_contacto(self) -> "ClienteCreate":
        if not self.email and not self.whatsapp:
            raise ValueError("Se requiere al menos email o whatsapp")
        return self


class ClienteResponse(BaseModel):
    id: str
    nombre: str
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    fechaAlta: str
    visitasTotales: int = 0
    montoAcumulado: float = 0.0
    rachaActual: int = 0
    puntos: int = 0
    segmento: str = "regular"
    ultimaVisita: Optional[str] = None


class MagicLinkRequest(BaseModel):
    empresa_id: str
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    nombre: Optional[str] = None

    @model_validator(mode="after")
    def requiere_contacto(self) -> "MagicLinkRequest":
        if not self.email and not self.whatsapp:
            raise ValueError("Se requiere al menos email o whatsapp")
        return self


class MagicLinkResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    clienteId: str
    empresaId: str
