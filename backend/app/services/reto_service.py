from beanie import PydanticObjectId

from app.models.reto import Reto
from app.schemas.reto import RetoCreate


async def crear_reto(empresa_id: PydanticObjectId, data: RetoCreate) -> Reto:
    kwargs = data.model_dump(exclude={"recompensa_cupon_id"})
    if data.recompensa_cupon_id:
        kwargs["recompensa_cupon_id"] = PydanticObjectId(data.recompensa_cupon_id)
    reto = Reto(empresa_id=empresa_id, **kwargs)
    await reto.insert()
    return reto


async def listar_retos(empresa_id: PydanticObjectId) -> list[Reto]:
    return await Reto.find(Reto.empresa_id == empresa_id).to_list()


async def obtener_reto(empresa_id: PydanticObjectId, reto_id: PydanticObjectId) -> Reto | None:
    return await Reto.find_one(Reto.empresa_id == empresa_id, Reto.id == reto_id)
