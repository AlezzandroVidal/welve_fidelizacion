from enum import Enum


class RubroEmpresa(str, Enum):
    food_beverage = "food_beverage"
    belleza = "belleza"
    retail = "retail"
    otro = "otro"


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
    descuento_porcentual = "descuento_porcentual"
    descuento_fijo = "descuento_fijo"
    producto_gratis = "producto_gratis"
    dos_por_uno = "dos_por_uno"


class EstadoCupon(str, Enum):
    activo = "activo"
    pausado = "pausado"
    expirado = "expirado"


class TipoCondicionReto(str, Enum):
    num_visitas = "num_visitas"
    monto_acumulado = "monto_acumulado"


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


class WelveAdminRol(str, Enum):
    superadmin = "superadmin"
    soporte = "soporte"
