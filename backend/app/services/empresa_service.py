from beanie import PydanticObjectId

from app.core.security import create_access_token, hash_password, verify_password
from app.models.empresa import Empresa
from app.schemas.empresa import EmpresaRegister


async def registrar_empresa(data: EmpresaRegister) -> Empresa:
    existente = await Empresa.find_one(Empresa.admin_email == data.admin_email)
    if existente:
        return None  # caller raises HTTPException

    empresa = Empresa(
        nombre=data.nombre,
        rubro=data.rubro,
        admin_email=data.admin_email,
        admin_password_hash=hash_password(data.admin_password),
        plan_suscripcion=data.plan_suscripcion,
    )
    await empresa.insert()
    return empresa


async def login_empresa(admin_email: str, admin_password: str) -> tuple[Empresa, str] | None:
    empresa = await Empresa.find_one(Empresa.admin_email == admin_email)
    if not empresa:
        return None
    if not verify_password(admin_password, empresa.admin_password_hash):
        return None
    token = create_access_token(
        subject=str(empresa.id),
        extra={"rol": "empresa", "email": empresa.admin_email},
    )
    return empresa, token


async def obtener_empresa(empresa_id: PydanticObjectId) -> Empresa | None:
    return await Empresa.get(empresa_id)
