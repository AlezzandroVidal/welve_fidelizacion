from datetime import date

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, model_validator

from beanie import PydanticObjectId

from app.core.config import settings
from app.core.security import create_access_token
from app.services import cliente_auth_service, magic_link_service
from app.services.cliente_service import obtener_o_crear_cliente

router = APIRouter(prefix="/auth/cliente", tags=["auth-cliente"])


class MagicLinkRequest(BaseModel):
    # None = login global al wallet (no atado a una empresa), usado desde el
    # tab Cliente del login genérico. Con empresa_id: flujo original desde el
    # QR de una empresa puntual.
    empresa_id: str | None = None
    email: str | None = None
    whatsapp: str | None = None
    nombre: str | None = None

    @model_validator(mode="after")
    def requiere_contacto(self) -> "MagicLinkRequest":
        if not self.email and not self.whatsapp:
            raise ValueError("Se requiere email o whatsapp")
        return self


class MagicLinkResponse(BaseModel):
    message: str
    devToken: str | None = None      # solo en development
    verifyUrl: str | None = None     # solo en development


class VerifyResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    clienteId: str
    empresaId: str

class ClienteLoginRequest(BaseModel):
    email: str
    password: str


class ClienteRegisterRequest(BaseModel):
    nombre: str
    apellido: str
    email: str | None = None
    whatsapp: str | None = None
    password: str | None = None
    fecha_nacimiento: date | None = None
    genero: str | None = None

    @model_validator(mode="after")
    def requiere_contacto(self) -> "ClienteRegisterRequest":
        if not self.email and not self.whatsapp:
            raise ValueError("Se requiere email o whatsapp")
        return self


@router.post("/magic-link", response_model=MagicLinkResponse)
async def solicitar_magic_link(data: MagicLinkRequest):
    if data.empresa_id is not None:
        try:
            PydanticObjectId(data.empresa_id)
        except Exception:
            raise HTTPException(status_code=422, detail="empresa_id inválido")

    token = await magic_link_service.crear_token(
        empresa_id=data.empresa_id,
        email=data.email,
        whatsapp=data.whatsapp,
        nombre=data.nombre,
    )

    resp = MagicLinkResponse(message="Revisa tu email o WhatsApp para acceder.")
    if settings.environment == "development":
        resp.devToken = token
        resp.verifyUrl = f"http://localhost:5173/auth/verify?token={token}"
    return resp


@router.get("/verify", response_model=VerifyResponse)
async def verificar_magic_link(token: str):
    payload = await magic_link_service.verificar_y_consumir_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    empresa_id_raw = payload.get("empresa_id")
    empresa_id = PydanticObjectId(empresa_id_raw) if empresa_id_raw else None
    cliente = await obtener_o_crear_cliente(
        nombre=payload.get("nombre"),
        email=payload.get("email"),
        whatsapp=payload.get("whatsapp"),
    )
    # No crea RelacionClienteEmpresa acá — la afiliación es un efecto
    # secundario del primer canje/visita (ver visita_service.registrar_visita
    # / canje_service.crear_canje), no un prerequisito de iniciar sesión.
    # Ningún endpoint depende de que exista antes de esto: get_current_cliente
    # (que sí la exige) no está montado en ninguna ruta activa hoy; todo el
    # wallet usa get_global_cliente, que no la necesita.

    jwt = create_access_token(
        subject=str(cliente.id),
        extra={"rol": "cliente", "empresa_id": str(empresa_id) if empresa_id else ""},
    )
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId=str(empresa_id) if empresa_id else "")


@router.post("/login", response_model=VerifyResponse)
async def login_cliente(data: ClienteLoginRequest):
    result = await cliente_auth_service.login_password(data.email, data.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    cliente, jwt = result
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId="")


@router.post("/register", response_model=VerifyResponse)
async def register_cliente(data: ClienteRegisterRequest):
    cliente, error = await cliente_auth_service.registrar_password(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        whatsapp=data.whatsapp,
        password=data.password,
        fecha_nacimiento=data.fecha_nacimiento,
        genero=data.genero,
    )
    if error is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    jwt = cliente_auth_service.emitir_token(cliente)
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId="")
