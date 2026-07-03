from datetime import date, datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class Cliente(Document):
    """Identidad global del cliente B2C. Sin historial por empresa — eso vive en RelacionClienteEmpresa."""

    nombre: str
    apellido: Optional[str] = None
    email: Optional[str] = None       # al menos uno de email/whatsapp requerido
    whatsapp: Optional[str] = None    # formato E.164
    password_hash: Optional[str] = None # Added for email/password login
    foto_url: Optional[str] = None    # data URI base64 (data:image/...;base64,...), máx ~2 MB
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None      # "M" | "F" | "otro" | "prefiero_no_decir" — ver enums.Genero
    codigo_cliente: str                # "WLV-XXXX", global — cualquier empresa lo reconoce (ver cliente_service)
    fecha_alta: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clientes"
        indexes = [
            # partialFilterExpression en vez de sparse=True: Beanie/Pydantic
            # serializa Optional[str] = None como null explícito (no ausente),
            # así que un índice sparse no lo excluye — dos clientes sin
            # whatsapp/email ya chocan como "duplicados" de null. El filtro
            # por $type "string" sí los excluye correctamente. Ver
            # scripts/migrate_cliente_contacto_index.py para bases ya creadas
            # con el índice sparse viejo.
            IndexModel(
                [("email", ASCENDING)], unique=True,
                partialFilterExpression={"email": {"$type": "string"}},
                name="email_unique_partial",
            ),
            IndexModel(
                [("whatsapp", ASCENDING)], unique=True,
                partialFilterExpression={"whatsapp": {"$type": "string"}},
                name="whatsapp_unique_partial",
            ),
            IndexModel([("codigo_cliente", ASCENDING)], unique=True, name="codigo_cliente_unique"),
        ]
