from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.schemas.empresa import (
    EmpresaRegister, EmpresaResponse, LoginRequest, TokenResponse,
    EmpresaUpdate, EmpresaLogoUpload,
)
from app.services import empresa_service

router = APIRouter(prefix="/empresas", tags=["empresas"])


def _to_response(e: Empresa) -> EmpresaResponse:
    return EmpresaResponse(
        id=str(e.id),
        nombre=e.nombre,
        rubro=e.rubro,
        logoUrl=e.logo_url,
        telefonoContacto=e.telefono_contacto,
        adminEmail=e.admin_email,
        planSuscripcion=e.plan_suscripcion,
        estado=e.estado,
        rachaDiasRuptura=e.config.racha_dias_ruptura,
        solesPorPunto=e.config.soles_por_punto,
        expiracionMeses=e.config.expiracion_meses,
    )


@router.post("/register", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def registrar_empresa(data: EmpresaRegister):
    empresa = await empresa_service.registrar_empresa(data)
    if empresa is None:
        raise HTTPException(status_code=409, detail="El email ya está registrado")
    return _to_response(empresa)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    result = await empresa_service.login_empresa(data.admin_email, data.admin_password)
    if result is None:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    _, token = result
    return TokenResponse(accessToken=token)


@router.get("/me", response_model=EmpresaResponse)
async def me(empresa: Empresa = Depends(get_current_empresa)):
    return _to_response(empresa)


@router.patch("/me/config", response_model=EmpresaResponse)
async def update_config(data: EmpresaUpdate, empresa: Empresa = Depends(get_current_empresa)):
    if data.nombre is not None:
        empresa.nombre = data.nombre
    if data.telefono_contacto is not None:
        empresa.telefono_contacto = data.telefono_contacto
    if data.racha_dias_ruptura is not None:
        empresa.config.racha_dias_ruptura = data.racha_dias_ruptura
    if data.soles_por_punto is not None:
        empresa.config.soles_por_punto = data.soles_por_punto
    if data.expiracion_meses is not None:
        empresa.config.expiracion_meses = data.expiracion_meses
    if data.logo_url is not None:
        empresa.logo_url = data.logo_url

    await empresa.save()
    return _to_response(empresa)


@router.post("/me/logo", response_model=EmpresaResponse)
async def upload_logo(payload: EmpresaLogoUpload, empresa: Empresa = Depends(get_current_empresa)):
    """
    Recibe un data URI base64 (data:image/png;base64,...).
    Valida formato mínimo y tamaño (~2 MB en base64 ≈ 2.7 MB string).
    """
    data_uri = payload.data_uri.strip()
    if not data_uri.startswith("data:image/"):
        raise HTTPException(status_code=422, detail="Formato inválido: se espera un data URI de imagen")
    # ~2 MB en bytes → ~2.73 MB en base64 → ~2 730 000 chars
    if len(data_uri) > 2_800_000:
        raise HTTPException(status_code=413, detail="La imagen supera el límite de 2 MB")

    empresa.logo_url = data_uri
    await empresa.save()
    return _to_response(empresa)


@router.delete("/me/logo", response_model=EmpresaResponse)
async def delete_logo(empresa: Empresa = Depends(get_current_empresa)):
    """Elimina el logo de la empresa (lo pone en None)."""
    empresa.logo_url = None
    await empresa.save()
    return _to_response(empresa)
