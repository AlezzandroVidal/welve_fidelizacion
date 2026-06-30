from typing import Optional

from beanie import PydanticObjectId

from app.core.security import create_access_token
from app.models.cliente import Cliente
from app.models.relacion import RelacionClienteEmpresa
from app.schemas.cliente import MagicLinkRequest


async def obtener_o_crear_cliente(
    nombre: Optional[str],
    email: Optional[str],
    whatsapp: Optional[str],
) -> Cliente:
    """Busca un cliente global por email o whatsapp; lo crea si no existe."""
    if email:
        existing = await Cliente.find_one(Cliente.email == email)
        if existing:
            return existing
    if whatsapp:
        existing = await Cliente.find_one(Cliente.whatsapp == whatsapp)
        if existing:
            return existing

    cliente = Cliente(
        nombre=nombre or "Cliente",
        email=email,
        whatsapp=whatsapp,
    )
    await cliente.insert()
    return cliente


async def obtener_o_crear_relacion(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
) -> RelacionClienteEmpresa:
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if relacion:
        return relacion

    relacion = RelacionClienteEmpresa(empresa_id=empresa_id, cliente_id=cliente_id)
    await relacion.insert()
    return relacion


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
