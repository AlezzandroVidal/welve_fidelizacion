from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.enums import CanalCanje
from app.models.relacion import RelacionClienteEmpresa
from app.services import cupon_service


async def crear_canje(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    canal: CanalCanje,
    staff_ref: str | None = None,
) -> tuple[Canje, str | None]:
    """
    Retorna (canje, error_msg). Si error_msg is not None, el canje no se creó.
    Efecto: incrementa cupon.usos_actuales y actualiza RelacionClienteEmpresa.
    """
    cupon = await cupon_service.obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None, "Cupón no encontrado en esta empresa"

    ok, motivo = cupon_service.es_canjeable(cupon)
    if not ok:
        return None, motivo

    # Verificar límite por cliente
    if cupon.limite_usos_por_cliente is not None:
        usos_cliente = await Canje.find(
            Canje.empresa_id == empresa_id,
            Canje.cliente_id == cliente_id,
            Canje.cupon_id == cupon_id,
        ).count()
        if usos_cliente >= cupon.limite_usos_por_cliente:
            return None, "Límite de usos por cliente alcanzado"

    # Crear el canje (inmutable)
    canje = Canje(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        cupon_id=cupon_id,
        canal=canal,
        staff_ref=staff_ref,
    )
    await canje.insert()

    # Actualizar usos del cupón
    await cupon.set({"usos_actuales": cupon.usos_actuales + 1, "updated_at": datetime.now(timezone.utc)})

    # Actualizar RelacionClienteEmpresa
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if relacion:
        now = datetime.now(timezone.utc)
        await relacion.set({
            "visitas_totales": relacion.visitas_totales + 1,
            "ultima_visita": now,
            "updated_at": now,
        })

    return canje, None


async def listar_canjes_empresa(empresa_id: PydanticObjectId) -> list[Canje]:
    return await Canje.find(Canje.empresa_id == empresa_id).sort("-fecha").to_list()


async def listar_canjes_cliente(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> list[Canje]:
    return await Canje.find(
        Canje.empresa_id == empresa_id,
        Canje.cliente_id == cliente_id,
    ).sort("-fecha").to_list()
