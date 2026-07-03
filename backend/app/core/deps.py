# Shim de compatibilidad — la fuente de verdad es core/dependencies.py
from app.core.dependencies import (  # noqa: F401
    bearer,
    get_current_empresa,
    get_current_empresa_admin,
    get_current_cliente_context,
    get_current_cliente,
    get_global_cliente,
    get_optional_cliente,
    get_current_super_admin,
)
