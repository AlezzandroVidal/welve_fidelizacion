"""
Migración one-off (2026-07, v2): el codigo_cliente pasa de ser por-empresa
(en RelacionClienteEmpresa) a ser GLOBAL (en Cliente) — cualquier empresa que
escanee/ingrese el código reconoce al cliente automáticamente, incluso si
nunca lo visitó antes (ver PRODUCT.MD y app/services/staff_service.py).

Ejecutar UNA VEZ antes de levantar un backend con el modelo nuevo:

    cd backend && python scripts/migrate_codigo_cliente.py

Pasos:
1. Por cada Cliente sin codigo_cliente, reutiliza uno de sus códigos viejos
   (de alguna RelacionClienteEmpresa) si tiene, o genera uno nuevo.
2. Quita el campo codigo_cliente de relaciones_cliente_empresa (ya no se usa).
3. Elimina el índice único viejo empresa_codigo_cliente_unique.

Usa pymongo directo (no Beanie/init_beanie) por la misma razón que la v1: el
índice único nuevo en clientes.codigo_cliente no puede construirse mientras
existan documentos viejos sin el campo.
"""
import random
import string
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from pymongo import MongoClient
from pymongo.errors import OperationFailure

from app.core.config import settings


def generar_codigo() -> str:
    chars = string.ascii_uppercase + string.digits
    return "WLV-" + "".join(random.choices(chars, k=4))


def main():
    db = MongoClient(settings.mongo_uri)[settings.mongo_db]
    clientes = db["clientes"]
    relaciones = db["relaciones_cliente_empresa"]

    # 1. Un código viejo (por-empresa) reutilizable por cliente, si existe.
    codigo_viejo_por_cliente: dict = {}
    for doc in relaciones.find({"codigo_cliente": {"$exists": True}}, {"cliente_id": 1, "codigo_cliente": 1}):
        codigo_viejo_por_cliente.setdefault(doc["cliente_id"], doc["codigo_cliente"])

    pendientes = list(clientes.find({"codigo_cliente": {"$exists": False}}))
    print(f"Clientes sin codigo_cliente global: {len(pendientes)}")

    usados = {doc["codigo_cliente"] for doc in clientes.find({"codigo_cliente": {"$exists": True}}, {"codigo_cliente": 1})}

    actualizados = 0
    for doc in pendientes:
        codigo = codigo_viejo_por_cliente.get(doc["_id"])
        if not codigo or codigo in usados:
            codigo = generar_codigo()
            while codigo in usados:
                codigo = generar_codigo()
        usados.add(codigo)
        clientes.update_one({"_id": doc["_id"]}, {"$set": {"codigo_cliente": codigo}})
        actualizados += 1
    print(f"Clientes actualizados: {actualizados}")

    # 2. El índice único viejo (empresa_id, codigo_cliente) debe caer ANTES de
    # quitar el campo — si no, todos los docs con el campo ya ausente colisionan
    # entre sí como si fueran (empresa_id, codigo_cliente=null) duplicados.
    try:
        relaciones.drop_index("empresa_codigo_cliente_unique")
        print("Índice empresa_codigo_cliente_unique eliminado.")
    except OperationFailure:
        print("Índice empresa_codigo_cliente_unique no existía (ok).")

    # 3. Limpieza: el campo ya no vive en relaciones_cliente_empresa.
    resultado = relaciones.update_many({"codigo_cliente": {"$exists": True}}, {"$unset": {"codigo_cliente": ""}})
    print(f"Relaciones limpiadas (campo viejo removido): {resultado.modified_count}")


if __name__ == "__main__":
    main()
