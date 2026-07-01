from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.schemas.empresa import (
    EmpresaRegister, EmpresaResponse, LoginRequest, TokenResponse,
    EmpresaUpdate, EmpresaLogoUpload,
    CambiarPasswordEmpresaRequest, DesactivarCuentaRequest, MensajeResponse,
    RecompensaAutomaticaCreate, RecompensaAutomaticaResponse, RecompensaAutomaticaUpdate,
)
from app.services import cupon_service, empresa_service

router = APIRouter(prefix="/empresas", tags=["empresas"])


def _recompensa_to_response(r: dict) -> RecompensaAutomaticaResponse:
    return RecompensaAutomaticaResponse(
        index=r["index"],
        visitasRequeridas=r["visitas_requeridas"],
        cuponId=r["cupon_id"],
        cuponNombre=r["cupon_nombre"],
        activa=r["activa"],
        descripcion=r["descripcion"],
    )


def _to_response(e: Empresa) -> EmpresaResponse:
    return EmpresaResponse(
        id=str(e.id),
        nombre=e.nombre,
        rubro=e.rubro,
        logoUrl=e.logo_url,
        telefonoContacto=e.telefono_contacto,
        descripcion=e.descripcion,
        direccion=e.direccion,
        latitud=e.latitud,
        longitud=e.longitud,
        horario=e.horario,
        instagram=e.instagram,
        facebook=e.facebook,
        tiktok=e.tiktok,
        adminEmail=e.admin_email,
        planSuscripcion=e.plan_suscripcion,
        estado=e.estado,
        rachaDiasRuptura=e.config.racha_dias_ruptura,
        solesPorPunto=e.config.soles_por_punto,
        expiracionMeses=e.config.expiracion_meses,
        umbralExclusivoCanjes=e.config.umbral_exclusivo_canjes,
        umbralExclusivoDias=e.config.umbral_exclusivo_dias,
        diasGraciaExclusivo=e.config.dias_gracia_exclusivo,
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
    if data.umbral_exclusivo_canjes is not None:
        empresa.config.umbral_exclusivo_canjes = data.umbral_exclusivo_canjes
    if data.umbral_exclusivo_dias is not None:
        empresa.config.umbral_exclusivo_dias = data.umbral_exclusivo_dias
    if data.dias_gracia_exclusivo is not None:
        empresa.config.dias_gracia_exclusivo = data.dias_gracia_exclusivo
    if data.logo_url is not None:
        empresa.logo_url = data.logo_url
    if data.descripcion is not None:
        empresa.descripcion = data.descripcion
    if data.direccion is not None:
        empresa.direccion = data.direccion
    if data.latitud is not None:
        empresa.latitud = data.latitud
    if data.longitud is not None:
        empresa.longitud = data.longitud
    if data.horario is not None:
        empresa.horario = data.horario
    if data.instagram is not None:
        empresa.instagram = data.instagram
    if data.facebook is not None:
        empresa.facebook = data.facebook
    if data.tiktok is not None:
        empresa.tiktok = data.tiktok

    await empresa.save()
    return _to_response(empresa)


@router.post("/me/password", response_model=MensajeResponse)
async def cambiar_password(data: CambiarPasswordEmpresaRequest, empresa: Empresa = Depends(get_current_empresa)):
    ok, error = await empresa_service.cambiar_password(empresa, data.password_actual, data.password_nueva)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return MensajeResponse(mensaje="Contraseña actualizada")


@router.post("/me/desactivar", response_model=MensajeResponse)
async def desactivar_cuenta(data: DesactivarCuentaRequest, empresa: Empresa = Depends(get_current_empresa)):
    """Zona de peligro del panel — el frontend ya exige reescribir el nombre
    exacto de la empresa antes de habilitar el botón; acá se revalida por si
    alguien pega el request directo."""
    if data.nombre_confirmacion.strip() != empresa.nombre:
        raise HTTPException(status_code=400, detail="El nombre no coincide")
    await empresa_service.desactivar_cuenta(empresa)
    return MensajeResponse(mensaje="Cuenta desactivada")


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


@router.get("/me/recompensas-automaticas", response_model=list[RecompensaAutomaticaResponse])
async def listar_recompensas_automaticas(empresa: Empresa = Depends(get_current_empresa)):
    items = await empresa_service.listar_recompensas_automaticas(empresa)
    return [_recompensa_to_response(i) for i in items]


@router.post(
    "/me/recompensas-automaticas",
    response_model=list[RecompensaAutomaticaResponse],
    status_code=status.HTTP_201_CREATED,
)
async def crear_recompensa_automatica(
    data: RecompensaAutomaticaCreate, empresa: Empresa = Depends(get_current_empresa),
):
    try:
        cupon_id = PydanticObjectId(data.cupon_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cupon_id inválido")
    cupon = await cupon_service.obtener_cupon(empresa.id, cupon_id)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado en esta empresa")

    empresa = await empresa_service.agregar_recompensa_automatica(empresa, data, cupon_id)
    items = await empresa_service.listar_recompensas_automaticas(empresa)
    return [_recompensa_to_response(i) for i in items]


@router.patch(
    "/me/recompensas-automaticas/{index}",
    response_model=list[RecompensaAutomaticaResponse],
)
async def editar_recompensa_automatica(
    index: int, data: RecompensaAutomaticaUpdate, empresa: Empresa = Depends(get_current_empresa),
):
    cupon_id = None
    if data.cupon_id is not None:
        try:
            cupon_id = PydanticObjectId(data.cupon_id)
        except Exception:
            raise HTTPException(status_code=422, detail="cupon_id inválido")
        cupon = await cupon_service.obtener_cupon(empresa.id, cupon_id)
        if not cupon:
            raise HTTPException(status_code=404, detail="Cupón no encontrado en esta empresa")

    ok = await empresa_service.editar_recompensa_automatica(empresa, index, data, cupon_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Recompensa automática no encontrada")
    items = await empresa_service.listar_recompensas_automaticas(empresa)
    return [_recompensa_to_response(i) for i in items]


@router.delete(
    "/me/recompensas-automaticas/{index}",
    response_model=list[RecompensaAutomaticaResponse],
)
async def eliminar_recompensa_automatica(
    index: int, empresa: Empresa = Depends(get_current_empresa),
):
    ok = await empresa_service.eliminar_recompensa_automatica(empresa, index)
    if not ok:
        raise HTTPException(status_code=404, detail="Recompensa automática no encontrada")
    items = await empresa_service.listar_recompensas_automaticas(empresa)
    return [_recompensa_to_response(i) for i in items]
