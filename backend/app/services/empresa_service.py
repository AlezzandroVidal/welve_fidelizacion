from beanie import PydanticObjectId

from app.core.security import create_access_token, hash_password, verify_password
from app.models.cupon import Cupon
from app.models.empresa import Empresa, RecompensaAutomatica
from app.models.enums import EstadoEmpresa
from app.schemas.empresa import EmpresaRegister, RecompensaAutomaticaCreate, RecompensaAutomaticaUpdate


async def registrar_empresa(data: EmpresaRegister) -> Empresa:
    existente = await Empresa.find_one(Empresa.admin_email == data.admin_email)
    if existente:
        return None  # caller raises HTTPException

    empresa = Empresa(
        nombre=data.nombre,
        rubro=data.rubro,
        admin_email=data.admin_email,
        admin_password_hash=hash_password(data.admin_password),
        plan_suscripcion=data.plan_suscripcion,
    )
    await empresa.insert()
    return empresa


async def login_empresa(admin_email: str, admin_password: str) -> tuple[Empresa, str] | None:
    empresa = await Empresa.find_one(Empresa.admin_email == admin_email)
    if not empresa:
        return None
    if not verify_password(admin_password, empresa.admin_password_hash):
        return None
    token = create_access_token(
        subject=str(empresa.id),
        extra={"rol": "empresa", "email": empresa.admin_email},
    )
    return empresa, token


async def obtener_empresa(empresa_id: PydanticObjectId) -> Empresa | None:
    return await Empresa.get(empresa_id)


async def cambiar_password(empresa: Empresa, password_actual: str, password_nueva: str) -> tuple[bool, str | None]:
    """Retorna (ok, error_msg)."""
    if not verify_password(password_actual, empresa.admin_password_hash):
        return False, "La contraseña actual no es correcta"
    empresa.admin_password_hash = hash_password(password_nueva)
    await empresa.save()
    return True, None


async def desactivar_cuenta(empresa: Empresa) -> None:
    """Cancelación self-service (Zona de peligro del panel): pasa la empresa a
    `cancelado`, NO borra datos — `get_current_empresa_admin` ya rechaza login
    de empresas no activas, así que esto basta para bloquear el acceso.
    Clientes/cupones/canjes/etc quedan intactos para auditoría o reactivación
    manual por soporte."""
    empresa.estado = EstadoEmpresa.cancelado
    await empresa.save()


async def listar_recompensas_automaticas(empresa: Empresa) -> list[dict]:
    """Hidrata cupon_nombre para cada regla configurada — el índice en la lista es su identificador."""
    cupon_ids = [r.cupon_id for r in empresa.config.recompensas_automaticas]
    cupones = await Cupon.find({"_id": {"$in": cupon_ids}}).to_list() if cupon_ids else []
    cmap = {c.id: c.nombre for c in cupones}
    return [
        {
            "index": i,
            "visitas_requeridas": r.visitas_requeridas,
            "cupon_id": str(r.cupon_id),
            "cupon_nombre": cmap.get(r.cupon_id),
            "activa": r.activa,
            "descripcion": r.descripcion,
        }
        for i, r in enumerate(empresa.config.recompensas_automaticas)
    ]


async def agregar_recompensa_automatica(
    empresa: Empresa, data: RecompensaAutomaticaCreate, cupon_id: PydanticObjectId,
) -> Empresa:
    empresa.config.recompensas_automaticas.append(
        RecompensaAutomatica(
            visitas_requeridas=data.visitas_requeridas,
            cupon_id=cupon_id,
            descripcion=data.descripcion,
        )
    )
    await empresa.save()
    return empresa


async def eliminar_recompensa_automatica(empresa: Empresa, index: int) -> bool:
    if index < 0 or index >= len(empresa.config.recompensas_automaticas):
        return False
    empresa.config.recompensas_automaticas.pop(index)
    await empresa.save()
    return True


async def editar_recompensa_automatica(
    empresa: Empresa,
    index: int,
    data: RecompensaAutomaticaUpdate,
    cupon_id: PydanticObjectId | None,
) -> bool:
    """cupon_id ya debe venir validado (pertenece a la empresa) por el router, igual que en agregar_*."""
    if index < 0 or index >= len(empresa.config.recompensas_automaticas):
        return False
    r = empresa.config.recompensas_automaticas[index]
    if data.visitas_requeridas is not None:
        r.visitas_requeridas = data.visitas_requeridas
    if cupon_id is not None:
        r.cupon_id = cupon_id
    if data.descripcion is not None:
        r.descripcion = data.descripcion
    if data.activa is not None:
        r.activa = data.activa
    await empresa.save()
    return True
