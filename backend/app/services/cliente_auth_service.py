"""Login/registro de cliente por email+password — separado de cliente_service.py
(que ya está en ~230 líneas) y de magic_link_service.py (que solo maneja el
token de Redis). Reusa cliente_service.obtener_o_crear_cliente() para la
creación: es la única función que genera un codigo_cliente único, evitando
duplicar esa lógica (y el bug de crear un Cliente sin codigo_cliente, que es
un campo requerido del modelo)."""

from datetime import date
from typing import Optional

from app.core.security import create_access_token, hash_password, verify_password
from app.models.cliente import Cliente
from app.services import cliente_service


async def login_password(email_o_whatsapp: str, password: str) -> Optional[tuple[Cliente, str]]:
    cliente = await Cliente.find_one(Cliente.email == email_o_whatsapp)
    if not cliente:
        cliente = await Cliente.find_one(Cliente.whatsapp == email_o_whatsapp)
    if not cliente or not cliente.password_hash or not verify_password(password, cliente.password_hash):
        return None
    token = create_access_token(subject=str(cliente.id), extra={"rol": "cliente", "empresa_id": ""})
    return cliente, token


async def registrar_password(
    nombre: str,
    apellido: Optional[str],
    email: Optional[str],
    whatsapp: Optional[str],
    password: Optional[str],
    fecha_nacimiento: Optional[date],
    genero: Optional[str],
) -> tuple[Optional[Cliente], Optional[str]]:
    """(cliente, error). Si el cliente ya existía con password (ya sea de un
    registro previo o de una sesión por magic link a la que luego se le puso
    contraseña), rechaza un segundo registro con password en vez de
    sobrescribirlo silenciosamente."""
    cliente = await cliente_service.obtener_o_crear_cliente(nombre, email, whatsapp)
    if password and cliente.password_hash:
        return None, "Ya existe una cuenta con ese correo o WhatsApp"

    cliente.nombre = nombre
    if apellido is not None:
        cliente.apellido = apellido
    if fecha_nacimiento is not None:
        cliente.fecha_nacimiento = fecha_nacimiento
    if genero is not None:
        cliente.genero = genero
    if password:
        cliente.password_hash = hash_password(password)
    await cliente.save()
    return cliente, None


def emitir_token(cliente: Cliente) -> str:
    return create_access_token(subject=str(cliente.id), extra={"rol": "cliente", "empresa_id": ""})
