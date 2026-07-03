"""Flujos de staff: registrar visita y canjear cupón identificando al cliente
por codigo_cliente (global, ver Cliente.codigo_cliente) o por cliente_id (QR
escaneado). El codigo_cliente/QR del cliente es el mismo en cualquier empresa
— si el cliente nunca visitó esta empresa, se le afilia implícitamente acá
(ver cliente_service.obtener_o_crear_relacion). Todas las funciones retornan
(dict | None, error_msg | None) — mismo patrón de tupla que
canje_service.crear_canje (ver CLAUDE.md).
"""

from beanie import PydanticObjectId

from app.models.cliente import Cliente
from app.models.enums import CanalCanje
from app.models.relacion import RelacionClienteEmpresa
from app.services import canje_service, cliente_service, cupon_validacion_service, visita_service


async def buscar_por_codigo(
    empresa_id: PydanticObjectId, codigo_cliente: str,
) -> tuple[Cliente, RelacionClienteEmpresa] | None:
    cliente = await cliente_service.buscar_por_codigo_global(codigo_cliente)
    if not cliente:
        return None
    relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente.id)
    return cliente, relacion


async def _cliente_y_relacion_por_id(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> tuple[Cliente, RelacionClienteEmpresa] | None:
    cliente = await Cliente.get(cliente_id)
    if not cliente:
        return None
    relacion = await cliente_service.obtener_o_crear_relacion(empresa_id, cliente.id)
    return cliente, relacion


async def info_cliente(empresa_id: PydanticObjectId, codigo_cliente: str) -> dict | None:
    par = await buscar_por_codigo(empresa_id, codigo_cliente)
    if not par:
        return None
    cliente, relacion = par
    cupones = await cupon_validacion_service.listar_cupones_disponibles_cliente(empresa_id, cliente.id)
    canjes = (await canje_service.listar_canjes_cliente(empresa_id, cliente.id))[:3]
    return {"cliente": cliente, "relacion": relacion, "cupones": cupones, "canjes": canjes}


async def info_cliente_por_id(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> dict | None:
    """Igual que info_cliente, pero identificando al cliente por su
    cliente_id (el QR personal /wallet/mi-qr codifica welve://cliente/{id},
    no el codigo_cliente WLV-XXXX) — usado cuando se escanea el QR real en
    vez de teclear el código a mano."""
    par = await _cliente_y_relacion_por_id(empresa_id, cliente_id)
    if not par:
        return None
    cliente, relacion = par
    cupones = await cupon_validacion_service.listar_cupones_disponibles_cliente(empresa_id, cliente.id)
    canjes = (await canje_service.listar_canjes_cliente(empresa_id, cliente.id))[:3]
    return {"cliente": cliente, "relacion": relacion, "cupones": cupones, "canjes": canjes}


async def registrar_visita_por_codigo(
    empresa_id: PydanticObjectId, codigo_cliente: str, monto: float | None = None,
) -> tuple[dict | None, str | None]:
    par = await buscar_por_codigo(empresa_id, codigo_cliente)
    if not par:
        return None, "Código de cliente no reconocido"
    cliente, _ = par
    resultado = await visita_service.registrar_visita(cliente.id, empresa_id, canal="staff", monto=monto)
    return {"cliente_nombre": cliente.nombre, "resultado": resultado}, None


async def registrar_visita_por_cliente_id(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, monto: float | None = None,
) -> tuple[dict | None, str | None]:
    par = await _cliente_y_relacion_por_id(empresa_id, cliente_id)
    if not par:
        return None, "Cliente no encontrado"
    cliente, _ = par
    resultado = await visita_service.registrar_visita(cliente.id, empresa_id, canal="staff", monto=monto)
    return {"cliente_nombre": cliente.nombre, "resultado": resultado}, None


async def _canjear(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    canal: CanalCanje,
    staff_ref: str | None,
    monto: float | None = None,
) -> tuple[dict | None, str | None]:
    par = await _cliente_y_relacion_por_id(empresa_id, cliente_id)
    if not par:
        return None, "Cliente no encontrado"
    cliente, _ = par

    canje, error = await canje_service.crear_canje(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        cupon_id=cupon_id,
        canal=canal,
        staff_ref=staff_ref,
        registrar_visita=False,
        monto=monto,
    )
    if error:
        return None, error

    resultado = await visita_service.registrar_visita(cliente_id, empresa_id, canal="staff", monto=monto)
    return {"cliente_nombre": cliente.nombre, "canje": canje, "resultado": resultado}, None


async def canjear_por_codigo(
    empresa_id: PydanticObjectId, codigo_cliente: str, cupon_id: PydanticObjectId, staff_ref: str | None,
    monto: float | None = None,
) -> tuple[dict | None, str | None]:
    par = await buscar_por_codigo(empresa_id, codigo_cliente)
    if not par:
        return None, "Código de cliente no reconocido"
    cliente, _ = par
    return await _canjear(empresa_id, cliente.id, cupon_id, CanalCanje.staff_manual, staff_ref, monto)


async def canjear_por_cliente_id(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, cupon_id: PydanticObjectId, staff_ref: str | None,
    monto: float | None = None,
) -> tuple[dict | None, str | None]:
    return await _canjear(empresa_id, cliente_id, cupon_id, CanalCanje.qr, staff_ref, monto)
