import re
from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.enums import EstadoProducto, TipoMovimiento, TipoProducto
from app.models.producto import MovimientoInventario, Producto
from app.models.venta import Venta
from app.schemas.producto import ProductoCreate, ProductoResponse, ProductoUpdate

_ALLOWED_UPDATE = frozenset({
    "nombre", "descripcion", "descripcion_larga", "categoria", "subcategoria",
    "sku", "codigo_barras", "codigo_qr", "precio_base", "tiene_igv",
    "gestionar_inventario", "stock_minimo", "stock_maximo", "unidad_medida",
    "imagen_url", "imagenes_adicionales", "tags", "estado", "disponible_para_venta",
})


def producto_to_response(p: Producto) -> ProductoResponse:
    return ProductoResponse(
        id=str(p.id),
        empresaId=str(p.empresa_id),
        nombre=p.nombre,
        descripcion=p.descripcion,
        descripcionLarga=p.descripcion_larga,
        tipo=p.tipo,
        categoria=p.categoria,
        subcategoria=p.subcategoria,
        sku=p.sku,
        codigoBarras=p.codigo_barras,
        codigoQr=p.codigo_qr,
        precioBase=p.precio_base,
        precioConIgv=p.precio_con_igv,
        moneda=p.moneda,
        tieneIgv=p.tiene_igv,
        gestionarInventario=p.gestionar_inventario,
        stockActual=p.stock_actual,
        stockMinimo=p.stock_minimo,
        stockMaximo=p.stock_maximo,
        unidadMedida=p.unidad_medida,
        imagenUrl=p.imagen_url,
        imagenesAdicionales=p.imagenes_adicionales,
        estado=p.estado,
        disponibleParaVenta=p.disponible_para_venta,
        tags=p.tags,
        enAlertaStock=p.gestionar_inventario and p.stock_actual <= p.stock_minimo,
        createdAt=p.created_at,
        updatedAt=p.updated_at,
    )


async def listar_productos(
    empresa_id: PydanticObjectId,
    estado: Optional[EstadoProducto] = None,
    tipo: Optional[TipoProducto] = None,
    categoria: Optional[str] = None,
    busqueda: Optional[str] = None,
) -> list[Producto]:
    query = Producto.find(Producto.empresa_id == empresa_id)
    if estado is not None:
        query = query.find(Producto.estado == estado)
    if tipo is not None:
        query = query.find(Producto.tipo == tipo)
    if categoria is not None:
        query = query.find(Producto.categoria == categoria)
    productos = await query.sort("+nombre").to_list()

    if busqueda:
        q = busqueda.strip().lower()
        productos = [
            p for p in productos
            if q in p.nombre.lower() or q in p.sku.lower() or (p.codigo_barras and q in p.codigo_barras.lower())
        ]
    return productos


async def obtener_producto(empresa_id: PydanticObjectId, producto_id: PydanticObjectId) -> Optional[Producto]:
    return await Producto.find_one(Producto.empresa_id == empresa_id, Producto.id == producto_id)


async def buscar_por_codigo(empresa_id: PydanticObjectId, codigo: str) -> Optional[Producto]:
    """Busca por SKU o código de barras en una sola query — usado por el
    escáner de la caja."""
    codigo = codigo.strip()
    if not codigo:
        return None
    producto = await Producto.find_one(Producto.empresa_id == empresa_id, Producto.sku == codigo)
    if producto:
        return producto
    return await Producto.find_one(Producto.empresa_id == empresa_id, Producto.codigo_barras == codigo)


async def _generar_sku(empresa_id: PydanticObjectId, categoria: Optional[str]) -> str:
    letras = re.sub(r"[^A-Za-z]", "", categoria or "PRD").upper()
    prefijo = (letras[:3] or "PRD").ljust(3, "X")
    existentes = await Producto.find(
        Producto.empresa_id == empresa_id,
        {"sku": {"$regex": f"^{re.escape(prefijo)}-"}},
    ).count()
    for intento in range(existentes + 1, existentes + 1000):
        candidato = f"{prefijo}-{intento:03d}"
        if not await Producto.find_one(Producto.empresa_id == empresa_id, Producto.sku == candidato):
            return candidato
    raise ValueError("No se pudo generar un SKU único")


async def _registrar_movimiento(
    empresa_id: PydanticObjectId,
    producto_id: PydanticObjectId,
    tipo: TipoMovimiento,
    cantidad: int,
    stock_anterior: int,
    stock_nuevo: int,
    motivo: Optional[str] = None,
    venta_id: Optional[PydanticObjectId] = None,
    created_by: str = "staff",
) -> MovimientoInventario:
    mov = MovimientoInventario(
        empresa_id=empresa_id, producto_id=producto_id, tipo=tipo, cantidad=cantidad,
        stock_anterior=stock_anterior, stock_nuevo=stock_nuevo, motivo=motivo,
        venta_id=venta_id, created_by=created_by,
    )
    await mov.insert()
    return mov


async def crear_producto(empresa_id: PydanticObjectId, data: ProductoCreate) -> Producto:
    sku = (data.sku or "").strip() or await _generar_sku(empresa_id, data.categoria)
    payload = data.model_dump(exclude={"sku"})
    precio_con_igv = round(payload["precio_base"] * 1.18, 2) if payload["tiene_igv"] else payload["precio_base"]

    producto = Producto(empresa_id=empresa_id, sku=sku, precio_con_igv=precio_con_igv, **payload)
    await producto.insert()

    if producto.gestionar_inventario and producto.stock_actual > 0:
        await _registrar_movimiento(
            empresa_id, producto.id, TipoMovimiento.entrada, producto.stock_actual,
            0, producto.stock_actual, motivo="Stock inicial", created_by="staff",
        )
    return producto


async def actualizar_producto(
    empresa_id: PydanticObjectId, producto_id: PydanticObjectId, data: ProductoUpdate,
) -> Optional[Producto]:
    producto = await obtener_producto(empresa_id, producto_id)
    if not producto:
        return None

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if k in _ALLOWED_UPDATE}
    if "precio_base" in update_data or "tiene_igv" in update_data:
        precio_base = update_data.get("precio_base", producto.precio_base)
        tiene_igv = update_data.get("tiene_igv", producto.tiene_igv)
        update_data["precio_con_igv"] = round(precio_base * 1.18, 2) if tiene_igv else precio_base

    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await producto.set(update_data)
    return producto


async def actualizar_stock(
    empresa_id: PydanticObjectId,
    producto_id: PydanticObjectId,
    cantidad: int,
    tipo: TipoMovimiento,
    motivo: Optional[str] = None,
    venta_id: Optional[PydanticObjectId] = None,
) -> Optional[Producto]:
    producto = await obtener_producto(empresa_id, producto_id)
    if not producto:
        return None

    stock_anterior = producto.stock_actual
    stock_nuevo = max(0, stock_anterior + cantidad)

    nuevo_estado = producto.estado
    if stock_nuevo == 0:
        nuevo_estado = EstadoProducto.agotado
    elif producto.estado == EstadoProducto.agotado and stock_nuevo > 0:
        nuevo_estado = EstadoProducto.activo

    now = datetime.now(timezone.utc)
    await producto.set({"stock_actual": stock_nuevo, "estado": nuevo_estado, "updated_at": now})
    await _registrar_movimiento(
        empresa_id, producto.id, tipo, cantidad, stock_anterior, stock_nuevo, motivo=motivo, venta_id=venta_id,
    )

    producto.stock_actual = stock_nuevo
    producto.estado = nuevo_estado
    return producto


async def alertas_stock(empresa_id: PydanticObjectId) -> list[Producto]:
    productos = await Producto.find(
        Producto.empresa_id == empresa_id,
        Producto.gestionar_inventario == True,  # noqa: E712
        Producto.estado != EstadoProducto.inactivo,
    ).to_list()
    en_alerta = [p for p in productos if p.stock_actual <= p.stock_minimo]
    en_alerta.sort(key=lambda p: p.stock_actual)
    return en_alerta


async def historial_movimientos(
    empresa_id: PydanticObjectId, producto_id: PydanticObjectId, limit: int = 20,
) -> list[MovimientoInventario]:
    return await (
        MovimientoInventario.find(
            MovimientoInventario.empresa_id == empresa_id,
            MovimientoInventario.producto_id == producto_id,
        )
        .sort("-created_at")
        .limit(limit)
        .to_list()
    )


async def historial_movimientos_empresa(
    empresa_id: PydanticObjectId,
    producto_id: Optional[PydanticObjectId] = None,
    tipo=None,
    limit: int = 50,
) -> list[MovimientoInventario]:
    """Feed de movimientos de TODOS los productos de la empresa — usado por
    InventarioPage (a diferencia de historial_movimientos, que es por producto)."""
    query = MovimientoInventario.find(MovimientoInventario.empresa_id == empresa_id)
    if producto_id is not None:
        query = query.find(MovimientoInventario.producto_id == producto_id)
    if tipo is not None:
        query = query.find(MovimientoInventario.tipo == tipo)
    return await query.sort("-created_at").limit(limit).to_list()


async def eliminar_producto(empresa_id: PydanticObjectId, producto_id: PydanticObjectId) -> bool:
    producto = await obtener_producto(empresa_id, producto_id)
    if not producto:
        return False

    tiene_ventas = await Venta.find(
        Venta.empresa_id == empresa_id, {"items.producto_id": producto_id},
    ).count()
    if tiene_ventas > 0:
        raise ValueError("No se puede eliminar un producto con ventas registradas")

    await MovimientoInventario.find(
        MovimientoInventario.empresa_id == empresa_id,
        MovimientoInventario.producto_id == producto_id,
    ).delete()
    await producto.delete()
    return True
