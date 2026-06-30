from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.dependencies import get_current_super_admin
from app.models.welve_admin import WelveAdmin
from app.services import welve_admin_service

router = APIRouter(prefix="/admin/auth", tags=["admin"])


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminTokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    nombre: str
    rol: str


@router.post("/login", response_model=AdminTokenResponse)
async def login_admin(data: AdminLoginRequest):
    result = await welve_admin_service.login_admin(data.email, data.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    admin, token = result
    return AdminTokenResponse(accessToken=token, nombre=admin.nombre, rol=admin.rol.value)


@router.get("/me")
async def me(admin: WelveAdmin = Depends(get_current_super_admin)):
    return {"id": str(admin.id), "email": admin.email, "nombre": admin.nombre, "rol": admin.rol}
