from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.cliente import Cliente
from app.models.cupon import Cupon
from app.models.enums import AccesoVisibilidad
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.schemas.reto import RetoCreate, RetoUpdate


async def crear_reto(empresa_id: PydanticObjectId, data: RetoCreate) -> Reto:
    kwargs = data.model_dump(exclude={"recompensa_cupon_id", "producto_objetivo_id"})
    if data.recompensa_cupon_id:
        kwargs["recompensa_cupon_id"] = PydanticObjectId(data.recompensa_cupon_id)
    if data.producto_objetivo_id:
        kwargs["producto_objetivo_id"] = PydanticObjectId(data.producto_objetivo_id)
    reto = Reto(empresa_id=empresa_id, **kwargs)
    await reto.insert()
    return reto


async def listar_retos(empresa_id: PydanticObjectId) -> list[Reto]:
    return await Reto.find(Reto.empresa_id == empresa_id).to_list()


async def obtener_reto(empresa_id: PydanticObjectId, reto_id: PydanticObjectId) -> Reto | None:
    return await Reto.find_one(Reto.empresa_id == empresa_id, Reto.id == reto_id)


async def actualizar_reto(empresa_id: PydanticObjectId, reto_id: PydanticObjectId, data: RetoUpdate) -> Reto | None:
    """No permite tocar condicion_tipo ni fecha_inicio — cambiar el tipo de
    condición o retroceder el arranque de un reto ya en curso es más riesgoso
    que útil (afectaría retroactivamente qué visitas/canjes cuentan)."""
    reto = await obtener_reto(empresa_id, reto_id)
    if not reto:
        return None
    update_data = data.model_dump(exclude={"recompensa_cupon_id", "producto_objetivo_id"}, exclude_unset=True)
    if "recompensa_cupon_id" in data.model_fields_set:
        update_data["recompensa_cupon_id"] = (
            PydanticObjectId(data.recompensa_cupon_id) if data.recompensa_cupon_id else None
        )
    if "producto_objetivo_id" in data.model_fields_set:
        update_data["producto_objetivo_id"] = (
            PydanticObjectId(data.producto_objetivo_id) if data.producto_objetivo_id else None
        )
    if update_data:
        await reto.set(update_data)
    return reto


async def cancelar_reto(empresa_id: PydanticObjectId, reto_id: PydanticObjectId) -> Reto | None:
    reto = await obtener_reto(empresa_id, reto_id)
    if not reto:
        return None
    await reto.set({"cancelado": True})
    return reto


async def reactivar_reto(empresa_id: PydanticObjectId, reto_id: PydanticObjectId) -> Reto | None:
    reto = await obtener_reto(empresa_id, reto_id)
    if not reto:
        return None
    await reto.set({"cancelado": False})
    return reto


async def asignar_cupones(
    empresa_id: PydanticObjectId, reto_id: PydanticObjectId, cupon_ids: list[str],
) -> list[Cupon]:
    """Un reto puede desbloquear varios cupones (visibilidad=por_reto,
    reto_id=este reto) — esta es la vía principal para armar ese vínculo,
    en vez de tener que ir cupón por cupón a la pestaña Visibilidad.
    Diff idempotente contra lo ya asignado: agrega los nuevos, y a los que
    se sacaron de la lista les resetea la visibilidad a público (un cupón
    por_reto sin reto_id quedaría en un estado roto — evaluar_acceso_cupon
    no tiene un fallback para eso)."""
    objetivo = {PydanticObjectId(cid) for cid in cupon_ids}

    actuales = await Cupon.find(
        Cupon.empresa_id == empresa_id,
        Cupon.visibilidad == AccesoVisibilidad.por_reto,
        Cupon.reto_id == reto_id,
    ).to_list()
    actuales_ids = {c.id for c in actuales}

    for cupon in actuales:
        if cupon.id not in objetivo:
            await cupon.set({"visibilidad": AccesoVisibilidad.publico, "reto_id": None})

    nuevos_ids = objetivo - actuales_ids
    if nuevos_ids:
        nuevos = await Cupon.find(Cupon.empresa_id == empresa_id, {"_id": {"$in": list(nuevos_ids)}}).to_list()
        for cupon in nuevos:
            await cupon.set({"visibilidad": AccesoVisibilidad.por_reto, "reto_id": reto_id})

    return await Cupon.find(
        Cupon.empresa_id == empresa_id,
        Cupon.visibilidad == AccesoVisibilidad.por_reto,
        Cupon.reto_id == reto_id,
    ).to_list()


async def notificar_retos_pendientes() -> list[dict]:
    """Retos que ya empezaron (fecha_inicio <= ahora) y nunca se avisaron
    (notificado=False, PRODUCT.MD 6.2: "al activarse, dispara notificación a
    todos los clientes de esa empresa"). Marca notificado=True y retorna los
    contactos a avisar — el envío real (WhatsApp/email) lo encola el caller
    (worker/tasks.py), para no importar Celery desde la capa de servicios."""
    now = datetime.now(timezone.utc)
    pendientes = await Reto.find(
        Reto.notificado == False,  # noqa: E712
        Reto.cancelado == False,  # noqa: E712
        Reto.fecha_inicio <= now,
    ).to_list()

    notificaciones: list[dict] = []
    for reto in pendientes:
        relaciones = await RelacionClienteEmpresa.find(
            RelacionClienteEmpresa.empresa_id == reto.empresa_id
        ).to_list()
        clientes = await Cliente.find({"_id": {"$in": [r.cliente_id for r in relaciones]}}).to_list()
        mensaje = f"¡Nuevo reto disponible: {reto.nombre}!"
        for cliente in clientes:
            if cliente.whatsapp:
                notificaciones.append({"canal": "whatsapp", "destino": cliente.whatsapp, "mensaje": mensaje})
            elif cliente.email:
                notificaciones.append({"canal": "email", "destino": cliente.email, "mensaje": mensaje})
        await reto.set({"notificado": True})
    return notificaciones
