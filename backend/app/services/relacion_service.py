from beanie import PydanticObjectId

from app.models.relacion import RelacionClienteEmpresa


async def obtener_relacion(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId
) -> RelacionClienteEmpresa | None:
    return await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )


async def listar_relaciones_empresa(empresa_id: PydanticObjectId) -> list[RelacionClienteEmpresa]:
    return await RelacionClienteEmpresa.find(
        RelacionClienteEmpresa.empresa_id == empresa_id
    ).to_list()
