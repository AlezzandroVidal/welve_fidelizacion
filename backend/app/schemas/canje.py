from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import CanalCanje


class CanjeCreate(BaseModel):
    cupon_id: str
    canal: CanalCanje
    staff_ref: Optional[str] = None


class CanjeResponse(BaseModel):
    id: str
    empresaId: str
    clienteId: str
    cuponId: str
    fecha: datetime
    canal: CanalCanje
    staffRef: Optional[str] = None
    clienteNombre: Optional[str] = None
    cuponNombre: Optional[str] = None
