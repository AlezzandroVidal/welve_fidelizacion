import random
import string
from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.schemas.cupon import CuponCreate, CuponResponse, CuponUpdate

_ALLOWED_UPDATE = frozenset({
    "nombre", "codigo", "monto_minimo", "fecha_expiracion",
    "limite_usos_total", "limite_usos_por_cliente", "estado", "visibilidad",
    "reto_id", "requisito", "notificar_al_desbloquear", "mensaje_notificacion",
    "destacado", "imagen_url", "terminos_condiciones",
    "descripcion_larga", "instrucciones_canje", "tags", "color_tema",
    "aplica_a", "productos_validos", "categorias_validas", "monto_minimo_carrito",
})

_CODIGO_CHARS = string.ascii_uppercase + string.digits


async def _generar_codigo_unico() -> str:
    """codigo es único globalmente (mismo criterio que Cliente.codigo_cliente)."""
    for _ in range(20):
        candidato = "CUP-" + "".join(random.choices(_CODIGO_CHARS, k=4))
        if not await Cupon.find_one(Cupon.codigo == candidato):
            return candidato
    raise ValueError("No se pudo generar un código único para el cupón")


def cupon_to_response(c: Cupon) -> CuponResponse:
    """Mapea un Cupon Beanie a su schema de respuesta — reusado por
    routers/cupones.py y por wallet_service (cupones_relacionados en el
    detalle público) para no duplicar el mapeo de campos."""
    now = datetime.now(timezone.utc)
    fecha_exp = c.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    return CuponResponse(
        id=str(c.id),
        empresaId=str(c.empresa_id),
        nombre=c.nombre,
        codigo=c.codigo,
        tipo=c.tipo,
        valor=c.valor,
        cantidadPaga=c.cantidad_paga,
        cantidadLleva=c.cantidad_lleva,
        productoGratisId=str(c.producto_gratis_id) if c.producto_gratis_id else None,
        montoMinimo=c.monto_minimo,
        fechaInicio=c.fecha_inicio,
        fechaExpiracion=c.fecha_expiracion,
        estado=c.estado,
        limiteUsosTotal=c.limite_usos_total,
        limiteUsosPorCliente=c.limite_usos_por_cliente,
        usosActuales=c.usos_actuales,
        visibilidad=c.visibilidad,
        retoId=str(c.reto_id) if c.reto_id else None,
        requisito=c.requisito,
        notificarAlDesbloquear=c.notificar_al_desbloquear,
        mensajeNotificacion=c.mensaje_notificacion,
        destacado=c.destacado,
        imagenUrl=c.imagen_url,
        terminosCondiciones=c.terminos_condiciones,
        descripcionLarga=c.descripcion_larga,
        instruccionesCanje=c.instrucciones_canje,
        tags=c.tags,
        colorTema=c.color_tema,
        aplicaA=c.aplica_a,
        productosValidos=[str(pid) for pid in c.productos_validos],
        categoriasValidas=c.categorias_validas,
        montoMinimoCarrito=c.monto_minimo_carrito,
        estaVigente=c.estado == EstadoCupon.activo and fecha_exp >= now,
        createdAt=c.created_at,
        updatedAt=c.updated_at,
    )


async def listar_cupones(
    empresa_id: PydanticObjectId,
    filtro_estado: Optional[EstadoCupon] = None,
) -> list[Cupon]:
    query = Cupon.find(Cupon.empresa_id == empresa_id)
    if filtro_estado is not None:
        query = query.find(Cupon.estado == filtro_estado)
    return await query.sort("-created_at").to_list()


async def obtener_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    """Siempre filtra por empresa_id para garantizar aislamiento multi-tenant."""
    return await Cupon.find_one(Cupon.empresa_id == empresa_id, Cupon.id == cupon_id)


async def crear_cupon(empresa_id: PydanticObjectId, data: CuponCreate) -> Cupon:
    payload = data.model_dump(exclude={"codigo"})
    codigo = (data.codigo or "").strip().upper() or await _generar_codigo_unico()
    cupon = Cupon(
        empresa_id=empresa_id,
        codigo=codigo,
        estado=EstadoCupon.activo,
        usos_actuales=0,
        **payload,
    )
    await cupon.insert()
    return cupon


async def buscar_por_codigo(empresa_id: PydanticObjectId, codigo: str) -> Optional[Cupon]:
    """Busca un cupón por su código escaneable/tipeable — usado por la Caja."""
    codigo = codigo.strip().upper()
    if not codigo:
        return None
    return await Cupon.find_one(Cupon.empresa_id == empresa_id, Cupon.codigo == codigo)


async def actualizar_cupon(
    empresa_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    data: CuponUpdate,
) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    # Solo campos permitidos — tipo y valor no modificables tras creación
    update_data = {
        k: v for k, v in data.model_dump(exclude_unset=True).items()
        if k in _ALLOWED_UPDATE
    }
    if "codigo" in update_data and update_data["codigo"]:
        update_data["codigo"] = update_data["codigo"].strip().upper()
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await cupon.set(update_data)
    return cupon


async def pausar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    await cupon.set({"estado": EstadoCupon.pausado, "updated_at": datetime.now(timezone.utc)})
    return cupon


async def activar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> Cupon | None:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return None
    now = datetime.now(timezone.utc)
    fecha_exp = cupon.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    if fecha_exp < now:
        return None  # No se puede activar un cupón ya expirado
    await cupon.set({"estado": EstadoCupon.activo, "updated_at": now})
    return cupon


async def eliminar_cupon(empresa_id: PydanticObjectId, cupon_id: PydanticObjectId) -> bool:
    cupon = await obtener_cupon(empresa_id, cupon_id)
    if not cupon:
        return False
    if cupon.usos_actuales > 0:
        raise ValueError("No se puede eliminar un cupón con canjes registrados")
    await cupon.delete()
    return True


async def listar_canjes_cupon(
    empresa_id: PydanticObjectId,
    cupon_id: PydanticObjectId,
    limit: int = 5,
) -> list[Canje]:
    return await (
        Canje.find(Canje.empresa_id == empresa_id, Canje.cupon_id == cupon_id)
        .sort("-fecha")
        .limit(limit)
        .to_list()
    )


