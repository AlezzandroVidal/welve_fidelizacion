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
from app.models.cupon import Cupon
from app.models.empresa import Empresa
from app.models.enums import (
    CanalCanje,
    EstadoCupon,
    EstadoMembresia,
    EstadoMembresiaCliente,
    FrecuenciaMembresia,
    RubroEmpresa,
    SegmentoCliente,
    TipoCupon,
    TipoCondicionReto,
    WelveAdminRol,
)
from app.models.membresia import Membresia
from app.models.membresia_cliente import MembresiaCliente
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.models.welve_admin import WelveAdmin

# ── Referencia temporal fija — reproduce los mismos datos en cada reset ───────
_NOW = datetime(2026, 6, 29, 12, 0, 0, tzinfo=timezone.utc)


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
    },
    {
        "nombre": "Salón Lumina",
        "rubro": RubroEmpresa.belleza,
        "email": "admin@salonlumina.pe",
        "password": "Lumina2024!",
        "ticket": 65.0,
    },
    {
        "nombre": "Tienda Maki",
        "rubro": RubroEmpresa.retail,
        "email": "admin@tiendamaki.pe",
        "password": "Maki2024!",
        "ticket": 42.0,
    },
]

# 10 clientes únicos globales
CLIENTES_DATA = [
    {"nombre": "Ana García",    "email": "ana.garcia@gmail.com",    "whatsapp": "+51987654321", "dias_alta": 180},
    {"nombre": "Carlos Quispe", "email": "carlos.quispe@gmail.com", "whatsapp": "+51976543210", "dias_alta": 155},
    {"nombre": "María López",   "email": "maria.lopez@gmail.com",   "whatsapp": "+51965432109", "dias_alta": 130},
    {"nombre": "Pedro Mamani",  "email": "pedro.mamani@gmail.com",  "whatsapp": "+51954321098", "dias_alta": 110},
    {"nombre": "Lucía Ramos",   "email": "lucia.ramos@gmail.com",   "whatsapp": "+51943210987", "dias_alta":  90},
    {"nombre": "Jorge Huanca",  "email": "jorge.huanca@gmail.com",  "whatsapp": "+51932109876", "dias_alta":  70},
    {"nombre": "Rosa Vargas",   "email": "rosa.vargas@gmail.com",   "whatsapp": "+51921098765", "dias_alta":  50},
    {"nombre": "Miguel Torres", "email": "miguel.torres@gmail.com", "whatsapp": "+51910987654", "dias_alta":  40},
    {"nombre": "Elena Flores",  "email": "elena.flores@gmail.com",  "whatsapp": "+51999876543", "dias_alta":  25},
    {"nombre": "Diego Chávez",  "email": "diego.chavez@gmail.com",  "whatsapp": "+51988765432", "dias_alta":  10},
]

# 5 clientes por empresa; clientes 0-1 compartidos entre Café Ritual y Salón Lumina,
# clientes 2-4 compartidos entre Café Ritual y Tienda Maki → 10 únicos, 15 relaciones
EMPRESA_CLIENTES_IDX: dict[str, list[int]] = {
    "Café Ritual":  [0, 1, 2, 3, 4],
    "Salón Lumina": [0, 1, 5, 6, 7],
    "Tienda Maki":  [2, 3, 4, 8, 9],
}

# (visitas_totales, racha_actual, dias_ultima_visita) — uno por cliente por empresa
RELACIONES_STATS: dict[str, list[tuple[int, int, int]]] = {
    "Café Ritual":  [(22, 8, 1),  (15, 4, 5),  (8,  2, 12), (3,  1, 20), (18, 6, 3) ],
    "Salón Lumina": [(12, 5, 2),  (7,  3, 8),  (20, 7, 1),  (4,  0, 25), (9,  2, 10)],
    "Tienda Maki":  [(5,  1, 15), (11, 4, 4),  (25, 8, 2),  (2,  0, 28), (14, 5, 7) ],
}

# Mismos 4 cupones para las 3 empresas
CUPONES_PLANTILLA = [
    {
        "nombre": "15% de descuento",
        "tipo": TipoCupon.descuento_porcentual,
        "valor": 15.0,
        "monto_minimo": 30.0,
        "limite_usos_total": 100,
        "usos_actuales": 23,
        "exclusivo": False,
    },
    {
        "nombre": "Café americano gratis",
        "tipo": TipoCupon.producto_gratis,
        "valor": None,
        "monto_minimo": None,
        "limite_usos_total": 50,
        "usos_actuales": 17,
        "exclusivo": True,
    },
    {
        "nombre": "2x1 en pasteles",
        "tipo": TipoCupon.dos_por_uno,
        "valor": None,
        "monto_minimo": None,
        "limite_usos_total": None,
        "usos_actuales": 8,
        "exclusivo": False,
    },
    {
        "nombre": "S/10 off en compras sobre S/50",
        "tipo": TipoCupon.descuento_fijo,
        "valor": 10.0,
        "monto_minimo": 50.0,
        "limite_usos_total": None,
        "usos_actuales": 5,
        "exclusivo": False,
    },
]

MEMBRESIAS_DATA: dict[str, dict] = {
    "Café Ritual":  {"nombre": "Club Café",   "precio": 25.0, "beneficio": "Café gratis cada lunes"},
    "Salón Lumina": {"nombre": "Club Lumina", "precio": 40.0, "beneficio": "20% off en cualquier servicio"},
    "Tienda Maki":  {"nombre": "Club Maki",   "precio": 30.0, "beneficio": "Envío gratis en todos tus pedidos"},
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


async def seed_empresas() -> list[Empresa]:
    empresas: list[Empresa] = []
    for data in EMPRESAS_DATA:
        existing = await Empresa.find_one(Empresa.admin_email == data["email"])
        if existing:
            print(f"  [skip] Empresa {data['nombre']}")
            empresas.append(existing)
            continue
        try:
            obj = await Empresa(
                nombre=data["nombre"],
                rubro=data["rubro"],
                admin_email=data["email"],
                admin_password_hash=hash_password(data["password"]),
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


async def seed_cupones(empresas: list[Empresa]) -> dict[str, list[Cupon]]:
    result: dict[str, list[Cupon]] = {}
    for empresa in empresas:
        result[empresa.nombre] = []
        for data in CUPONES_PLANTILLA:
            existing = await Cupon.find_one(
                Cupon.empresa_id == empresa.id,
                Cupon.nombre == data["nombre"],
            )
            if existing:
                print(f"  [skip] Cupon '{data['nombre']}' / {empresa.nombre}")
                result[empresa.nombre].append(existing)
                continue
            try:
                obj = await Cupon(
                    empresa_id=empresa.id,
                    nombre=data["nombre"],
                    tipo=data["tipo"],
                    valor=data["valor"],
                    monto_minimo=data["monto_minimo"],
                    fecha_inicio=_ago(30),
                    fecha_expiracion=_fwd(60),
                    estado=EstadoCupon.activo,
                    limite_usos_total=data["limite_usos_total"],
                    limite_usos_por_cliente=1,
                    usos_actuales=data["usos_actuales"],
                    exclusivo=data["exclusivo"],
                ).insert()
                result[empresa.nombre].append(obj)
                print(f"  [ok]   Cupon '{data['nombre']}' / {empresa.nombre}")
            except Exception as e:
                print(f"  [error] Cupon '{data['nombre']}' / {empresa.nombre}: {e}")
    return result


async def seed_retos(empresas: list[Empresa], cupones_map: dict[str, list[Cupon]]) -> None:
    mes_inicio = datetime(2026, 6, 1, tzinfo=timezone.utc)
    mes_fin    = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)
    for empresa in empresas:
        cupones = cupones_map.get(empresa.nombre, [])
        if len(cupones) < 4:
            print(f"  [skip] Retos de {empresa.nombre}: faltan cupones")
            continue
        retos_def = [
            {
                "nombre": "Visita 5 veces este mes",
                "condicion_tipo": TipoCondicionReto.num_visitas,
                "condicion_valor": 5.0,
                "recompensa_cupon_id": cupones[1].id,
            },
            {
                "nombre": "Acumula S/200 este mes",
                "condicion_tipo": TipoCondicionReto.monto_acumulado,
                "condicion_valor": 200.0,
                "recompensa_cupon_id": cupones[0].id,
            },
        ]
        for data in retos_def:
            existing = await Reto.find_one(
                Reto.empresa_id == empresa.id,
                Reto.nombre == data["nombre"],
            )
            if existing:
                print(f"  [skip] Reto '{data['nombre']}' / {empresa.nombre}")
                continue
            try:
                await Reto(
                    empresa_id=empresa.id,
                    nombre=data["nombre"],
                    condicion_tipo=data["condicion_tipo"],
                    condicion_valor=data["condicion_valor"],
                    fecha_inicio=mes_inicio,
                    fecha_fin=mes_fin,
                    recompensa_cupon_id=data["recompensa_cupon_id"],
                    notificado=True,
                ).insert()
                print(f"  [ok]   Reto '{data['nombre']}' / {empresa.nombre}")
            except Exception as e:
                print(f"  [error] Reto '{data['nombre']}' / {empresa.nombre}: {e}")


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

    print("\n── Seed: Retos")
    await seed_retos(empresas, cupones_map)

    print("\n── Seed: Membresías")
    membresias_map = await seed_membresias(empresas)

    print("\n── Seed: Membresías Clientes")
    await seed_membresias_clientes(empresas, clientes, membresias_map)

    print("\n── Seed: Canjes")
    await seed_canjes(empresas, clientes, cupones_map)

    await print_summary()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
