from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import WelveAdminRol
from app.models.welve_admin import WelveAdmin


async def crear_admin(email: str, password: str, nombre: str, rol: WelveAdminRol = WelveAdminRol.soporte) -> WelveAdmin:
    admin = WelveAdmin(
        email=email,
        password_hash=hash_password(password),
        nombre=nombre,
        rol=rol,
    )
    await admin.insert()
    return admin


async def login_admin(email: str, password: str) -> tuple[WelveAdmin, str] | None:
    admin = await WelveAdmin.find_one(WelveAdmin.email == email)
    if not admin or not verify_password(password, admin.password_hash):
        return None
    token = create_access_token(
        subject=str(admin.id),
        extra={"rol": admin.rol.value},
    )
    return admin, token
