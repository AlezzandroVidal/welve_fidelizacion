from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cliente import Cliente
from app.models.cupon import Cupon
from app.models.enums import AccesoVisibilidad, AplicaCupon, CanalCanje, EstadoVenta, MetodoPagoVenta, TipoCupon, TipoMovimiento
from app.models.producto import Producto
from app.models.relacion import RelacionClienteEmpresa
from app.models.venta import ItemVenta, Venta
from app.schemas.venta import ItemCarritoInput
from app.services import canje_service, cupon_service, cupon_validacion_service, producto_service, visita_service

IGV_TASA = 0.18


def _calcular_descuento(cupon: Cupon, subtotal: float, items_calc: list[dict]) -> float:
    if not items_calc or subtotal <= 0:
        return 0.0
    if cupon.tipo == TipoCupon.porcentual:
        return round(subtotal * ((cupon.valor or 0) / 100), 2)
    if cupon.tipo == TipoCupon.monto_fijo:
        return round(min(cupon.valor or 0, subtotal), 2)
    if cupon.tipo == TipoCupon.producto_gratis:
        return round(min(item["precio_unitario"] for item in items_calc), 2)
    if cupon.tipo == TipoCupon.dos_por_uno:
        duplicados = [item["precio_unitario"] for item in items_calc if item["cantidad"] >= 2]
        return round(min(duplicados), 2) if duplicados else 0.0
    return 0.0


async def _validar_cupon_para_carrito(
    cupon: Cupon,
    empresa_id: PydanticObjectId,
    cliente_id: Optional[PydanticObjectId],
    subtotal: float,
    productos_map: dict[str, Producto],
) -> tuple[bool, str]:
    ok, motivo = cupon_validacion_service.es_canjeable(cupon, subtotal)
    if not ok:
        return False, motivo

    if cliente_id is None:
        return False, "Identifica al cliente para aplicar un cupón"

    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if not relacion:
        return False, "El cliente no está afiliado a esta empresa"
    if cupon.visibilidad == AccesoVisibilidad.vip and relacion.segmento.value != "exclusivo":
        return False, "Cupón exclusivo — el cliente no califica"
    if cupon.limite_usos_por_cliente is not None:
        usos = await Canje.find(
            Canje.empresa_id == empresa_id, Canje.cliente_id == cliente_id, Canje.cupon_id == cupon.id,
        ).count()
        if usos >= cupon.limite_usos_por_cliente:
            return False, "El cliente ya alcanzó el límite de usos de este cupón"

    if cupon.aplica_a == AplicaCupon.productos_especificos:
        validos = {str(pid) for pid in cupon.productos_validos}
        if not any(pid in validos for pid in productos_map):
            return False, "Ningún producto del carrito califica para este cupón"
    elif cupon.aplica_a == AplicaCupon.categoria:
        categorias = set(cupon.categorias_validas)
        if not any((productos_map[pid].categoria in categorias) for pid in productos_map):
            return False, "Ningún producto del carrito pertenece a una categoría válida para este cupón"

    if cupon.monto_minimo_carrito is not None and subtotal < cupon.monto_minimo_carrito:
        return False, f"El carrito debe ser de al menos S/{cupon.monto_minimo_carrito:.2f} para este cupón"

    return True, ""


async def calcular_carrito(
    empresa_id: PydanticObjectId,
    items: list[ItemCarritoInput],
    cupon_id: Optional[PydanticObjectId],
    cliente_id: Optional[PydanticObjectId],
) -> dict[str, Any]:
    """Calcula el total del carrito con o sin cupón. NO registra nada."""
    items_calc: list[dict] = []
    productos_map: dict[str, Producto] = {}
    subtotal = 0.0

    for item in items:
        producto = await producto_service.obtener_producto(empresa_id, PydanticObjectId(item.producto_id))
        if not producto:
            continue
        sub = round(producto.precio_base * item.cantidad, 2)
        items_calc.append({
            "producto_obj": producto,
            "cantidad": item.cantidad,
            "precio_unitario": producto.precio_base,
            "subtotal": sub,
        })
        productos_map[str(producto.id)] = producto
        subtotal += sub
    subtotal = round(subtotal, 2)

    cupon_aplicado: Optional[Cupon] = None
    descuento_monto = 0.0
    errores_cupon: Optional[str] = None

    if cupon_id:
        cupon = await Cupon.find_one(Cupon.empresa_id == empresa_id, Cupon.id == cupon_id)
        if not cupon:
            errores_cupon = "Cupón no encontrado"
        else:
            ok, motivo = await _validar_cupon_para_carrito(cupon, empresa_id, cliente_id, subtotal, productos_map)
            if ok:
                cupon_aplicado = cupon
                descuento_monto = _calcular_descuento(cupon, subtotal, items_calc)
            else:
                errores_cupon = motivo

    base_con_descuento = max(0.0, subtotal - descuento_monto)
    igv = round(base_con_descuento * IGV_TASA, 2)
    total = round(base_con_descuento + igv, 2)
    descuento_porcentaje = round((descuento_monto / subtotal) * 100, 2) if subtotal > 0 else 0.0

    return {
        "items": items_calc,
        "subtotal": subtotal,
        "cupon_aplicado": cupon_aplicado,
        "descuento_monto": descuento_monto,
        "descuento_porcentaje": descuento_porcentaje,
        "igv": igv,
        "total": total,
        "errores_cupon": errores_cupon,
        "es_valido": bool(items_calc) and (cupon_id is None or cupon_aplicado is not None),
    }


async def procesar_venta(
    empresa_id: PydanticObjectId,
    items: list[ItemCarritoInput],
    cliente_id: Optional[PydanticObjectId],
    cupon_id: Optional[PydanticObjectId],
    metodo_pago: MetodoPagoVenta,
    monto_efectivo: Optional[float],
    monto_tarjeta: Optional[float],
    monto_yape: Optional[float],
    notas: Optional[str],
) -> tuple[Optional[Venta], Optional[dict], Optional[str]]:
    """Retorna (venta, resultado_visita, error_msg)."""
    carrito = await calcular_carrito(empresa_id, items, cupon_id, cliente_id)
    if not carrito["items"]:
        return None, None, "El carrito está vacío o los productos no existen"
    if cupon_id and not carrito["cupon_aplicado"]:
        return None, None, carrito["errores_cupon"] or "El cupón no aplica a este carrito"

    for item in carrito["items"]:
        producto: Producto = item["producto_obj"]
        if producto.gestionar_inventario and item["cantidad"] > producto.stock_actual:
            return None, None, f"Stock insuficiente de {producto.nombre} (disponible: {producto.stock_actual})"

    codigo_cliente = None
    if cliente_id:
        cliente = await Cliente.get(cliente_id)
        codigo_cliente = cliente.codigo_cliente if cliente else None

    venta_items = [
        ItemVenta(
            producto_id=item["producto_obj"].id,
            nombre_producto=item["producto_obj"].nombre,
            sku=item["producto_obj"].sku,
            cantidad=item["cantidad"],
            precio_unitario=item["precio_unitario"],
            subtotal=item["subtotal"],
        )
        for item in carrito["items"]
    ]

    cupon_aplicado: Optional[Cupon] = carrito["cupon_aplicado"]
    vuelto = None
    if metodo_pago == MetodoPagoVenta.efectivo and monto_efectivo is not None:
        vuelto = round(monto_efectivo - carrito["total"], 2)

    venta = Venta(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        codigo_cliente=codigo_cliente,
        items=venta_items,
        subtotal=carrito["subtotal"],
        descuento_monto=carrito["descuento_monto"],
        descuento_porcentaje=carrito["descuento_porcentaje"],
        igv=carrito["igv"],
        total=carrito["total"],
        cupon_id=cupon_aplicado.id if cupon_aplicado else None,
        cupon_codigo=cupon_aplicado.nombre if cupon_aplicado else None,
        metodo_pago=metodo_pago,
        monto_efectivo=monto_efectivo,
        monto_tarjeta=monto_tarjeta,
        monto_yape=monto_yape,
        vuelto=vuelto,
        estado=EstadoVenta.completada,
        notas=notas,
        created_by="staff",
    )
    await venta.insert()

    resultado_visita = None
    if cliente_id:
        if cupon_aplicado:
            canje, _error = await canje_service.crear_canje(
                empresa_id=empresa_id,
                cliente_id=cliente_id,
                cupon_id=cupon_aplicado.id,
                canal=CanalCanje.staff_manual,
                staff_ref=None,
                registrar_visita=False,
                monto=carrito["total"],
            )
            if canje:
                await venta.set({"canje_id": canje.id})
                venta.canje_id = canje.id

        resultado_visita = await visita_service.registrar_visita(
            cliente_id, empresa_id, canal="staff", monto=carrito["total"],
        )

    for item in carrito["items"]:
        producto: Producto = item["producto_obj"]
        if producto.gestionar_inventario:
            await producto_service.actualizar_stock(
                empresa_id, producto.id, -item["cantidad"], TipoMovimiento.venta,
                motivo=f"Venta {venta.id}", venta_id=venta.id,
            )

    return venta, resultado_visita, None


async def listar_cupones_validos_para_carrito(
    empresa_id: PydanticObjectId,
    items: list[ItemCarritoInput],
    cliente_id: PydanticObjectId,
) -> list[Cupon]:
    """Cupones del cliente que aplican al carrito dado — usado por la caja
    para mostrar al staff qué puede usar el cliente sin que tenga que
    probar uno por uno."""
    productos_map: dict[str, Producto] = {}
    subtotal = 0.0
    for item in items:
        producto = await producto_service.obtener_producto(empresa_id, PydanticObjectId(item.producto_id))
        if not producto:
            continue
        productos_map[str(producto.id)] = producto
        subtotal += round(producto.precio_base * item.cantidad, 2)
    subtotal = round(subtotal, 2)

    disponibles = await cupon_validacion_service.listar_cupones_disponibles_cliente(empresa_id, cliente_id)
    validos = []
    for cupon in disponibles:
        ok, _ = await _validar_cupon_para_carrito(cupon, empresa_id, cliente_id, subtotal, productos_map)
        if ok:
            validos.append(cupon)
    return validos


async def obtener_venta(empresa_id: PydanticObjectId, venta_id: PydanticObjectId) -> Optional[Venta]:
    return await Venta.find_one(Venta.empresa_id == empresa_id, Venta.id == venta_id)


async def historial_ventas(
    empresa_id: PydanticObjectId,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    cliente_id: Optional[PydanticObjectId] = None,
    con_cupon: Optional[bool] = None,
    metodo_pago: Optional[MetodoPagoVenta] = None,
) -> list[Venta]:
    query = Venta.find(Venta.empresa_id == empresa_id)
    if fecha_desde is not None:
        query = query.find(Venta.created_at >= fecha_desde)
    if fecha_hasta is not None:
        query = query.find(Venta.created_at <= fecha_hasta)
    if cliente_id is not None:
        query = query.find(Venta.cliente_id == cliente_id)
    if metodo_pago is not None:
        query = query.find(Venta.metodo_pago == metodo_pago)

    ventas = await query.sort("-created_at").to_list()
    if con_cupon is not None:
        ventas = [v for v in ventas if (v.cupon_id is not None) == con_cupon]
    return ventas


async def resumen_ventas(empresa_id: PydanticObjectId) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    inicio_hoy = now.replace(hour=0, minute=0, second=0, microsecond=0)
    inicio_semana = inicio_hoy - timedelta(days=inicio_hoy.weekday())
    inicio_mes = inicio_hoy.replace(day=1)

    ventas_mes = await Venta.find(
        Venta.empresa_id == empresa_id,
        Venta.created_at >= inicio_mes,
        Venta.estado == EstadoVenta.completada,
    ).to_list()

    # Motor devuelve datetimes naive (UTC implícito) para campos ya guardados —
    # las queries a Mongo aceptan aware, pero comparar en Python sí exige que
    # ambos lados tengan el mismo tipo.
    inicio_hoy_naive = inicio_hoy.replace(tzinfo=None)
    inicio_semana_naive = inicio_semana.replace(tzinfo=None)
    ventas_hoy = [v for v in ventas_mes if v.created_at >= inicio_hoy_naive]
    ventas_semana = [v for v in ventas_mes if v.created_at >= inicio_semana_naive]

    monto_hoy = round(sum(v.total for v in ventas_hoy), 2)
    monto_semana = round(sum(v.total for v in ventas_semana), 2)
    monto_mes = round(sum(v.total for v in ventas_mes), 2)
    ticket_promedio_hoy = round(monto_hoy / len(ventas_hoy), 2) if ventas_hoy else 0.0

    metodo_mas_usado = None
    if ventas_hoy:
        conteo_metodos: dict[str, int] = {}
        for v in ventas_hoy:
            conteo_metodos[v.metodo_pago.value] = conteo_metodos.get(v.metodo_pago.value, 0) + 1
        metodo_mas_usado = max(conteo_metodos, key=conteo_metodos.get)

    con_cupon_hoy = sum(1 for v in ventas_hoy if v.cupon_id is not None)
    porcentaje_con_cupon = round((con_cupon_hoy / len(ventas_hoy)) * 100, 1) if ventas_hoy else 0.0

    producto_mas_vendido = None
    if ventas_hoy:
        conteo_productos: dict[str, int] = {}
        for v in ventas_hoy:
            for item in v.items:
                conteo_productos[item.nombre_producto] = conteo_productos.get(item.nombre_producto, 0) + item.cantidad
        if conteo_productos:
            producto_mas_vendido = max(conteo_productos, key=conteo_productos.get)

    return {
        "ventas_hoy": len(ventas_hoy),
        "monto_hoy": monto_hoy,
        "ventas_semana": len(ventas_semana),
        "monto_semana": monto_semana,
        "ventas_mes": len(ventas_mes),
        "monto_mes": monto_mes,
        "ticket_promedio_hoy": ticket_promedio_hoy,
        "metodo_mas_usado_hoy": metodo_mas_usado,
        "porcentaje_con_cupon_hoy": porcentaje_con_cupon,
        "producto_mas_vendido_hoy": producto_mas_vendido,
    }
