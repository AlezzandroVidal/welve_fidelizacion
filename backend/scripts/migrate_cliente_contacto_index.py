"""
Migración one-off (2026-07): reemplaza los índices únicos sparse de
clientes.email / clientes.whatsapp por índices únicos parciales
(partialFilterExpression: {"$type": "string"}).

Motivo: Beanie/Pydantic serializa `Optional[str] = None` como `null`
explícito en el documento, no como campo ausente. Un índice `sparse=True`
solo excluye documentos donde el campo está AUSENTE, así que dos clientes
con `whatsapp: null` (o `email: null`) ya colisionan como "duplicados" de
null, aunque exista `sparse`. Bloqueaba, por ejemplo, registrar un segundo
cliente solo con email (sin whatsapp). Un índice parcial filtrando por
`$type: "string"` sí excluye los `null` correctamente.

Ejecutar UNA VEZ:

    cd backend && python scripts/migrate_cliente_contacto_index.py

Usa pymongo directo (no init_beanie/Beanie): por default Beanie no dropea
índices existentes al arrancar (`allow_index_dropping` no está activado en
app/db/mongodb.py), así que el índice sparse viejo se queda intacto aunque
el modelo ya declare el nuevo — hay que dropearlo a mano.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from pymongo import ASCENDING, MongoClient
from pymongo.errors import OperationFailure

from app.core.config import settings


def main():
    db = MongoClient(settings.mongo_uri)[settings.mongo_db]
    clientes = db["clientes"]

    for campo in ("email", "whatsapp"):
        indice_viejo = f"{campo}_1"
        try:
            clientes.drop_index(indice_viejo)
            print(f"Índice sparse viejo '{indice_viejo}' eliminado.")
        except OperationFailure:
            print(f"Índice '{indice_viejo}' no existía (ok).")

        nombre_nuevo = f"{campo}_unique_partial"
        clientes.create_index(
            [(campo, ASCENDING)],
            unique=True,
            partialFilterExpression={campo: {"$type": "string"}},
            name=nombre_nuevo,
        )
        print(f"Índice parcial '{nombre_nuevo}' creado.")


if __name__ == "__main__":
    main()
