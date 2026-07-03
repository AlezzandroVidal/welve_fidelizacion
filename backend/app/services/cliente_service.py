import asyncio
import random
import string
from datetime import datetime, timezone
from typing import Any, Optional

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.models.cliente import Cliente
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.models.relacion import RelacionClienteEmpresa
from app.schemas.cliente import MagicLinkRequest
from app.services import cupon_acceso_service


def _generar_codigo_cliente() -> str:
    """'WLV-XXXX' — identidad global del cliente, la reconoce cualquier empresa."""
    chars = string.ascii_uppercase + string.digits
    return "WLV-" + "".join(random.choices(chars, k=4))


async def obtener_o_crear_cliente(
    nombre: Optional[str],
    email: Optional[str],
    whatsapp: Optional[str],
) -> Cliente:
    """Busca un cliente global por email o whatsapp; lo crea si no existe.
    Al crearlo se le asigna un codigo_cliente único global (ver PRODUCT.MD:
    cualquier empresa que escanee/ingrese este código reconoce al cliente)."""
    if email:
        existing = await Cliente.find_one(Cliente.email == email)
        if existing:
            return existing
    if whatsapp:
        existing = await Cliente.find_one(Cliente.whatsapp == whatsapp)
        if existing:
            return existing

    for _ in range(5):
        cliente = Cliente(
            nombre=nombre or "Cliente",
            email=email,
            whatsapp=whatsapp,
            codigo_cliente=_generar_codigo_cliente(),
        )
        try:
            await cliente.insert()
            return cliente
        except DuplicateKeyError as e:
            # email/whatsapp duplicado es un error real (ya se validó arriba, pero
            # puede haber carrera concurrente); choque de codigo_cliente es el caso
            # a reintentar. Distinguimos por el índice que falló.
            if "codigo_cliente" not in str(e):
                raise
            continue

    raise RuntimeError("No se pudo generar un código de cliente único tras varios intentos")


async def obtener_o_crear_relacion(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
) -> RelacionClienteEmpresa:
    """Get-or-create de la relación cliente↔empresa. Se usa tanto en la
    afiliación explícita (QR de empresa) como cuando el staff de una empresa
    nueva reconoce al cliente por su codigo_cliente global o su QR personal —
    en ese caso esta llamada afilia implícitamente al cliente en esa empresa.

    Reintenta la lectura post-choque un par de veces con backoff corto: en el
    cluster Atlas compartido se observó una ventana de eventual consistency
    donde, justo después de crear la relación (ej. en la afiliación), una
    lectura inmediata desde otra request/conexión no la encuentra todavía —
    el insert subsiguiente choca contra el índice único pero el find_one de
    "recuperación" tampoco la ve aún. Un solo reintento no alcanza a cubrir
    esa ventana."""
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if relacion:
        return relacion

    nueva = RelacionClienteEmpresa(empresa_id=empresa_id, cliente_id=cliente_id)
    try:
        await nueva.insert()
        return nueva
    except DuplicateKeyError:
        # ya existía por una carrera concurrente (o por replicación con
        # lag) -> reintentar la lectura con backoff antes de rendirse.
        for delay in (0.05, 0.15, 0.4):
            existente = await RelacionClienteEmpresa.find_one(
                RelacionClienteEmpresa.empresa_id == empresa_id,
                RelacionClienteEmpresa.cliente_id == cliente_id,
            )
            if existente:
                return existente
            await asyncio.sleep(delay)
        raise


async def acceso_magic_link(data: MagicLinkRequest) -> tuple[Cliente, RelacionClienteEmpresa, str]:
    empresa_id = PydanticObjectId(data.empresa_id)
    cliente = await obtener_o_crear_cliente(data.nombre, data.email, data.whatsapp)
    relacion = await obtener_o_crear_relacion(empresa_id, cliente.id)
    token = create_access_token(
        subject=str(cliente.id),
        extra={"rol": "cliente", "empresa_id": str(empresa_id)},
    )
    return cliente, relacion, token


async def obtener_cliente_empresa(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> tuple[Cliente, RelacionClienteEmpresa] | None:
    cliente = await Cliente.get(cliente_id)
    if not cliente:
        return None
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if not relacion:
        return None
    return cliente, relacion


async def obtener_cliente_con_relacion_opcional(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> tuple[Cliente, RelacionClienteEmpresa | None] | None:
    """Como obtener_cliente_empresa, pero sin exigir afiliación previa: retorna
    None solo si el Cliente no existe globalmente. La relación puede venir None
    (cliente real, aún no afiliado a esta empresa) — la afiliación es un efecto
    secundario del primer canje/visita, no un prerequisito para ver sus datos."""
    cliente = await Cliente.get(cliente_id)
    if not cliente:
        return None
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    return cliente, relacion


async def buscar_por_codigo_global(codigo_cliente: str) -> Cliente | None:
    """Busca un cliente por su codigo_cliente global — cualquier empresa puede
    usar este código, no está limitado a una relación existente."""
    return await Cliente.find_one(Cliente.codigo_cliente == codigo_cliente.strip().upper())


async def listar_clientes_empresa(empresa_id: PydanticObjectId) -> list[tuple[Cliente, RelacionClienteEmpresa]]:
    """Retorna clientes que tienen relación con la empresa."""
    relaciones = await RelacionClienteEmpresa.find(
        RelacionClienteEmpresa.empresa_id == empresa_id
    ).to_list()
    if not relaciones:
        return []
    ids = [r.cliente_id for r in relaciones]
    clientes = await Cliente.find({"_id": {"$in": ids}}).to_list()
    
    cmap = {c.id: c for c in clientes}
    return [(cmap[r.cliente_id], r) for r in relaciones if r.cliente_id in cmap]


async def listar_cupones_cliente(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> list[dict[str, Any]]:
    """Cupones vigentes de la empresa con el AccesoCupon de este cliente
    embebido — usado por la pestaña "Cupones" del detalle de cliente en el
    panel admin (Disponibles/En progreso/Desbloqueados según acceso.estado,
    Canjeados se arma aparte con canje_service.listar_canjes_cliente). Mismo
    patrón que wallet_service.get_empresa_detalle, pero del lado del staff
    mirando a UN cliente en vez del cliente mirando su propio wallet."""
    now = datetime.now(timezone.utc)
    cupones = await Cupon.find(
        Cupon.empresa_id == empresa_id,
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_inicio <= now,
        Cupon.fecha_expiracion > now,
    ).to_list()

    resultado = []
    for cupon in cupones:
        acceso = await cupon_acceso_service.evaluar_acceso_cupon(cupon, cliente_id, empresa_id)
        if not acceso.puede_ver:
            continue
        c_dict = cupon.model_dump(mode="json")
        c_dict["acceso"] = acceso.model_dump(mode="json")
        resultado.append(c_dict)
    return resultado


async def actualizar_perfil(
    cliente: Cliente,
    nombre: Optional[str],
    email: Optional[str],
    whatsapp: Optional[str],
) -> tuple[Cliente | None, str | None]:
    """Retorna (cliente, error_msg). email/whatsapp son únicos globalmente —
    si ya los usa otro cliente, retorna error en vez de lanzar excepción."""
    if nombre is not None:
        cliente.nombre = nombre
    if email is not None:
        cliente.email = email
    if whatsapp is not None:
        cliente.whatsapp = whatsapp

    try:
        await cliente.save()
    except DuplicateKeyError:
        return None, "Ese email o whatsapp ya está en uso por otra cuenta"
    return cliente, None


async def cambiar_password(
    cliente: Cliente,
    password_actual: Optional[str],
    password_nueva: str,
) -> tuple[bool, str | None]:
    """Retorna (ok, error_msg). Si el cliente nunca tuvo password (solo magic
    link), no exige password_actual — es la primera vez que crea una."""
    if cliente.password_hash is not None:
        if not password_actual or not verify_password(password_actual, cliente.password_hash):
            return False, "La contraseña actual no es correcta"

    cliente.password_hash = hash_password(password_nueva)
    await cliente.save()
    return True, None
