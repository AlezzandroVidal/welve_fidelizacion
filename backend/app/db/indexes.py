"""Índices adicionales para queries frecuentes que no están cubiertas por los
`Indexed(...)` de los modelos Beanie ni por sus `Settings.indexes`. Se llama
una vez desde `init_db()`, después de `init_beanie()`.

`create_index` es idempotente — no dropea ni duplica nada si el índice ya
existe con la misma definición, así que es seguro llamarlo en cada arranque.

Nombres de campo verificados contra los modelos reales en `app/models/` (no
asumidos) — en particular: `Canje.fecha` es el campo de negocio (no
`created_at`, que también existe pero no es el que se filtra en
`metricas_service.py`), y `Reto` no tiene campo `estado` (solo `cancelado`,
`fecha_inicio`, `fecha_fin`), así que no se indexa un campo inexistente.
Los índices `email`/`whatsapp` de `Cliente` no se tocan acá: ya usan
`partialFilterExpression` en el modelo (ver `migrate_cliente_contacto_index.py`)
en vez de `sparse`, evitando la colisión de nulls que un `sparse` simple
volvería a introducir.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING as ASC, DESCENDING as DESC


async def crear_indices(db: AsyncIOMotorDatabase) -> None:
    # EMPRESAS
    await db.empresas.create_index([("estado", ASC)])

    # RELACIONES CLIENTE-EMPRESA — las más consultadas (dashboard, staff, wallet)
    await db.relaciones_cliente_empresa.create_index([("empresa_id", ASC), ("visitas_totales", DESC)])
    await db.relaciones_cliente_empresa.create_index([("empresa_id", ASC), ("ultima_visita", DESC)])
    # clientes_nuevos_por_dia() en metricas_service.py filtra por este rango
    await db.relaciones_cliente_empresa.create_index([("empresa_id", ASC), ("created_at", ASC)])

    # CUPONES
    await db.cupones.create_index([("empresa_id", ASC), ("destacado", ASC)])
    await db.cupones.create_index([("empresa_id", ASC), ("fecha_expiracion", ASC)])
    await db.cupones.create_index([("empresa_id", ASC), ("visibilidad", ASC), ("estado", ASC)])

    # CANJES — el campo de fecha de negocio es `fecha`, no `created_at`
    # (ver metricas_service.obtener_resumen / canjes_por_dia)
    await db.canjes.create_index([("empresa_id", ASC), ("fecha", DESC)])
    await db.canjes.create_index([("cliente_id", ASC), ("fecha", DESC)])

    # RETOS — sin campo `estado`; el filtro real de "reto vigente" es por fechas
    await db.retos.create_index([("empresa_id", ASC), ("fecha_inicio", ASC), ("fecha_fin", ASC)])

    # PRODUCTOS
    await db.productos.create_index([("empresa_id", ASC), ("estado", ASC), ("tipo", ASC)])
    await db.productos.create_index([("empresa_id", ASC), ("stock_actual", ASC)])

    # VENTAS
    await db.ventas.create_index([("empresa_id", ASC), ("created_at", DESC)])

    # NOTIFICACIONES — agrega created_at al índice existente (cliente_id, leida)
    # para que el sort("-created_at") de listar_no_leidas() no ordene en memoria
    await db.notificaciones.create_index([("cliente_id", ASC), ("leida", ASC), ("created_at", DESC)])

    # CUPONES DESBLOQUEADOS
    await db.cupones_desbloqueados.create_index([("cliente_id", ASC), ("canjeado", ASC)])

    # HISTORIAL_VISITAS ya tiene (empresa_id, cliente_id, fecha) vía
    # Settings.indexes del modelo — cubre progreso_service.py, no se duplica acá.
