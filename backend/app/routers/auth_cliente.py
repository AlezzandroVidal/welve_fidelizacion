from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, model_validator

from beanie import PydanticObjectId

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.services import magic_link_service
from app.services.cliente_service import obtener_o_crear_cliente

router = APIRouter(prefix="/auth/cliente", tags=["auth-cliente"])


class MagicLinkRequest(BaseModel):
    empresa_id: str
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
    email: str
    password: str
    whatsapp: str | None = None


@router.post("/magic-link", response_model=MagicLinkResponse)
async def solicitar_magic_link(data: MagicLinkRequest):
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

    empresa_id = PydanticObjectId(payload["empresa_id"])
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
        extra={"rol": "cliente", "empresa_id": str(empresa_id)},
    )
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId=str(empresa_id))


@router.post("/login", response_model=VerifyResponse)
async def login_cliente(data: ClienteLoginRequest):
    from app.models.cliente import Cliente
    cliente = await Cliente.find_one(Cliente.email == data.email)
    
    if not cliente or not cliente.password_hash or not verify_password(data.password, cliente.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    jwt = create_access_token(
        subject=str(cliente.id),
        extra={"rol": "cliente", "empresa_id": ""}
    )
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId="")


@router.post("/register", response_model=VerifyResponse)
async def register_cliente(data: ClienteRegisterRequest):
    from app.models.cliente import Cliente
    existente = await Cliente.find_one(Cliente.email == data.email)
    if existente:
        if existente.password_hash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya está registrado")
        else:
            # Update magic link user to have password
            existente.nombre = data.nombre
            existente.password_hash = hash_password(data.password)
            if data.whatsapp:
                existente.whatsapp = data.whatsapp
            await existente.save()
            cliente = existente
    else:
        cliente = Cliente(
            nombre=data.nombre,
            email=data.email,
            password_hash=hash_password(data.password),
            whatsapp=data.whatsapp
        )
        await cliente.insert()

    jwt = create_access_token(
        subject=str(cliente.id),
        extra={"rol": "cliente", "empresa_id": ""}
    )
    return VerifyResponse(accessToken=jwt, clienteId=str(cliente.id), empresaId="")
