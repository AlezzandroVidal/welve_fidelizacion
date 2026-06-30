from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from beanie import PydanticObjectId

from app.core.security import decode_token
from app.models.cliente import Cliente
from app.models.empresa import Empresa
from app.models.relacion import RelacionClienteEmpresa
from app.models.welve_admin import WelveAdmin

bearer = HTTPBearer()


async def get_current_empresa_admin(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> Empresa:
    payload = decode_token(creds.credentials)
    if not payload or payload.get("rol") != "empresa":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    empresa = await Empresa.get(PydanticObjectId(payload["sub"]))
    if not empresa:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empresa no encontrada")
    if empresa.estado.value != "activo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Empresa suspendida o cancelada")
    return empresa


# Alias para compatibilidad con routers existentes
get_current_empresa = get_current_empresa_admin


async def get_current_cliente(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> tuple[Cliente, RelacionClienteEmpresa]:
    payload = decode_token(creds.credentials)
    if not payload or payload.get("rol") != "cliente":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    try:
        cliente_id = PydanticObjectId(payload["sub"])
        empresa_id = PydanticObjectId(payload["empresa_id"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token malformado")

    cliente = await Cliente.get(cliente_id)
    if not cliente:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cliente no encontrado")

    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if not relacion:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Relación no encontrada")

    return cliente, relacion


# Alias para compatibilidad con routers existentes
get_current_cliente_context = get_current_cliente


async def get_global_cliente(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> Cliente:
    payload = decode_token(creds.credentials)
    if not payload or payload.get("rol") != "cliente":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    try:
        cliente_id = PydanticObjectId(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token malformado")

    cliente = await Cliente.get(cliente_id)
    if not cliente:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cliente no encontrado")

    return cliente


async def get_current_super_admin(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> WelveAdmin:
    payload = decode_token(creds.credentials)
    if not payload or payload.get("rol") not in ("superadmin", "soporte"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    admin = await WelveAdmin.get(PydanticObjectId(payload["sub"]))
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin no encontrado")
    return admin
