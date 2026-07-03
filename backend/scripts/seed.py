"""
Script de seed idempotente. Ejecutar:
    cd backend && python scripts/seed.py
"""
import asyncio
import random
import string
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.security import hash_password
from app.db.mongodb import init_db
from app.models.canje import Canje
from app.models.cliente import Cliente
from app.models.cupon import Cupon, RequisitoAcceso
from app.models.empresa import Empresa
from app.models.enums import (
    AccesoVisibilidad,
    AplicaCupon,
    CanalCanje,
    EstadoCupon,
    EstadoMembresia,
    EstadoMembresiaCliente,
    EstadoPago,
    EstadoVenta,
    FrecuenciaMembresia,
    MetodoPago,
    MetodoPagoVenta,
    RubroEmpresa,
    SegmentoCliente,
    TipoCupon,
    TipoRequisito,
    TipoReto,
    TipoMovimiento,
    TipoProducto,
    UnidadMedida,
    WelveAdminRol,
)
from app.models.membresia import Membresia
from app.models.membresia_cliente import MembresiaCliente
from app.models.pago import Pago
from app.models.producto import MovimientoInventario, Producto
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.models.venta import ItemVenta, Venta
from app.models.welve_admin import WelveAdmin
from app.services.pago_service import PLAN_LABEL, PLAN_PRECIOS

# ── Referencia temporal fija — reproduce los mismos datos en cada reset ───────
_NOW = datetime(2026, 6, 29, 12, 0, 0, tzinfo=timezone.utc)

# Los pagos usan la fecha real de ejecución (no _NOW) para que el plan de cada
# empresa quede vigente al momento de probar la pasarela, sin importar cuándo
# se corra el seed.
_HOY_PAGOS = datetime.now(timezone.utc)

_UNSPLASH = "https://images.unsplash.com"


def _img(photo_id: str, w: int = 400, h: int = 300) -> str:
    return f"{_UNSPLASH}/{photo_id}?w={w}&h={h}&fit=crop"


def _ago(days: int, hours: int = 0) -> datetime:
    return _NOW - timedelta(days=days, hours=hours)


def _fwd(days: int) -> datetime:
    return _NOW + timedelta(days=days)


# ═══════════════════════════════════════════════════════════════════════════════
# Datos estáticos
# ═══════════════════════════════════════════════════════════════════════════════

SUPER_ADMINS = [
    {
        "email": "admin@welve.pe",
        "password": "WelveAdmin2024!",
        "nombre": "Super Admin Welve",
        "rol": WelveAdminRol.superadmin,
    },
]

EMPRESAS_DATA = [
    {
        "nombre": "Café Ritual",
        "rubro": RubroEmpresa.food_beverage,
        "email": "admin@caferitual.pe",
        "password": "Ritual2024!",
        "ticket": 28.0,
        "logo_url": _img("photo-1509042239860-f550ce710b93", 200, 200),
        "imagen_portada_url": _img("photo-1501339847302-ac426a4a7cbb", 800, 450),
        "descripcion": "Café de especialidad tostado localmente, pasteles horneados a diario y el "
                       "mejor rincón para trabajar o desconectar en Miraflores. Desde 2019 servimos "
                       "cada taza con el mismo cuidado que la primera.",
        "direccion": "Av. Larco 345, Miraflores, Lima",
        "horario": "Lun-Vie 8am-8pm, Sáb 9am-6pm",
        "telefono_contacto": "+51 1 445 7788",
        "sitio_web": "https://caferitual.pe",
        "instagram": "@caferitual.pe",
        "facebook": "facebook.com/caferitualpe",
    },
    {
        "nombre": "Salón Lumina",
        "rubro": RubroEmpresa.belleza,
        "email": "admin@salonlumina.pe",
        "password": "Lumina2024!",
        "ticket": 65.0,
        "logo_url": _img("photo-1522337660859-02fbefca4702", 200, 200),
        "imagen_portada_url": _img("photo-1560066984-138dadb4c035", 800, 450),
        "descripcion": "Salón de belleza boutique especializado en color, cortes y tratamientos "
                       "capilares premium. Nuestro equipo combina técnica y tendencia para que "
                       "salgas sintiéndote una nueva versión de ti misma.",
        "direccion": "Calle Schell 210, Miraflores, Lima",
        "horario": "Lun-Sáb 9am-7pm",
        "telefono_contacto": "+51 1 446 9021",
        "sitio_web": "https://salonlumina.pe",
        "instagram": "@salonlumina.pe",
        "facebook": "facebook.com/salonluminape",
    },
    {
        "nombre": "Tienda Maki",
        "rubro": RubroEmpresa.retail,
        "email": "admin@tiendamaki.pe",
        "password": "Maki2024!",
        "ticket": 42.0,
        "logo_url": _img("photo-1523381210434-271e8be1f52b", 200, 200),
        "imagen_portada_url": _img("photo-1445205170230-053b83016050", 800, 450),
        "descripcion": "Ropa y accesorios curados con un ojo atento a las tendencias, sin perder "
                       "la calidad. Encuentra piezas únicas para renovar tu clóset cada temporada.",
        "direccion": "Av. Angamos Este 1420, Surquillo, Lima",
        "horario": "Lun-Vie 10am-8pm, Sáb 10am-7pm",
        "telefono_contacto": "+51 1 447 3312",
        "sitio_web": "https://tiendamaki.pe",
        "instagram": "@tiendamaki.pe",
        "facebook": "facebook.com/tiendamakipe",
    },
    {
        "nombre": "Pizzería Bella Napoli",
        "rubro": RubroEmpresa.food_beverage,
        "email": "admin@bellanapoli.pe",
        "password": "Napoli2024!",
        "ticket": 48.0,
        "logo_url": _img("photo-1571997478779-2adcbbe9ab2f", 200, 200),
        "imagen_portada_url": _img("photo-1513104890138-7c749659a591", 800, 450),
        "descripcion": "Pizza al horno de leña con masa madre de 48 horas de fermentación e "
                       "ingredientes importados de Italia. Ambiente familiar en el corazón de "
                       "Barranco desde 2021.",
        "direccion": "Av. Grau 680, Barranco, Lima",
        "horario": "Mar-Dom 12pm-11pm",
        "telefono_contacto": "+51 1 448 2210",
        "sitio_web": "https://bellanapoli.pe",
        "instagram": "@bellanapoli.pe",
        "facebook": "facebook.com/bellanapolipe",
    },
    {
        "nombre": "Librería Página 1",
        "rubro": RubroEmpresa.retail,
        "email": "admin@pagina1.pe",
        "password": "Pagina2024!",
        "ticket": 36.0,
        "logo_url": _img("photo-1481627834876-b7833e8f5570", 200, 200),
        "imagen_portada_url": _img("photo-1521056787327-2f5c17a3f4fa", 800, 450),
        "descripcion": "Librería independiente especializada en narrativa latinoamericana, "
                       "cómics y papelería de diseño. Un rincón de lectura pausada en San Isidro.",
        "direccion": "Calle Miguel Dasso 134, San Isidro, Lima",
        "horario": "Lun-Sáb 10am-8pm",
        "telefono_contacto": "+51 1 449 5567",
        "sitio_web": "https://pagina1.pe",
        "instagram": "@pagina1.pe",
        "facebook": "facebook.com/pagina1libreria",
    },
]

# 16 clientes únicos globales
CLIENTES_DATA = [
    {"nombre": "Ana García",     "email": "ana.garcia@gmail.com",     "whatsapp": "+51987654321", "dias_alta": 180},
    {"nombre": "Carlos Quispe",  "email": "carlos.quispe@gmail.com",  "whatsapp": "+51976543210", "dias_alta": 155},
    {"nombre": "María López",    "email": "maria.lopez@gmail.com",    "whatsapp": "+51965432109", "dias_alta": 130},
    {"nombre": "Pedro Mamani",   "email": "pedro.mamani@gmail.com",   "whatsapp": "+51954321098", "dias_alta": 110},
    {"nombre": "Lucía Ramos",    "email": "lucia.ramos@gmail.com",    "whatsapp": "+51943210987", "dias_alta":  90},
    {"nombre": "Jorge Huanca",   "email": "jorge.huanca@gmail.com",   "whatsapp": "+51932109876", "dias_alta":  70},
    {"nombre": "Rosa Vargas",    "email": "rosa.vargas@gmail.com",    "whatsapp": "+51921098765", "dias_alta":  50},
    {"nombre": "Miguel Torres",  "email": "miguel.torres@gmail.com",  "whatsapp": "+51910987654", "dias_alta":  40},
    {"nombre": "Elena Flores",   "email": "elena.flores@gmail.com",   "whatsapp": "+51999876543", "dias_alta":  25},
    {"nombre": "Diego Chávez",   "email": "diego.chavez@gmail.com",   "whatsapp": "+51988765432", "dias_alta":  10},
    {"nombre": "Sofía Ramírez",  "email": "sofia.ramirez@gmail.com",  "whatsapp": "+51977123456", "dias_alta": 200},
    {"nombre": "Andrés Castro",  "email": "andres.castro@gmail.com",  "whatsapp": "+51966234567", "dias_alta": 165},
    {"nombre": "Valentina Ruiz", "email": "valentina.ruiz@gmail.com", "whatsapp": "+51955345678", "dias_alta": 120},
    {"nombre": "Bruno Salazar",  "email": "bruno.salazar@gmail.com",  "whatsapp": "+51944456789", "dias_alta":  80},
    {"nombre": "Camila Vega",    "email": "camila.vega@gmail.com",    "whatsapp": "+51933567890", "dias_alta":  45},
    {"nombre": "Renzo Delgado",  "email": "renzo.delgado@gmail.com",  "whatsapp": "+51922678901", "dias_alta":  15},
]

# 5 clientes por empresa; clientes 0-1 compartidos entre Café Ritual y Salón Lumina,
# clientes 2-4 compartidos entre Café Ritual y Tienda Maki, y las dos empresas
# nuevas cada una comparte 2 clientes con Café Ritual para simular clientes
# multi-negocio → 16 únicos, 25 relaciones
EMPRESA_CLIENTES_IDX: dict[str, list[int]] = {
    "Café Ritual":            [0, 1, 2, 3, 4],
    "Salón Lumina":           [0, 1, 5, 6, 7],
    "Tienda Maki":            [2, 3, 4, 8, 9],
    "Pizzería Bella Napoli":  [0, 4, 10, 11, 12],
    "Librería Página 1":      [1, 6, 13, 14, 15],
}

# (visitas_totales, racha_actual, dias_ultima_visita) — uno por cliente por empresa
RELACIONES_STATS: dict[str, list[tuple[int, int, int]]] = {
    "Café Ritual":            [(22, 8, 1),  (15, 4, 5),  (8,  2, 12), (3,  1, 20), (18, 6, 3) ],
    "Salón Lumina":           [(12, 5, 2),  (7,  3, 8),  (20, 7, 1),  (4,  0, 25), (9,  2, 10)],
    "Tienda Maki":            [(5,  1, 15), (11, 4, 4),  (25, 8, 2),  (2,  0, 28), (14, 5, 7) ],
    "Pizzería Bella Napoli":  [(9,  3, 6),  (13, 5, 2),  (4,  1, 18), (17, 6, 1),  (6,  2, 14)],
    "Librería Página 1":      [(6,  2, 9),  (10, 4, 3),  (2,  0, 30), (15, 6, 2),  (3,  1, 22)],
}

# 4 cupones temáticos por empresa (mismo orden/índice en las 3 — CANJES_DATA y
# seed_retos referencian estos cupones por posición 0-3, así que cada lista
# debe conservar la forma: [%descuento, gratis-exclusivo, 2x1, descuento fijo])
CUPONES_POR_EMPRESA: dict[str, list[dict]] = {
    "Café Ritual": [
        {
            "nombre": "15% de descuento en tu pedido",
            "tipo": TipoCupon.porcentual, "valor": 15.0, "monto_minimo": 30.0,
            "limite_usos_total": 100, "usos_actuales": 23, "destacado": True,
            "imagen_url": _img("photo-1495474472287-4d71bcdd2085"),
            "tags": ["bebidas", "descuento"], "color_tema": "#3B82F6",
            "descripcion_larga": "Disfruta un 15% de descuento en cualquier pedido de nuestra carta, "
                                 "desde tu café favorito hasta el almuerzo del día. Ideal para tu "
                                 "visita de todos los días.",
            "instrucciones_canje": "Muestra tu código al mozo antes de pagar.",
            "terminos_condiciones": "• Válido de lunes a viernes\n• No acumulable con otras ofertas\n"
                                     "• Compra mínima de S/30\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "Café americano gratis",
            "tipo": TipoCupon.producto_gratis, "valor": None, "monto_minimo": None,
            "limite_usos_total": 50, "usos_actuales": 17, "destacado": True,
            "imagen_url": _img("photo-1461023058943-07fcbe16d735"),
            "tags": ["bebidas", "favorito"], "color_tema": "#F97316",
            "descripcion_larga": "Un café americano recién preparado, por cortesía de la casa para "
                                 "nuestros clientes más fieles. Perfecto para acompañar tu "
                                 "pastelería favorita.",
            "instrucciones_canje": "Menciona 'WELVE' al pedir en caja.",
            "terminos_condiciones": "• Exclusivo para clientes VIP\n• Un canje por visita\n"
                                     "• No incluye leches vegetales\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "2x1 en pasteles",
            "tipo": TipoCupon.dos_por_uno, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 8, "destacado": False,
            "imagen_url": _img("photo-1517248135467-4c7edcad34c4"),
            "tags": ["postres", "promo"], "color_tema": "#EC4899",
            "descripcion_larga": "Lleva dos pasteles al precio de uno — ideal para compartir con "
                                 "quien te acompañe o darte un gusto doble. Rotación semanal de sabores.",
            "instrucciones_canje": "Indica el cupón antes de elegir tus pasteles.",
            "terminos_condiciones": "• Válido para pasteles de igual o menor valor\n• No acumulable\n"
                                     "• Sujeto a disponibilidad de vitrina\n• Válido todos los días",
        },
        {
            "nombre": "S/10 off en compras sobre S/50",
            "tipo": TipoCupon.monto_fijo, "valor": 10.0, "monto_minimo": 50.0,
            "limite_usos_total": None, "usos_actuales": 5, "destacado": False,
            "imagen_url": _img("photo-1517701604599-bb29b565090c"),
            "tags": ["descuento"], "color_tema": "#10B981",
            "descripcion_larga": "S/10 de descuento directo en compras desde S/50 — perfecto para "
                                 "pedidos grupales o para llevar café a la oficina.",
            "instrucciones_canje": "Presenta el código antes de pagar la cuenta.",
            "terminos_condiciones": "• Compra mínima de S/50\n• No acumulable con otras ofertas\n"
                                     "• Un uso por cliente\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "Compra 3 cafés, paga 2",
            "tipo": TipoCupon.n_por_m, "valor": None, "monto_minimo": None,
            "cantidad_paga": 2, "cantidad_lleva": 3,
            "aplica_a": AplicaCupon.categoria, "categorias_validas": ["Bebidas"],
            "limite_usos_total": None, "usos_actuales": 0, "destacado": False,
            "imagen_url": _img("photo-1541167760496-1628856ab772"),
            "tags": ["bebidas", "promo"], "color_tema": "#8B5CF6",
            "descripcion_larga": "Lleva 3 bebidas calientes y paga solo 2 — ideal para compartir "
                                 "con el equipo de la oficina.",
            "instrucciones_canje": "Indica el cupón al ordenar tus 3 bebidas.",
            "terminos_condiciones": "• Válido solo en bebidas calientes\n• No acumulable\n"
                                     "• Las 3 bebidas deben pedirse juntas\n• Válido todos los días",
        },
    ],
    "Salón Lumina": [
        {
            "nombre": "15% de descuento en cualquier servicio",
            "tipo": TipoCupon.porcentual, "valor": 15.0, "monto_minimo": 30.0,
            "limite_usos_total": 100, "usos_actuales": 23, "destacado": True,
            "imagen_url": _img("photo-1519415943484-9fa1873496d4"),
            "tags": ["spa", "descuento"], "color_tema": "#3B82F6",
            "descripcion_larga": "15% de descuento en cualquier servicio del salón: corte, color, "
                                 "tratamientos o spa. Tu momento de cuidado personal, más accesible.",
            "instrucciones_canje": "Muestra tu código en recepción al llegar.",
            "terminos_condiciones": "• Válido de lunes a viernes\n• No acumulable con otras ofertas\n"
                                     "• Compra mínima de S/30\n• Sujeto a disponibilidad de agenda",
        },
        {
            "nombre": "Manicure gratis",
            "tipo": TipoCupon.producto_gratis, "valor": None, "monto_minimo": None,
            "limite_usos_total": 50, "usos_actuales": 17, "destacado": True,
            "imagen_url": _img("photo-1487412720507-e7ab37603c6f"),
            "tags": ["manicure", "favorito"], "color_tema": "#F97316",
            "descripcion_larga": "Un manicure clásico de cortesía para nuestras clientas más fieles, "
                                 "con los mejores esmaltes de temporada.",
            "instrucciones_canje": "Menciona 'WELVE' al agendar tu cita.",
            "terminos_condiciones": "• Exclusivo para clientas VIP\n• Un canje por visita\n"
                                     "• No incluye diseño en uñas\n• Sujeto a disponibilidad de agenda",
        },
        {
            "nombre": "2x1 en tratamiento facial",
            "tipo": TipoCupon.dos_por_uno, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 8, "destacado": False,
            "imagen_url": _img("photo-1519014816548-bf5fe059798b"),
            "tags": ["facial", "spa"], "color_tema": "#EC4899",
            "descripcion_larga": "Lleva a una amiga y disfruten juntas de un tratamiento facial "
                                 "relajante al 2x1. Ideal para una tarde de autocuidado compartido.",
            "instrucciones_canje": "Agenda ambas citas juntas e indica el cupón.",
            "terminos_condiciones": "• Válido para el mismo tratamiento\n• No acumulable\n"
                                     "• Requiere reserva previa\n• Válido todos los días",
        },
        {
            "nombre": "S/10 off en compras sobre S/50",
            "tipo": TipoCupon.monto_fijo, "valor": 10.0, "monto_minimo": 50.0,
            "limite_usos_total": None, "usos_actuales": 5, "destacado": False,
            "imagen_url": _img("photo-1595476108010-b4d1f102b1b1"),
            "tags": ["descuento"], "color_tema": "#10B981",
            "descripcion_larga": "S/10 de descuento directo en servicios o productos desde S/50 — "
                                 "perfecto para tu rutina de belleza mensual.",
            "instrucciones_canje": "Presenta el código antes de pagar en caja.",
            "terminos_condiciones": "• Compra mínima de S/50\n• No acumulable con otras ofertas\n"
                                     "• Un uso por cliente\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "3x2 en productos",
            "tipo": TipoCupon.n_por_m, "valor": None, "monto_minimo": None,
            "cantidad_paga": 2, "cantidad_lleva": 3,
            "aplica_a": AplicaCupon.categoria, "categorias_validas": ["Productos"],
            "limite_usos_total": None, "usos_actuales": 0, "destacado": False,
            "imagen_url": _img("photo-1585232351009-aa87416fca90"),
            "tags": ["productos", "promo"], "color_tema": "#8B5CF6",
            "descripcion_larga": "Lleva 3 productos de cuidado capilar y paga solo 2 — la excusa "
                                 "perfecta para renovar tu rutina en casa.",
            "instrucciones_canje": "Indica el cupón antes de pagar en caja.",
            "terminos_condiciones": "• Válido solo en la categoría Productos\n• No acumulable\n"
                                     "• Sujeto a stock disponible\n• Válido todos los días",
        },
        {
            "nombre": "Sorpresa de cumpleaños",
            "tipo": TipoCupon.personalizado, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 0, "destacado": False,
            "imagen_url": _img("photo-1522337660859-02fbefca4702"),
            "tags": ["especial"], "color_tema": "#EC4899",
            "descripcion_larga": "Un detalle sorpresa del salón para celebrar tu cumpleaños — "
                                 "el equipo decide el mimo según lo que tengan disponible ese mes.",
            "instrucciones_canje": "Muestra tu DNI o código el mes de tu cumpleaños.",
            "terminos_condiciones": "• Válido solo durante el mes de cumpleaños del cliente\n"
                                     "• Un uso por año\n• Sujeto a disponibilidad de agenda",
        },
    ],
    "Tienda Maki": [
        {
            "nombre": "15% de descuento en tu compra",
            "tipo": TipoCupon.porcentual, "valor": 15.0, "monto_minimo": 30.0,
            "limite_usos_total": 100, "usos_actuales": 23, "destacado": True,
            "imagen_url": _img("photo-1441986300917-64674bd600d8"),
            "tags": ["ropa", "descuento"], "color_tema": "#3B82F6",
            "descripcion_larga": "15% de descuento en cualquier prenda o accesorio de la tienda. "
                                 "Renueva tu clóset con las últimas tendencias de temporada.",
            "instrucciones_canje": "Muestra tu código en caja antes de pagar.",
            "terminos_condiciones": "• Válido de lunes a viernes\n• No acumulable con otras ofertas\n"
                                     "• Compra mínima de S/30\n• Sujeto a stock disponible",
        },
        {
            "nombre": "Polo gratis",
            "tipo": TipoCupon.producto_gratis, "valor": None, "monto_minimo": None,
            "limite_usos_total": 50, "usos_actuales": 17, "destacado": True,
            "imagen_url": _img("photo-1483985988355-763728e1935b"),
            "tags": ["ropa", "favorito"], "color_tema": "#F97316",
            "descripcion_larga": "Un polo básico de cortesía para nuestros clientes más fieles — "
                                 "se desbloquea automáticamente al superar S/300 de compras en 30 días.",
            "instrucciones_canje": "Menciona 'WELVE' al momento de pagar.",
            "terminos_condiciones": "• Se desbloquea al superar el gasto acumulado del período\n"
                                     "• Un canje por cliente\n• Sujeto a stock disponible\n"
                                     "• No canjeable por dinero en efectivo",
        },
        {
            "nombre": "2x1 en polos seleccionados",
            "tipo": TipoCupon.dos_por_uno, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 8, "destacado": False,
            "imagen_url": _img("photo-1489987707025-afc232f7ea0f"),
            "tags": ["ropa", "promo"], "color_tema": "#EC4899",
            "descripcion_larga": "Lleva dos polos seleccionados al precio de uno — la excusa "
                                 "perfecta para renovar tu básico favorito en otro color.",
            "instrucciones_canje": "Indica el cupón antes de pagar en caja.",
            "terminos_condiciones": "• Válido solo en la línea de polos seleccionados\n"
                                     "• No acumulable\n• Sujeto a stock disponible\n"
                                     "• Válido todos los días",
        },
        {
            "nombre": "S/10 off en compras sobre S/50",
            "tipo": TipoCupon.monto_fijo, "valor": 10.0, "monto_minimo": 50.0,
            "limite_usos_total": None, "usos_actuales": 5, "destacado": False,
            "imagen_url": _img("photo-1560243563-062bfc001d68"),
            "tags": ["descuento"], "color_tema": "#10B981",
            "descripcion_larga": "S/10 de descuento directo en compras desde S/50 — ideal para "
                                 "completar tu look con algo extra.",
            "instrucciones_canje": "Presenta el código antes de pagar en caja.",
            "terminos_condiciones": "• Compra mínima de S/50\n• No acumulable con otras ofertas\n"
                                     "• Un uso por cliente\n• Sujeto a stock disponible",
        },
        {
            "nombre": "Envío gratis en tu pedido",
            "tipo": TipoCupon.envio_gratis, "valor": None, "monto_minimo": 150.0,
            "limite_usos_total": None, "usos_actuales": 0, "destacado": False,
            "imagen_url": _img("photo-1523381210434-271e8be1f52b"),
            "tags": ["envio"], "color_tema": "#0EA5E9",
            "descripcion_larga": "Envío gratis a todo Lima en compras desde S/150 — sin salir de casa.",
            "instrucciones_canje": "Se aplica automáticamente al superar el mínimo en el carrito.",
            "terminos_condiciones": "• Compra mínima de S/150\n• Solo envíos dentro de Lima "
                                     "Metropolitana\n• No acumulable con otras ofertas",
        },
    ],
    "Pizzería Bella Napoli": [
        {
            "nombre": "20% de descuento en tu pedido",
            "tipo": TipoCupon.porcentual, "valor": 20.0, "monto_minimo": 40.0,
            "limite_usos_total": 100, "usos_actuales": 12, "destacado": True,
            "imagen_url": _img("photo-1513104890138-7c749659a591"),
            "tags": ["pizza", "descuento"], "color_tema": "#EF4444",
            "descripcion_larga": "20% de descuento en cualquier pizza de la carta — la excusa "
                                 "perfecta para tu noche de pizza con la familia o los amigos.",
            "instrucciones_canje": "Muestra tu código al mozo antes de pagar.",
            "terminos_condiciones": "• Válido de martes a jueves\n• No acumulable con otras ofertas\n"
                                     "• Compra mínima de S/40\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "Postre gratis en tu 5ta visita",
            "tipo": TipoCupon.producto_gratis, "valor": None, "monto_minimo": None,
            "limite_usos_total": 50, "usos_actuales": 6, "destacado": True,
            "imagen_url": _img("photo-1551024506-0bccd828d307"),
            "tags": ["postres", "favorito"], "color_tema": "#F97316",
            "descripcion_larga": "Un tiramisú casero de cortesía para nuestros clientes más "
                                 "fieles — la receta original de la nonna.",
            "instrucciones_canje": "Menciona 'WELVE' al pedir la cuenta.",
            "terminos_condiciones": "• Un canje por visita\n• Sujeto a disponibilidad",
        },
        {
            "nombre": "2x1 en pizzas medianas",
            "tipo": TipoCupon.dos_por_uno, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 4, "destacado": False,
            "imagen_url": _img("photo-1548365328-9f547fb0953b"),
            "tags": ["pizza", "promo"], "color_tema": "#EC4899",
            "descripcion_larga": "Lleva dos pizzas medianas de la misma variedad al precio de "
                                 "una — ideal para compartir.",
            "instrucciones_canje": "Indica el cupón antes de ordenar.",
            "terminos_condiciones": "• Válido solo en pizzas medianas\n• No acumulable\n"
                                     "• Válido todos los días",
        },
        {
            "nombre": "S/15 off en compras sobre S/80",
            "tipo": TipoCupon.monto_fijo, "valor": 15.0, "monto_minimo": 80.0,
            "limite_usos_total": None, "usos_actuales": 3, "destacado": False,
            "imagen_url": _img("photo-1565299624946-b28f40a0ae38"),
            "tags": ["descuento"], "color_tema": "#10B981",
            "descripcion_larga": "S/15 de descuento directo en pedidos familiares desde S/80.",
            "instrucciones_canje": "Presenta el código antes de pagar la cuenta.",
            "terminos_condiciones": "• Compra mínima de S/80\n• No acumulable con otras ofertas\n"
                                     "• Un uso por cliente",
        },
    ],
    "Librería Página 1": [
        {
            "nombre": "15% de descuento en libros",
            "tipo": TipoCupon.porcentual, "valor": 15.0, "monto_minimo": 30.0,
            "limite_usos_total": 100, "usos_actuales": 9, "destacado": True,
            "imagen_url": _img("photo-1512820790803-83ca734da794"),
            "tags": ["libros", "descuento"], "color_tema": "#3B82F6",
            "descripcion_larga": "15% de descuento en toda la sección de narrativa y ensayo — "
                                 "tu próxima lectura, más accesible.",
            "instrucciones_canje": "Muestra tu código en caja antes de pagar.",
            "terminos_condiciones": "• Válido de lunes a viernes\n• No acumulable con otras ofertas\n"
                                     "• Compra mínima de S/30\n• Sujeto a stock disponible",
        },
        {
            "nombre": "Cuaderno de regalo",
            "tipo": TipoCupon.producto_gratis, "valor": None, "monto_minimo": None,
            "limite_usos_total": 50, "usos_actuales": 5, "destacado": True,
            "imagen_url": _img("photo-1531346878377-a5be20888e57"),
            "tags": ["papeleria", "favorito"], "color_tema": "#F97316",
            "descripcion_larga": "Un cuaderno de diseño exclusivo Página 1 de cortesía para "
                                 "nuestros clientes más fieles.",
            "instrucciones_canje": "Menciona 'WELVE' al momento de pagar.",
            "terminos_condiciones": "• Un canje por visita\n• Sujeto a stock disponible\n"
                                     "• No canjeable por dinero en efectivo",
        },
        {
            "nombre": "2x1 en cómics seleccionados",
            "tipo": TipoCupon.dos_por_uno, "valor": None, "monto_minimo": None,
            "limite_usos_total": None, "usos_actuales": 2, "destacado": False,
            "imagen_url": _img("photo-1544716278-ca5e3f4abd8c"),
            "tags": ["comics", "promo"], "color_tema": "#EC4899",
            "descripcion_larga": "Lleva dos cómics de la mesa de novedades al precio de uno.",
            "instrucciones_canje": "Indica el cupón antes de pagar en caja.",
            "terminos_condiciones": "• Válido solo en la mesa de cómics seleccionados\n"
                                     "• No acumulable\n• Sujeto a stock disponible",
        },
        {
            "nombre": "S/8 off en compras sobre S/40",
            "tipo": TipoCupon.monto_fijo, "valor": 8.0, "monto_minimo": 40.0,
            "limite_usos_total": None, "usos_actuales": 1, "destacado": False,
            "imagen_url": _img("photo-1524995997946-a1c2e315a42f"),
            "tags": ["descuento"], "color_tema": "#10B981",
            "descripcion_larga": "S/8 de descuento directo en compras desde S/40.",
            "instrucciones_canje": "Presenta el código antes de pagar en caja.",
            "terminos_condiciones": "• Compra mínima de S/40\n• No acumulable con otras ofertas\n"
                                     "• Un uso por cliente",
        },
    ],
}

MEMBRESIAS_DATA: dict[str, dict] = {
    "Café Ritual":            {"nombre": "Club Café",   "precio": 25.0, "beneficio": "Café gratis cada lunes"},
    "Salón Lumina":           {"nombre": "Club Lumina", "precio": 40.0, "beneficio": "20% off en cualquier servicio"},
    "Tienda Maki":            {"nombre": "Club Maki",   "precio": 30.0, "beneficio": "Envío gratis en todos tus pedidos"},
    "Pizzería Bella Napoli":  {"nombre": "Club Napoli", "precio": 35.0, "beneficio": "Postre gratis en cada visita"},
    "Librería Página 1":      {"nombre": "Club Página 1", "precio": 20.0, "beneficio": "10% off en toda tu compra"},
}

# Catálogo del módulo de Caja/POS — Salón Lumina son todo servicios (sin
# inventario), Café Ritual y Tienda Maki son productos físicos con stock.
PRODUCTOS_POR_EMPRESA: dict[str, list[dict]] = {
    "Café Ritual": [
        {"nombre": "Café americano",     "sku": "CAF-001", "categoria": "Bebidas",       "precio_base": 8.0,  "stock_actual": 100},
        {"nombre": "Café latte",         "sku": "CAF-002", "categoria": "Bebidas",       "precio_base": 10.0, "stock_actual": 80},
        {"nombre": "Cappuccino",         "sku": "CAF-003", "categoria": "Bebidas",       "precio_base": 10.0, "stock_actual": 80},
        {"nombre": "Croissant",          "sku": "COM-001", "categoria": "Comida",        "precio_base": 6.0,  "stock_actual": 30},
        {"nombre": "Tostada con palta",  "sku": "COM-002", "categoria": "Comida",        "precio_base": 12.0, "stock_actual": 25},
        {"nombre": "Bowl de granola",    "sku": "COM-003", "categoria": "Comida",        "precio_base": 14.0, "stock_actual": 20},
        {"nombre": "Taza Café Ritual",   "sku": "MER-001", "categoria": "Merchandising", "precio_base": 35.0, "stock_actual": 15},
    ],
    "Salón Lumina": [
        {"nombre": "Corte de cabello",      "sku": "COR-001", "categoria": "Cortes",        "precio_base": 35.0,  "tipo": TipoProducto.servicio, "gestionar_inventario": False},
        {"nombre": "Tinte completo",        "sku": "TIN-001", "categoria": "Tratamientos",  "precio_base": 120.0, "tipo": TipoProducto.servicio, "gestionar_inventario": False},
        {"nombre": "Keratina",              "sku": "TRA-001", "categoria": "Tratamientos",  "precio_base": 180.0, "tipo": TipoProducto.servicio, "gestionar_inventario": False},
        {"nombre": "Manicure",              "sku": "MAN-001", "categoria": "Tratamientos",  "precio_base": 25.0,  "tipo": TipoProducto.servicio, "gestionar_inventario": False},
        {"nombre": "Shampoo profesional",   "sku": "PRO-001", "categoria": "Productos",     "precio_base": 65.0,  "stock_actual": 20},
        {"nombre": "Mascarilla capilar",    "sku": "PRO-002", "categoria": "Productos",     "precio_base": 45.0,  "stock_actual": 15},
    ],
    "Tienda Maki": [
        {"nombre": "Polo básico",          "sku": "ROP-001", "categoria": "Ropa",        "precio_base": 49.0,  "stock_actual": 50},
        {"nombre": "Jeans slim",           "sku": "ROP-002", "categoria": "Ropa",        "precio_base": 129.0, "stock_actual": 30},
        {"nombre": "Vestido casual",       "sku": "ROP-003", "categoria": "Ropa",        "precio_base": 89.0,  "stock_actual": 20},
        {"nombre": "Bolso de mano",        "sku": "ACC-001", "categoria": "Accesorios",  "precio_base": 79.0,  "stock_actual": 15},
        {"nombre": "Cinturón de cuero",    "sku": "ACC-002", "categoria": "Accesorios",  "precio_base": 45.0,  "stock_actual": 25},
        {"nombre": "Zapatillas urbanas",   "sku": "CAL-001", "categoria": "Calzado",     "precio_base": 159.0, "stock_actual": 20},
    ],
    "Pizzería Bella Napoli": [
        {"nombre": "Pizza margarita",       "sku": "PIZ-001", "categoria": "Pizzas",   "precio_base": 32.0, "stock_actual": 40},
        {"nombre": "Pizza pepperoni",       "sku": "PIZ-002", "categoria": "Pizzas",   "precio_base": 38.0, "stock_actual": 40},
        {"nombre": "Pizza cuatro quesos",   "sku": "PIZ-003", "categoria": "Pizzas",   "precio_base": 42.0, "stock_actual": 30},
        {"nombre": "Tiramisú",              "sku": "POS-001", "categoria": "Postres",  "precio_base": 16.0, "stock_actual": 25},
        {"nombre": "Gaseosa 500ml",         "sku": "BEB-001", "categoria": "Bebidas",  "precio_base": 7.0,  "stock_actual": 100},
        {"nombre": "Vino tinto copa",       "sku": "BEB-002", "categoria": "Bebidas",  "precio_base": 18.0, "stock_actual": 40},
    ],
    "Librería Página 1": [
        {"nombre": "Cien años de soledad",  "sku": "LIB-001", "categoria": "Narrativa",  "precio_base": 49.0, "stock_actual": 20},
        {"nombre": "Rayuela",               "sku": "LIB-002", "categoria": "Narrativa",  "precio_base": 45.0, "stock_actual": 15},
        {"nombre": "Cómic Watchmen",        "sku": "COM-101", "categoria": "Comics",     "precio_base": 65.0, "stock_actual": 12},
        {"nombre": "Cuaderno de diseño",    "sku": "PAP-001", "categoria": "Papelería",  "precio_base": 22.0, "stock_actual": 35},
        {"nombre": "Set de plumones",       "sku": "PAP-002", "categoria": "Papelería",  "precio_base": 28.0, "stock_actual": 25},
    ],
}

_PRODUCTO_DEFAULTS = {
    "tipo": TipoProducto.producto,
    "gestionar_inventario": True,
    "stock_minimo": 5,
    "unidad_medida": UnidadMedida.unidad,
    "tiene_igv": True,
}

# (idx_cliente_en_empresa, idx_cupon, dias_atras, hora_offset)
CANJES_DATA: dict[str, list[tuple[int, int, int, int]]] = {
    "Café Ritual": [
        (0, 0, 1, 9),  (1, 1, 3, 14), (2, 2, 5, 10), (0, 3, 7, 17),
        (1, 0, 9, 11), (3, 1, 11, 8), (4, 2, 13, 15), (0, 0, 15, 9),
        (2, 3, 18, 16), (1, 1, 22, 10),
    ],
    "Salón Lumina": [
        (0, 0, 2, 10), (1, 1, 4, 13), (2, 0, 6, 9),  (3, 2, 8, 16),
        (4, 3, 10, 11), (0, 1, 12, 14), (1, 0, 14, 8), (2, 2, 17, 15),
        (3, 3, 20, 10), (4, 0, 25, 12),
    ],
    "Tienda Maki": [
        (0, 0, 1, 10), (1, 1, 4, 14), (2, 2, 6, 9),  (3, 3, 9, 16),
        (4, 0, 11, 11), (0, 1, 14, 13), (1, 2, 16, 8), (2, 0, 19, 15),
        (3, 1, 23, 10), (4, 3, 28, 12),
    ],
    "Pizzería Bella Napoli": [
        (0, 0, 2, 19), (1, 1, 5, 20), (2, 2, 7, 13), (3, 3, 10, 21),
        (4, 0, 12, 14), (0, 1, 15, 20), (1, 2, 18, 13), (2, 0, 21, 19),
        (3, 1, 24, 20), (4, 3, 27, 13),
    ],
    "Librería Página 1": [
        (0, 0, 3, 11), (1, 1, 6, 16), (2, 2, 9, 12), (3, 3, 13, 17),
        (4, 0, 16, 11), (0, 1, 19, 16), (1, 2, 22, 12), (2, 0, 25, 17),
        (3, 1, 27, 11), (4, 3, 29, 16),
    ],
}

_CANALES = [CanalCanje.qr, CanalCanje.magic_link, CanalCanje.staff_manual]


# ═══════════════════════════════════════════════════════════════════════════════
# Funciones de seed
# ═══════════════════════════════════════════════════════════════════════════════

async def seed_admins() -> None:
    for data in SUPER_ADMINS:
        existing = await WelveAdmin.find_one(WelveAdmin.email == data["email"])
        if existing:
            print(f"  [skip] WelveAdmin {data['email']}")
            continue
        try:
            await WelveAdmin(
                email=data["email"],
                password_hash=hash_password(data["password"]),
                nombre=data["nombre"],
                rol=data["rol"],
            ).insert()
            print(f"  [ok]   WelveAdmin {data['email']}")
        except Exception as e:
            print(f"  [error] WelveAdmin {data['email']}: {e}")


_EMPRESA_PERFIL_FIELDS = (
    "logo_url", "imagen_portada_url", "descripcion", "direccion", "horario",
    "telefono_contacto", "sitio_web", "instagram", "facebook",
)


async def seed_empresas() -> list[Empresa]:
    empresas: list[Empresa] = []
    for data in EMPRESAS_DATA:
        existing = await Empresa.find_one(Empresa.admin_email == data["email"])
        if existing:
            # Backfilla nombre + campos de perfil aunque la empresa ya exista, para
            # que correr el seed de nuevo pueble contenido agregado después
            # (imágenes, descripción, redes) sin duplicar el documento, y para
            # corregir el nombre si quedó desactualizado de un seed anterior.
            existing.nombre = data["nombre"]
            for field in _EMPRESA_PERFIL_FIELDS:
                setattr(existing, field, data[field])
            await existing.save()
            empresas.append(existing)
            print(f"  [update] Empresa {data['nombre']} (perfil actualizado)")
            continue
        try:
            obj = await Empresa(
                nombre=data["nombre"],
                rubro=data["rubro"],
                admin_email=data["email"],
                admin_password_hash=hash_password(data["password"]),
                **{f: data[f] for f in _EMPRESA_PERFIL_FIELDS},
            ).insert()
            empresas.append(obj)
            print(f"  [ok]   Empresa {data['nombre']}")
        except Exception as e:
            print(f"  [error] Empresa {data['nombre']}: {e}")
    return empresas


async def _generar_codigo_cliente_unico() -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        codigo = "WLV-" + "".join(random.choices(chars, k=4))
        if not await Cliente.find_one(Cliente.codigo_cliente == codigo):
            return codigo


async def _generar_codigo_cupon_unico() -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        codigo = "CUP-" + "".join(random.choices(chars, k=4))
        if not await Cupon.find_one(Cupon.codigo == codigo):
            return codigo


async def seed_clientes() -> list[Cliente]:
    clientes: list[Cliente] = []
    for data in CLIENTES_DATA:
        existing = await Cliente.find_one(Cliente.email == data["email"])
        if existing:
            print(f"  [skip] Cliente {data['nombre']}")
            clientes.append(existing)
            continue
        try:
            from app.core.security import hash_password
            obj = await Cliente(
                nombre=data["nombre"],
                email=data["email"],
                whatsapp=data["whatsapp"],
                password_hash=hash_password("password123"),
                codigo_cliente=await _generar_codigo_cliente_unico(),
                fecha_alta=_ago(data["dias_alta"]),
            ).insert()
            clientes.append(obj)
            print(f"  [ok]   Cliente {data['nombre']}")
        except Exception as e:
            print(f"  [error] Cliente {data['nombre']}: {e}")
    return clientes


async def seed_relaciones(empresas: list[Empresa], clientes: list[Cliente]) -> None:
    for empresa in empresas:
        idxs  = EMPRESA_CLIENTES_IDX[empresa.nombre]
        stats = RELACIONES_STATS[empresa.nombre]
        ticket = next(e["ticket"] for e in EMPRESAS_DATA if e["nombre"] == empresa.nombre)
        for pos, (cli_idx, rel_stat) in enumerate(zip(idxs, stats)):
            visitas, racha, dias_uv = rel_stat
            cliente = clientes[cli_idx]
            existing = await RelacionClienteEmpresa.find_one(
                RelacionClienteEmpresa.empresa_id == empresa.id,
                RelacionClienteEmpresa.cliente_id == cliente.id,
            )
            if existing:
                print(f"  [skip] Relacion {empresa.nombre} / {cliente.nombre}")
                continue
            segmento = SegmentoCliente.exclusivo if visitas > 10 else SegmentoCliente.regular
            try:
                await RelacionClienteEmpresa(
                    empresa_id=empresa.id,
                    cliente_id=cliente.id,
                    visitas_totales=visitas,
                    monto_acumulado=round(visitas * ticket, 2),
                    racha_actual=racha,
                    racha_maxima=racha + (pos % 3),
                    ultima_visita=_ago(dias_uv),
                    segmento=segmento,
                    fecha_entrada_segmento=_ago(dias_uv + 5) if segmento == SegmentoCliente.exclusivo else None,
                    puntos=visitas * 10,
                ).insert()
                print(f"  [ok]   Relacion {empresa.nombre} / {cliente.nombre} ({segmento.value}, {visitas} visitas)")
            except Exception as e:
                print(f"  [error] Relacion {empresa.nombre} / {cliente.nombre}: {e}")


_CUPON_CONTENIDO_FIELDS = (
    "nombre", "imagen_url", "terminos_condiciones", "descripcion_larga",
    "instrucciones_canje", "tags", "color_tema", "destacado",
)


async def seed_cupones(empresas: list[Empresa]) -> dict[str, list[Cupon]]:
    """Match por (empresa_id, tipo) — no por nombre — porque los nombres de la
    plantilla cambiaron a versiones temáticas; usar tipo como llave estable
    evita duplicar cupones si el seed ya corrió antes con los nombres viejos."""
    result: dict[str, list[Cupon]] = {}
    for empresa in empresas:
        result[empresa.nombre] = []
        for data in CUPONES_POR_EMPRESA[empresa.nombre]:
            existing = await Cupon.find_one(
                Cupon.empresa_id == empresa.id,
                Cupon.tipo == data["tipo"],
            )
            if existing:
                for field in _CUPON_CONTENIDO_FIELDS:
                    setattr(existing, field, data[field])
                if not existing.codigo:
                    existing.codigo = await _generar_codigo_cupon_unico()
                await existing.save()
                result[empresa.nombre].append(existing)
                print(f"  [update] Cupon '{data['nombre']}' / {empresa.nombre} (contenido actualizado)")
                continue
            try:
                obj = await Cupon(
                    empresa_id=empresa.id,
                    codigo=await _generar_codigo_cupon_unico(),
                    tipo=data["tipo"],
                    valor=data["valor"],
                    cantidad_paga=data.get("cantidad_paga"),
                    cantidad_lleva=data.get("cantidad_lleva"),
                    monto_minimo=data["monto_minimo"],
                    fecha_inicio=_ago(30),
                    fecha_expiracion=_fwd(60),
                    estado=EstadoCupon.activo,
                    limite_usos_total=data["limite_usos_total"],
                    limite_usos_por_cliente=1,
                    usos_actuales=data["usos_actuales"],
                    aplica_a=data.get("aplica_a", AplicaCupon.todo),
                    categorias_validas=data.get("categorias_validas", []),
                    **{f: data[f] for f in _CUPON_CONTENIDO_FIELDS},
                ).insert()
                result[empresa.nombre].append(obj)
                print(f"  [ok]   Cupon '{data['nombre']}' / {empresa.nombre}")
            except Exception as e:
                print(f"  [error] Cupon '{data['nombre']}' / {empresa.nombre}: {e}")
    return result


async def _crear_o_obtener_reto(empresa: Empresa, data: dict) -> Reto | None:
    """Devuelve el Reto (nuevo o ya existente) — a diferencia de un simple
    skip-and-continue, esto permite que el llamador siga usando `reto.id` para
    cablear cupones visibilidad=por_reto sin importar si el reto ya existía
    de una corrida anterior del seed (idempotencia)."""
    existing = await Reto.find_one(Reto.empresa_id == empresa.id, Reto.nombre == data["nombre"])
    if existing:
        print(f"  [skip] Reto '{data['nombre']}' / {empresa.nombre}")
        return existing
    try:
        reto = await Reto(
            empresa_id=empresa.id,
            nombre=data["nombre"],
            condicion_tipo=data["condicion_tipo"],
            condicion_valor=data["condicion_valor"],
            periodo_dias=data.get("periodo_dias"),
            producto_objetivo_id=data.get("producto_objetivo_id"),
            fecha_inicio=data.get("fecha_inicio", _MES_INICIO),
            fecha_fin=data.get("fecha_fin", _MES_FIN),
            recompensa_cupon_id=data["recompensa_cupon_id"],
            descripcion_recompensa=data.get("descripcion_recompensa"),
            notificado=True,
        ).insert()
        print(f"  [ok]   Reto '{data['nombre']}' / {empresa.nombre}")
        return reto
    except Exception as e:
        print(f"  [error] Reto '{data['nombre']}' / {empresa.nombre}: {e}")
        return None


_MES_INICIO = datetime(2026, 6, 1, tzinfo=timezone.utc)
_MES_FIN    = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)


async def seed_retos(
    empresas: list[Empresa],
    cupones_map: dict[str, list[Cupon]],
    productos_map: dict[str, list[Producto]],
) -> None:
    """Además de crear los retos, cablea visibilidad=por_reto en los cupones
    'gratis' que dependen de un reto (Café Ritual/Salón Lumina) — se hace acá,
    no en seed_cupones, porque necesita el `reto.id` que recién existe una vez
    creado el Reto. Se re-aplica en cada corrida (idempotente, .set() es
    seguro con el mismo valor)."""
    for empresa in empresas:
        cupones = cupones_map.get(empresa.nombre, [])
        if len(cupones) < 4:
            print(f"  [skip] Retos de {empresa.nombre}: faltan cupones")
            continue

        reto_visitas = await _crear_o_obtener_reto(empresa, {
            "nombre": "Visita 5 veces este mes",
            "condicion_tipo": TipoReto.num_visitas,
            "condicion_valor": 5.0,
            "recompensa_cupon_id": cupones[1].id,
        })
        await _crear_o_obtener_reto(empresa, {
            "nombre": "Acumula S/200 este mes",
            "condicion_tipo": TipoReto.monto_acumulado,
            "condicion_valor": 200.0,
            "recompensa_cupon_id": cupones[0].id,
        })

        if empresa.nombre == "Café Ritual" and reto_visitas is not None:
            await cupones[1].set({"visibilidad": AccesoVisibilidad.por_reto, "reto_id": reto_visitas.id})
            print("  [ok]   Visibilidad: Café Ritual / 'Café americano gratis' -> por_reto (5 visitas)")

        if empresa.nombre == "Salón Lumina":
            reto_gasto_periodo = await _crear_o_obtener_reto(empresa, {
                "nombre": "Gasta S/200 en 30 días",
                "condicion_tipo": TipoReto.monto_en_periodo,
                "condicion_valor": 200.0,
                "periodo_dias": 30,
                "recompensa_cupon_id": cupones[1].id,
                "descripcion_recompensa": "Manicure gratis",
            })
            if reto_gasto_periodo is not None:
                await cupones[1].set({"visibilidad": AccesoVisibilidad.por_reto, "reto_id": reto_gasto_periodo.id})
                print("  [ok]   Visibilidad: Salón Lumina / 'Manicure gratis' -> por_reto (gasto S/200/30d)")

        if empresa.nombre == "Tienda Maki":
            productos = {p.sku: p for p in productos_map.get(empresa.nombre, [])}
            polo = productos.get("ROP-001")
            if polo is not None:
                await _crear_o_obtener_reto(empresa, {
                    "nombre": "Compra 3 polos",
                    "condicion_tipo": TipoReto.productos_comprados,
                    "condicion_valor": 3.0,
                    "producto_objetivo_id": polo.id,
                    "recompensa_cupon_id": cupones[1].id,
                    "descripcion_recompensa": "Polo gratis",
                })


async def seed_membresias(empresas: list[Empresa]) -> dict[str, Membresia]:
    result: dict[str, Membresia] = {}
    for empresa in empresas:
        mdata = MEMBRESIAS_DATA[empresa.nombre]
        existing = await Membresia.find_one(
            Membresia.empresa_id == empresa.id,
            Membresia.nombre == mdata["nombre"],
        )
        if existing:
            print(f"  [skip] Membresía '{mdata['nombre']}' / {empresa.nombre}")
            result[empresa.nombre] = existing
            continue
        try:
            obj = await Membresia(
                empresa_id=empresa.id,
                nombre=mdata["nombre"],
                precio=mdata["precio"],
                beneficio_descripcion=mdata["beneficio"],
                frecuencia=FrecuenciaMembresia.mensual,
                estado=EstadoMembresia.activa,
            ).insert()
            result[empresa.nombre] = obj
            print(f"  [ok]   Membresía '{mdata['nombre']}' / {empresa.nombre}")
        except Exception as e:
            print(f"  [error] Membresía '{mdata['nombre']}' / {empresa.nombre}: {e}")
    return result


async def seed_membresias_clientes(
    empresas: list[Empresa],
    clientes: list[Cliente],
    membresias_map: dict[str, Membresia],
) -> None:
    for empresa in empresas:
        membresia = membresias_map.get(empresa.nombre)
        if not membresia:
            print(f"  [skip] MembresiaCliente {empresa.nombre}: sin membresía")
            continue
        for cli_idx in EMPRESA_CLIENTES_IDX[empresa.nombre][:2]:
            cliente = clientes[cli_idx]
            existing = await MembresiaCliente.find_one(
                MembresiaCliente.empresa_id == empresa.id,
                MembresiaCliente.cliente_id == cliente.id,
                MembresiaCliente.membresia_id == membresia.id,
            )
            if existing:
                print(f"  [skip] MembresiaCliente {empresa.nombre} / {cliente.nombre}")
                continue
            try:
                await MembresiaCliente(
                    empresa_id=empresa.id,
                    cliente_id=cliente.id,
                    membresia_id=membresia.id,
                    estado=EstadoMembresiaCliente.activa,
                    fecha_inicio=_ago(15),
                    fecha_proximo_cobro=_fwd(15),
                ).insert()
                print(f"  [ok]   MembresiaCliente {empresa.nombre} / {cliente.nombre}")
            except Exception as e:
                print(f"  [error] MembresiaCliente {empresa.nombre} / {cliente.nombre}: {e}")


async def seed_canjes(
    empresas: list[Empresa],
    clientes: list[Cliente],
    cupones_map: dict[str, list[Cupon]],
) -> None:
    for empresa in empresas:
        existing_count = await Canje.find(
            Canje.empresa_id == empresa.id,
            Canje.staff_ref == "seed_script",
        ).count()
        if existing_count > 0:
            print(f"  [skip] Canjes de {empresa.nombre} ({existing_count} ya existen)")
            continue
        cli_idxs = EMPRESA_CLIENTES_IDX[empresa.nombre]
        cupones  = cupones_map.get(empresa.nombre, [])
        for i, (cli_pos, cup_idx, dias, horas) in enumerate(CANJES_DATA[empresa.nombre]):
            cliente = clientes[cli_idxs[cli_pos]]
            cupon   = cupones[cup_idx]
            canal   = _CANALES[i % len(_CANALES)]
            try:
                await Canje(
                    empresa_id=empresa.id,
                    cliente_id=cliente.id,
                    cupon_id=cupon.id,
                    fecha=_ago(dias, horas),
                    canal=canal,
                    staff_ref="seed_script",
                ).insert()
                print(f"  [ok]   Canje {empresa.nombre} / {cliente.nombre} / '{cupon.nombre}'")
            except Exception as e:
                print(f"  [error] Canje {empresa.nombre}: {e}")


async def seed_productos(empresas: list[Empresa]) -> dict[str, list[Producto]]:
    result: dict[str, list[Producto]] = {}
    for empresa in empresas:
        result[empresa.nombre] = []
        for data in PRODUCTOS_POR_EMPRESA[empresa.nombre]:
            existing = await Producto.find_one(Producto.empresa_id == empresa.id, Producto.sku == data["sku"])
            if existing:
                result[empresa.nombre].append(existing)
                print(f"  [skip] Producto {data['sku']} / {empresa.nombre}")
                continue
            payload = {**_PRODUCTO_DEFAULTS, **data}
            precio_con_igv = round(payload["precio_base"] * 1.18, 2) if payload["tiene_igv"] else payload["precio_base"]
            try:
                obj = Producto(empresa_id=empresa.id, precio_con_igv=precio_con_igv, **payload)
                await obj.insert()
                result[empresa.nombre].append(obj)
                if obj.gestionar_inventario and obj.stock_actual > 0:
                    await MovimientoInventario(
                        empresa_id=empresa.id, producto_id=obj.id, tipo=TipoMovimiento.entrada,
                        cantidad=obj.stock_actual, stock_anterior=0, stock_nuevo=obj.stock_actual,
                        motivo="Stock inicial (seed)", created_by="seed",
                    ).insert()
                print(f"  [ok]   Producto {data['sku']} '{data['nombre']}' / {empresa.nombre}")
            except Exception as e:
                print(f"  [error] Producto {data['sku']} / {empresa.nombre}: {e}")
    return result


async def actualizar_cupones_pos(
    cupones_map: dict[str, list[Cupon]], productos_map: dict[str, list[Producto]],
) -> None:
    """Aplica las restricciones de productos/categoría del módulo de Caja a
    cupones ya sembrados por seed_cupones — separado porque necesita los
    _id de Producto, que solo existen después de seed_productos."""
    ritual_cupones = cupones_map.get("Café Ritual", [])
    ritual_productos = {
        p.sku: p for p in (await Producto.find(Producto.empresa_id == ritual_cupones[0].empresa_id).to_list())
    } if ritual_cupones else {}
    if len(ritual_cupones) >= 2:
        ids = [ritual_productos[s].id for s in ("CAF-001", "CAF-002", "CAF-003") if s in ritual_productos]
        await ritual_cupones[1].set({"aplica_a": AplicaCupon.productos_especificos, "productos_validos": ids})
        print("  [ok]   Restricción POS: Café Ritual / 'Café americano gratis' -> productos específicos (CAF-001/002/003)")
    if len(ritual_cupones) >= 4:
        await ritual_cupones[3].set({"visibilidad": AccesoVisibilidad.vip, "monto_minimo_carrito": 25.0})
        print("  [ok]   Visibilidad: Café Ritual / 'S/10 off' -> vip (monto mínimo de carrito S/25)")

    lumina_cupones = cupones_map.get("Salón Lumina", [])
    if len(lumina_cupones) >= 1:
        await lumina_cupones[0].set({
            "aplica_a": AplicaCupon.categoria, "categorias_validas": ["Cortes", "Tratamientos"],
            "visibilidad": AccesoVisibilidad.por_requisito,
            "requisito": RequisitoAcceso(tipo=TipoRequisito.visitas_totales, valor=3),
        })
        print("  [ok]   Restricción POS + visibilidad: Salón Lumina / '15% descuento' -> categoría "
              "(Cortes, Tratamientos), por_requisito (3 visitas)")

    maki_cupones = cupones_map.get("Tienda Maki", [])
    maki_productos = {
        p.sku: p for p in (await Producto.find(Producto.empresa_id == maki_cupones[0].empresa_id).to_list())
    } if maki_cupones else {}
    if len(maki_cupones) >= 4:
        await maki_cupones[3].set({"monto_minimo_carrito": 80.0})
        print("  [ok]   Restricción POS: Tienda Maki / 'S/10 off' -> monto mínimo de carrito S/80")
    if len(maki_cupones) >= 2 and "ROP-001" in maki_productos:
        await maki_cupones[1].set({
            "producto_gratis_id": maki_productos["ROP-001"].id,
            "visibilidad": AccesoVisibilidad.privado,
            "requisito": RequisitoAcceso(tipo=TipoRequisito.gasto_en_periodo, valor=300.0, periodo_dias=30),
        })
        print("  [ok]   Visibilidad: Tienda Maki / 'Polo gratis' -> privado, por_requisito "
              "(gasto S/300/30d, producto ROP-001)")


_METODOS_VENTA = [MetodoPagoVenta.efectivo, MetodoPagoVenta.tarjeta, MetodoPagoVenta.yape, MetodoPagoVenta.plin]


async def seed_ventas(
    empresas: list[Empresa],
    clientes: list[Cliente],
    productos_map: dict[str, list[Producto]],
    cupones_map: dict[str, list[Cupon]],
) -> None:
    """10 ventas de prueba por empresa en los últimos 30 días — usan la fecha
    real de ejecución (como los pagos, ver _HOY_PAGOS) para que el resumen de
    'ventas hoy/semana/mes' tenga datos al probar la Caja. No pasan por
    venta_service.procesar_venta a propósito: son historial de demostración,
    no deben alterar visitas/canjes/stock ya calibrados por seed_relaciones/
    seed_canjes/seed_productos."""
    for empresa in empresas:
        if await Venta.find(Venta.empresa_id == empresa.id, Venta.notas == "seed").count() > 0:
            print(f"  [skip] Ventas de {empresa.nombre}")
            continue

        productos = productos_map.get(empresa.nombre, [])
        if not productos:
            continue
        cli_idxs = EMPRESA_CLIENTES_IDX[empresa.nombre]
        cupon_descuento = next(
            (c for c in cupones_map.get(empresa.nombre, []) if c.tipo == TipoCupon.porcentual), None,
        )
        rng = random.Random(f"ventas-{empresa.nombre}")

        for i in range(10):
            if i < 2:
                dias_atras = 0
            elif i < 4:
                dias_atras = rng.randint(1, 6)
            else:
                dias_atras = rng.randint(7, 29)
            fecha = _HOY_PAGOS - timedelta(days=dias_atras, hours=rng.randint(0, 11))

            n_items = rng.randint(2, min(4, len(productos)))
            items_producto = rng.sample(productos, n_items)
            items: list[ItemVenta] = []
            subtotal = 0.0
            for p in items_producto:
                cantidad = rng.randint(1, 3)
                sub = round(p.precio_base * cantidad, 2)
                items.append(ItemVenta(
                    producto_id=p.id, nombre_producto=p.nombre, sku=p.sku,
                    cantidad=cantidad, precio_unitario=p.precio_base, subtotal=sub,
                ))
                subtotal += sub
            subtotal = round(subtotal, 2)

            con_cupon = cupon_descuento is not None and i < 3  # ~30%
            descuento_monto = round(subtotal * ((cupon_descuento.valor or 0) / 100), 2) if con_cupon else 0.0
            base = round(subtotal - descuento_monto, 2)
            igv = round(base * 0.18, 2)
            total = round(base + igv, 2)
            descuento_porcentaje = round((descuento_monto / subtotal) * 100, 2) if subtotal else 0.0

            cliente = None
            if con_cupon or rng.random() < 0.5:
                cliente = clientes[cli_idxs[rng.randrange(len(cli_idxs))]]

            metodo = _METODOS_VENTA[i % len(_METODOS_VENTA)]
            monto_efectivo = monto_tarjeta = monto_yape = vuelto = None
            if metodo == MetodoPagoVenta.efectivo:
                vuelto = rng.choice([0.0, 0.0, 2.0, 5.0, 10.0])
                monto_efectivo = round(total + vuelto, 2)
            elif metodo == MetodoPagoVenta.tarjeta:
                monto_tarjeta = total
            elif metodo == MetodoPagoVenta.yape:
                monto_yape = total

            try:
                await Venta(
                    empresa_id=empresa.id,
                    cliente_id=cliente.id if cliente else None,
                    codigo_cliente=cliente.codigo_cliente if cliente else None,
                    items=items,
                    subtotal=subtotal,
                    descuento_monto=descuento_monto,
                    descuento_porcentaje=descuento_porcentaje,
                    igv=igv,
                    total=total,
                    cupon_id=cupon_descuento.id if con_cupon else None,
                    cupon_codigo=cupon_descuento.nombre if con_cupon else None,
                    metodo_pago=metodo,
                    monto_efectivo=monto_efectivo,
                    monto_tarjeta=monto_tarjeta,
                    monto_yape=monto_yape,
                    vuelto=vuelto,
                    estado=EstadoVenta.completada,
                    notas="seed",
                    created_at=fecha,
                    created_by="seed",
                ).insert()
                print(f"  [ok]   Venta {empresa.nombre} #{i + 1} — S/{total:.2f} ({metodo.value})")
            except Exception as e:
                print(f"  [error] Venta {empresa.nombre} #{i + 1}: {e}")


_MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

_PAGOS_METODOS = [MetodoPago.tarjeta, MetodoPago.yape, MetodoPago.transferencia]


def _concepto_pago(plan, fecha: datetime) -> str:
    return f"Suscripción mensual Plan {PLAN_LABEL[plan]} - {_MESES_ES[fecha.month - 1].capitalize()} {fecha.year}"


async def seed_pagos(empresas: list[Empresa]) -> None:
    for i, empresa in enumerate(empresas):
        if await Pago.find(Pago.empresa_id == empresa.id).count() > 0:
            print(f"  [skip] Pagos de {empresa.nombre}")
            continue

        plan = empresa.plan_suscripcion
        monto = PLAN_PRECIOS[plan]

        # 3 pagos aprobados, uno por cada uno de los últimos 3 meses (el más
        # reciente es "hoy" y deja el plan vigente 30 días hacia adelante).
        for meses_atras in (2, 1, 0):
            fecha = _HOY_PAGOS - timedelta(days=30 * meses_atras)
            metodo = _PAGOS_METODOS[meses_atras % len(_PAGOS_METODOS)]
            es_tarjeta = metodo == MetodoPago.tarjeta
            try:
                await Pago(
                    empresa_id=empresa.id,
                    monto=monto,
                    plan=plan,
                    concepto=_concepto_pago(plan, fecha),
                    estado=EstadoPago.aprobado,
                    metodo_pago=metodo,
                    ultimos_4="4242" if es_tarjeta else None,
                    marca_tarjeta="visa" if es_tarjeta else None,
                    nombre_titular=empresa.nombre if es_tarjeta else None,
                    referencia=f"WLV-PAY-SEED-{i}{meses_atras}A",
                    fecha_pago=fecha,
                    fecha_vencimiento_plan=fecha + timedelta(days=30),
                    created_at=fecha,
                    updated_at=fecha,
                ).insert()
                print(f"  [ok]   Pago aprobado {empresa.nombre} / {metodo.value} / {fecha:%Y-%m-%d}")
            except Exception as e:
                print(f"  [error] Pago aprobado {empresa.nombre}: {e}")

        # 1 pago rechazado (fondos insuficientes)
        fecha_rechazo = _HOY_PAGOS - timedelta(days=10)
        try:
            await Pago(
                empresa_id=empresa.id,
                monto=monto,
                plan=plan,
                concepto=_concepto_pago(plan, fecha_rechazo),
                estado=EstadoPago.rechazado,
                metodo_pago=MetodoPago.tarjeta,
                ultimos_4="4000",
                marca_tarjeta="visa",
                nombre_titular=empresa.nombre,
                motivo_rechazo="Fondos insuficientes",
                referencia=f"WLV-PAY-SEED-{i}R",
                created_at=fecha_rechazo,
                updated_at=fecha_rechazo,
            ).insert()
            print(f"  [ok]   Pago rechazado {empresa.nombre}")
        except Exception as e:
            print(f"  [error] Pago rechazado {empresa.nombre}: {e}")

        # El pago aprobado más reciente deja el plan de la empresa vigente.
        await empresa.set({
            "fecha_vencimiento_plan": _HOY_PAGOS + timedelta(days=30),
            "updated_at": _HOY_PAGOS,
        })


async def print_summary() -> None:
    print("\n── Resumen ────────────────────────────────────────────────────────────")
    counts = [
        ("welve_admins",               await WelveAdmin.count()),
        ("empresas",                   await Empresa.count()),
        ("clientes",                   await Cliente.count()),
        ("relaciones_cliente_empresa", await RelacionClienteEmpresa.count()),
        ("cupones",                    await Cupon.count()),
        ("retos",                      await Reto.count()),
        ("membresias",                 await Membresia.count()),
        ("membresias_clientes",        await MembresiaCliente.count()),
        ("canjes",                     await Canje.count()),
        ("pagos",                      await Pago.count()),
        ("productos",                  await Producto.count()),
        ("movimientos_inventario",     await MovimientoInventario.count()),
        ("ventas",                     await Venta.count()),
    ]
    for name, n in counts:
        print(f"  {name:<30} {n:>4} docs")
    print(f"  {'TOTAL':<30} {sum(n for _, n in counts):>4} docs")


async def main() -> None:
    print("Conectando a MongoDB...")
    await init_db()

    print("\n── Seed: WelveAdmins")
    await seed_admins()

    print("\n── Seed: Empresas")
    empresas = await seed_empresas()

    print("\n── Seed: Clientes")
    clientes = await seed_clientes()

    print("\n── Seed: Relaciones Cliente-Empresa")
    await seed_relaciones(empresas, clientes)

    print("\n── Seed: Cupones")
    cupones_map = await seed_cupones(empresas)

    print("\n── Seed: Productos")
    productos_map = await seed_productos(empresas)

    print("\n── Seed: Retos")
    await seed_retos(empresas, cupones_map, productos_map)

    print("\n── Seed: Membresías")
    membresias_map = await seed_membresias(empresas)

    print("\n── Seed: Membresías Clientes")
    await seed_membresias_clientes(empresas, clientes, membresias_map)

    print("\n── Seed: Canjes")
    await seed_canjes(empresas, clientes, cupones_map)

    print("\n── Seed: Pagos")
    await seed_pagos(empresas)

    print("\n── Seed: Restricciones POS de cupones")
    await actualizar_cupones_pos(cupones_map, productos_map)

    print("\n── Seed: Ventas")
    await seed_ventas(empresas, clientes, productos_map, cupones_map)

    await print_summary()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
