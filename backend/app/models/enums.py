from enum import Enum


class RubroEmpresa(str, Enum):
    food_beverage = "food_beverage"
    belleza = "belleza"
    retail = "retail"
    fitness = "fitness"
    educacion = "educacion"
    salud = "salud"
    entretenimiento = "entretenimiento"
    otro = "otro"


class Genero(str, Enum):
    M = "M"
    F = "F"
    otro = "otro"
    prefiero_no_decir = "prefiero_no_decir"


class PlanSuscripcion(str, Enum):
    starter = "starter"
    growth = "growth"
    pro = "pro"


class EstadoEmpresa(str, Enum):
    activo = "activo"
    suspendido = "suspendido"
    cancelado = "cancelado"


class SegmentoCliente(str, Enum):
    regular = "regular"
    exclusivo = "exclusivo"


class TipoCupon(str, Enum):
    porcentual = "porcentual"
    monto_fijo = "monto_fijo"
    producto_gratis = "producto_gratis"
    dos_por_uno = "dos_por_uno"
    n_por_m = "n_por_m"
    envio_gratis = "envio_gratis"
    personalizado = "personalizado"


class EstadoCupon(str, Enum):
    activo = "activo"
    pausado = "pausado"
    expirado = "expirado"


class TipoReto(str, Enum):
    num_visitas = "num_visitas"
    visitas_en_periodo = "visitas_en_periodo"
    monto_acumulado = "monto_acumulado"
    monto_en_periodo = "monto_en_periodo"
    productos_comprados = "productos_comprados"
    puntos_acumulados = "puntos_acumulados"
    # Monto gastado en un producto/categoría específico — a diferencia de
    # monto_acumulado/monto_en_periodo (sin filtro de producto), solo cuenta
    # lo comprado vía Caja (Venta.items tiene el detalle producto+monto; una
    # visita registrada por staff sin venta asociada no lo tiene).
    monto_en_productos = "monto_en_productos"


class AccesoVisibilidad(str, Enum):
    publico = "publico"
    vip = "vip"
    por_reto = "por_reto"
    por_requisito = "por_requisito"
    privado = "privado"


class TipoRequisito(str, Enum):
    visitas_totales = "visitas_totales"
    visitas_en_periodo = "visitas_en_periodo"
    gasto_total = "gasto_total"
    gasto_en_periodo = "gasto_en_periodo"
    puntos_acumulados = "puntos_acumulados"
    # Igual que TipoReto.monto_en_productos: solo cuenta compras vía Caja.
    gasto_en_productos = "gasto_en_productos"


class TipoNotificacion(str, Enum):
    cupon_desbloqueado = "cupon_desbloqueado"
    reto_completado = "reto_completado"
    racha_en_riesgo = "racha_en_riesgo"
    nuevo_cupon = "nuevo_cupon"


class EstadoAcceso(str, Enum):
    disponible = "disponible"
    bloqueado = "bloqueado"
    en_progreso = "en_progreso"
    desbloqueado_pendiente = "desbloqueado_pendiente"


class FrecuenciaMembresia(str, Enum):
    mensual = "mensual"


class EstadoMembresia(str, Enum):
    activa = "activa"
    pausada = "pausada"


class EstadoMembresiaCliente(str, Enum):
    activa = "activa"
    vencida = "vencida"
    cancelada = "cancelada"


class CanalCanje(str, Enum):
    qr = "qr"
    magic_link = "magic_link"
    staff_manual = "staff_manual"
    automatico = "automatico"


class WelveAdminRol(str, Enum):
    superadmin = "superadmin"
    soporte = "soporte"


class EstadoPago(str, Enum):
    pendiente = "pendiente"
    procesando = "procesando"
    aprobado = "aprobado"
    rechazado = "rechazado"
    reembolsado = "reembolsado"


class MetodoPago(str, Enum):
    tarjeta = "tarjeta"
    yape = "yape"
    plin = "plin"
    transferencia = "transferencia"


class AplicaCupon(str, Enum):
    todo = "todo"
    productos_especificos = "productos_especificos"
    categoria = "categoria"


class TipoProducto(str, Enum):
    producto = "producto"
    servicio = "servicio"


class UnidadMedida(str, Enum):
    unidad = "unidad"
    kg = "kg"
    litro = "litro"
    metro = "metro"
    hora = "hora"
    sesion = "sesion"


class TipoMovimiento(str, Enum):
    entrada = "entrada"
    salida = "salida"
    ajuste = "ajuste"
    venta = "venta"
    devolucion = "devolucion"


class EstadoProducto(str, Enum):
    activo = "activo"
    inactivo = "inactivo"
    agotado = "agotado"


class EstadoVenta(str, Enum):
    completada = "completada"
    cancelada = "cancelada"
    reembolsada = "reembolsada"


class MetodoPagoVenta(str, Enum):
    efectivo = "efectivo"
    tarjeta = "tarjeta"
    yape = "yape"
    plin = "plin"
    mixto = "mixto"
