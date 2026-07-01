from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.enums import EstadoMembresia, EstadoMembresiaCliente
from app.models.membresia import Membresia
from app.models.membresia_cliente import MembresiaCliente
from app.schemas.membresia import (
    MembresiaClienteCreate, MembresiaClienteUpdate, MembresiaCreate, MembresiaUpdate,
)


async def crear_membresia(empresa_id: PydanticObjectId, data: MembresiaCreate) -> Membresia:
    membresia = Membresia(empresa_id=empresa_id, **data.model_dump())
    await membresia.insert()
    return membresia


async def listar_membresias(empresa_id: PydanticObjectId) -> list[Membresia]:
    return await Membresia.find(Membresia.empresa_id == empresa_id).to_list()


async def obtener_membresia(empresa_id: PydanticObjectId, membresia_id: PydanticObjectId) -> Membresia | None:
    return await Membresia.find_one(Membresia.empresa_id == empresa_id, Membresia.id == membresia_id)


async def actualizar_membresia(
    empresa_id: PydanticObjectId, membresia_id: PydanticObjectId, data: MembresiaUpdate,
) -> Membresia | None:
    membresia = await obtener_membresia(empresa_id, membresia_id)
    if not membresia:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await membresia.set(update_data)
    return membresia


async def pausar_membresia(empresa_id: PydanticObjectId, membresia_id: PydanticObjectId) -> Membresia | None:
    membresia = await obtener_membresia(empresa_id, membresia_id)
    if not membresia:
        return None
    await membresia.set({"estado": EstadoMembresia.pausada})
    return membresia


async def activar_membresia(empresa_id: PydanticObjectId, membresia_id: PydanticObjectId) -> Membresia | None:
    membresia = await obtener_membresia(empresa_id, membresia_id)
    if not membresia:
        return None
    await membresia.set({"estado": EstadoMembresia.activa})
    return membresia


async def eliminar_membresia(empresa_id: PydanticObjectId, membresia_id: PydanticObjectId) -> tuple[bool, str | None]:
    membresia = await obtener_membresia(empresa_id, membresia_id)
    if not membresia:
        return False, "Membresía no encontrada"
    tiene_suscriptores = await MembresiaCliente.find_one(
        MembresiaCliente.empresa_id == empresa_id, MembresiaCliente.membresia_id == membresia_id,
    )
    if tiene_suscriptores:
        return False, "No se puede eliminar un plan con clientes suscritos (actuales o pasados) — pausa el plan en su lugar"
    await membresia.delete()
    return True, None


async def suscribir_cliente(
    empresa_id: PydanticObjectId, data: MembresiaClienteCreate
) -> tuple[MembresiaCliente, str | None]:
    membresia_id = PydanticObjectId(data.membresia_id)
    cliente_id = PydanticObjectId(data.cliente_id)

    membresia = await Membresia.find_one(Membresia.empresa_id == empresa_id, Membresia.id == membresia_id)
    if not membresia:
        return None, "Membresía no encontrada"

    existente = await MembresiaCliente.find_one(
        MembresiaCliente.empresa_id == empresa_id,
        MembresiaCliente.cliente_id == cliente_id,
        MembresiaCliente.membresia_id == membresia_id,
    )
    if existente and existente.estado == EstadoMembresiaCliente.activa:
        return None, "El cliente ya tiene esta membresía activa"

    mc = MembresiaCliente(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        membresia_id=membresia_id,
        fecha_inicio=data.fecha_inicio,
        fecha_proximo_cobro=data.fecha_proximo_cobro,
    )
    await mc.insert()
    return mc, None


async def actualizar_estado_suscripcion(
    empresa_id: PydanticObjectId,
    mc_id: PydanticObjectId,
    data: MembresiaClienteUpdate,
) -> MembresiaCliente | None:
    mc = await MembresiaCliente.find_one(
        MembresiaCliente.empresa_id == empresa_id, MembresiaCliente.id == mc_id
    )
    if not mc:
        return None
    await mc.set({"estado": data.estado, "updated_at": datetime.now(timezone.utc)})
    return mc

async def listar_suscripciones(empresa_id: PydanticObjectId, membresia_id: PydanticObjectId | None = None) -> list[MembresiaCliente]:
    query = [MembresiaCliente.empresa_id == empresa_id]
    if membresia_id:
        query.append(MembresiaCliente.membresia_id == membresia_id)
    return await MembresiaCliente.find(*query).to_list()
