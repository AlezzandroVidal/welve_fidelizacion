from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.cupon import Cupon
from app.models.cupon_desbloqueado import CuponDesbloqueado
from app.models.notificacion import Notificacion
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.models.membresia import Membresia
from app.models.membresia_cliente import MembresiaCliente
from app.models.cliente import Cliente
from app.models.canje import Canje
from app.models.enums import AccesoVisibilidad, EstadoAcceso, EstadoEmpresa, EstadoCupon, EstadoMembresiaCliente
from app.schemas.cupon import CuponDetalleResponse, EmpresaResumenCupon
from app.schemas.cupon_acceso import AccesoCupon
from app.schemas.reto import RetoResponse
from app.services import cupon_acceso_service, cupon_desbloqueo_service, cupon_service, progreso_service


async def _acceso(cupon: Cupon, cliente_id: Optional[PydanticObjectId], empresa_id: PydanticObjectId) -> AccesoCupon:
    return await cupon_acceso_service.evaluar_acceso_cupon(cupon, cliente_id, empresa_id)


async def get_empresas_wallet(cliente_id: PydanticObjectId) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    empresas = await Empresa.find(Empresa.estado == EstadoEmpresa.activo).to_list()
    relaciones = await RelacionClienteEmpresa.find(RelacionClienteEmpresa.cliente_id == cliente_id).to_list()
    relacion_map = {r.empresa_id: r for r in relaciones}
    
    cupones = await Cupon.find(
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_inicio <= now,
        Cupon.fecha_expiracion > now
    ).to_list()
    
    cupones_por_empresa = {}
    for c in cupones:
        cupones_por_empresa.setdefault(c.empresa_id, []).append(c)

    resultado = []
    for emp in empresas:
        rel = relacion_map.get(emp.id)
        cupones_empresa = cupones_por_empresa.get(emp.id, [])
        cupones_validos = 0
        cupon_destacado = None
        for c in cupones_empresa:
            acceso = await _acceso(c, cliente_id, emp.id)
            if not acceso.puede_ver:
                continue
            cupones_validos += 1
            if c.destacado and cupon_destacado is None:
                cupon_destacado = c.model_dump(mode="json")

        resultado.append({
            "id": str(emp.id),
            "nombre": emp.nombre,
            "rubro": emp.rubro,
            "logo_url": getattr(emp, "logo_url", None),
            "imagen_portada_url": getattr(emp, "imagen_portada_url", None),
            "descripcion": getattr(emp, "descripcion", None),
            "direccion": getattr(emp, "direccion", None),
            "horario": getattr(emp, "horario", None),
            "telefono_contacto": getattr(emp, "telefono_contacto", None),
            "instagram": getattr(emp, "instagram", None),
            "facebook": getattr(emp, "facebook", None),
            "tiktok": getattr(emp, "tiktok", None),
            "sitio_web": getattr(emp, "sitio_web", None),
            "total_cupones_activos": cupones_validos,
            "cupon_destacado": cupon_destacado,
            "mi_relacion": {
                "visitas_totales": rel.visitas_totales,
                "racha_actual": rel.racha_actual,
                "puntos": rel.puntos,
                "segmento": rel.segmento
            } if rel else None
        })
    return resultado

async def get_empresa_detalle(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    emp = await Empresa.get(empresa_id)
    if not emp or emp.estado != EstadoEmpresa.activo:
        raise HTTPException(status_code=404, detail="Empresa no encontrada o inactiva")
        
    rel = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id
    )
    
    cupones = await Cupon.find(
        Cupon.empresa_id == empresa_id,
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_inicio <= now,
        Cupon.fecha_expiracion > now
    ).to_list()
    
    cupones_validos = []
    for c in cupones:
        acceso = await _acceso(c, cliente_id, empresa_id)
        if not acceso.puede_ver:
            continue
        c_dict = c.model_dump(mode='json')
        c_dict["acceso"] = acceso.model_dump(mode='json')
        cupones_validos.append(c_dict)

    retos = await Reto.find(
        Reto.empresa_id == empresa_id,
        Reto.fecha_inicio <= now,
        Reto.fecha_fin > now,
        Reto.cancelado == False,  # noqa: E712
    ).to_list()

    retos_response = []
    for r in retos:
        progreso = 0.0
        if rel:
            progreso = await progreso_service.calcular_progreso_reto(r, rel, empresa_id, cliente_id)

        r_dict = r.model_dump(mode='json')
        r_dict["progreso_actual"] = progreso
        r_dict["porcentaje"] = min(100.0, progreso / r.condicion_valor * 100) if r.condicion_valor > 0 else 0
        retos_response.append(r_dict)
        
    membresias = await Membresia.find(Membresia.empresa_id == empresa_id).to_list()
    
    mi_membresia = None
    if rel:
        for m in membresias:
            sub = await MembresiaCliente.find_one(
                MembresiaCliente.cliente_id == cliente_id,
                MembresiaCliente.membresia_id == m.id,
                MembresiaCliente.estado == EstadoMembresiaCliente.activa
            )
            if sub:
                mi_membresia = sub.model_dump(mode='json')
                break

    return {
        "empresa": {
            "id": str(emp.id),
            "nombre": emp.nombre,
            "rubro": emp.rubro,
            "logo_url": getattr(emp, "logo_url", None),
            "imagen_portada_url": getattr(emp, "imagen_portada_url", None),
            "descripcion": getattr(emp, "descripcion", None),
            "direccion": getattr(emp, "direccion", None),
            "latitud": getattr(emp, "latitud", None),
            "longitud": getattr(emp, "longitud", None),
            "horario": getattr(emp, "horario", None),
            "telefono_contacto": getattr(emp, "telefono_contacto", None),
            "instagram": getattr(emp, "instagram", None),
            "facebook": getattr(emp, "facebook", None),
            "tiktok": getattr(emp, "tiktok", None),
            "sitio_web": getattr(emp, "sitio_web", None)
        },
        "cupones": cupones_validos,
        "mi_relacion": {
            "visitas_totales": rel.visitas_totales,
            "racha_actual": rel.racha_actual,
            "racha_maxima": rel.racha_maxima,
            "puntos": rel.puntos,
            "segmento": rel.segmento,
            "fecha_entrada_segmento": rel.fecha_entrada_segmento
        } if rel else None,
        "retos_activos": retos_response,
        "membresias_disponibles": [m.model_dump(mode='json') for m in membresias],
        "mi_membresia": mi_membresia
    }

async def get_mis_cupones(cliente_id: PydanticObjectId) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    relaciones = await RelacionClienteEmpresa.find(RelacionClienteEmpresa.cliente_id == cliente_id).to_list()
    if not relaciones:
        return {}
        
    empresa_ids = [r.empresa_id for r in relaciones]
    empresas = await Empresa.find({"_id": {"$in": empresa_ids}}).to_list()
    empresa_map = {e.id: e for e in empresas}

    cupones = await Cupon.find(
        {"empresa_id": {"$in": empresa_ids}},
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_inicio <= now,
        Cupon.fecha_expiracion > now
    ).to_list()

    agrupados = {}
    for c in cupones:
        emp = empresa_map.get(c.empresa_id)
        if not emp:
            continue

        acceso = await _acceso(c, cliente_id, c.empresa_id)
        if not acceso.puede_ver:
            continue

        emp_id = str(emp.id)
        if emp_id not in agrupados:
            agrupados[emp_id] = {
                "empresa": {
                    "id": str(emp.id),
                    "nombre": emp.nombre,
                    "logo_url": getattr(emp, "logo_url", None)
                },
                "cupones": []
            }
        c_dict = c.model_dump(mode='json')
        c_dict["acceso"] = acceso.model_dump(mode='json')
        agrupados[emp_id]["cupones"].append(c_dict)

    return agrupados

async def get_historial(cliente_id: PydanticObjectId, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    skip = (page - 1) * limit
    canjes = await Canje.find(Canje.cliente_id == cliente_id).sort("-fecha").skip(skip).limit(limit).to_list()
    
    # Enrich with empresa and cupon names
    empresa_ids = list(set(c.empresa_id for c in canjes))
    cupon_ids = list(set(c.cupon_id for c in canjes))
    
    empresas = await Empresa.find({"_id": {"$in": empresa_ids}}).to_list()
    cupones = await Cupon.find({"_id": {"$in": cupon_ids}}).to_list()
    
    emp_map = {e.id: e.nombre for e in empresas}
    logo_map = {e.id: getattr(e, "logo_url", None) for e in empresas}
    cup_map = {c.id: c.nombre for c in cupones}
    
    items = []
    for c in canjes:
        items.append({
            "id": str(c.id),
            "empresa_id": str(c.empresa_id),
            "empresa_nombre": emp_map.get(c.empresa_id, "Desconocida"),
            "empresa_logo": logo_map.get(c.empresa_id, None),
            "cupon_id": str(c.cupon_id),
            "cupon_nombre": cup_map.get(c.cupon_id, "Desconocido"),
            "canal": getattr(c, "canal", "desconocido"), # Assuming canal exists
            "fecha": c.fecha
        })
    
    total = await Canje.find(Canje.cliente_id == cliente_id).count()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

async def get_perfil(cliente_id: PydanticObjectId) -> Dict[str, Any]:
    cliente = await Cliente.get(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    relaciones = await RelacionClienteEmpresa.find(RelacionClienteEmpresa.cliente_id == cliente_id).to_list()
    empresa_ids = [r.empresa_id for r in relaciones]
    
    empresas = await Empresa.find({"_id": {"$in": empresa_ids}}).to_list()
    emp_map = {e.id: e for e in empresas}
    
    resumen = []
    total_puntos = 0
    racha_max = 0
    for r in relaciones:
        emp = emp_map.get(r.empresa_id)
        if not emp:
            continue
            
        resumen.append({
            "empresa": {
                "id": str(emp.id),
                "nombre": emp.nombre,
                "logo_url": getattr(emp, "logo_url", None)
            },
            "visitas": r.visitas_totales,
            "puntos": r.puntos,
            "racha": r.racha_actual,
            "segmento": r.segmento,
        })
        total_puntos += r.puntos
        if r.racha_maxima > racha_max:
            racha_max = r.racha_maxima
            
    total_canjes = await Canje.find(Canje.cliente_id == cliente_id).count()
    
    return {
        "cliente": {
            "nombre": cliente.nombre,
            "email": cliente.email,
            "whatsapp": getattr(cliente, "whatsapp", None),
            "foto_url": getattr(cliente, "foto_url", None),
            "tiene_password": cliente.password_hash is not None,
            "codigo_cliente": cliente.codigo_cliente,
        },
        "resumen": resumen,
        "total_canjes": total_canjes,
        "total_empresas": len(resumen),
        "total_puntos_global": total_puntos,
        "racha_maxima_global": racha_max
    }

async def get_mi_qr(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> Dict[str, Any]:
    """QR/código personal del cliente — es GLOBAL (mismo codigo_cliente en
    cualquier empresa, ver Cliente.codigo_cliente): cualquier staff que lo
    escanee o lo ingrese reconoce al cliente, incluso si nunca lo visitó
    antes (ver staff_service). empresa_id solo se usa para mostrar el nombre/
    logo del negocio en el que el cliente está parado."""
    cliente = await Cliente.get(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    emp = await Empresa.get(empresa_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    return {
        "codigo_cliente": cliente.codigo_cliente,
        "qr_data": f"welve://cliente/{cliente_id}",
        "empresa": {
            "nombre": emp.nombre,
            "logo_url": getattr(emp, "logo_url", None),
        },
    }


def _cupon_vigente_query(empresa_id: Optional[PydanticObjectId] = None):
    now = datetime.now(timezone.utc)
    clauses = [Cupon.estado == EstadoCupon.activo, Cupon.fecha_inicio <= now, Cupon.fecha_expiracion > now]
    if empresa_id is not None:
        clauses.insert(0, Cupon.empresa_id == empresa_id)
    return Cupon.find(*clauses)


async def get_cupones_destacados() -> List[Dict[str, Any]]:
    """Cupones destacados (marcados a mano por la empresa) de todas las
    empresas activas, para la sección de descubrimiento del inicio. Solo
    visibilidad=publico: no tiene sentido destacar en un feed anónimo algo
    que no todos los clientes pueden ver o canjear (vip/por_reto/por_requisito/
    privado)."""
    empresas = await Empresa.find(Empresa.estado == EstadoEmpresa.activo).to_list()
    empresa_map = {e.id: e for e in empresas}

    cupones = await _cupon_vigente_query().find(
        Cupon.destacado == True,  # noqa: E712
        Cupon.visibilidad == AccesoVisibilidad.publico,
    ).limit(10).to_list()

    resultado = []
    for c in cupones:
        emp = empresa_map.get(c.empresa_id)
        if not emp:
            continue
        item = c.model_dump(mode="json")
        item["empresa"] = {
            "id": str(emp.id),
            "nombre": emp.nombre,
            "rubro": emp.rubro,
            "logo_url": getattr(emp, "logo_url", None),
        }
        resultado.append(item)
    return resultado


async def get_cupones_por_empresa(
    empresa_id: PydanticObjectId,
    tag: Optional[str] = None,
    destacado: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    """Cupones vigentes de una empresa, con filtros opcionales de tag/destacado
    — usado por la sección 'Cupones por categoría' del inicio."""
    cupones = await _cupon_vigente_query(empresa_id).to_list()
    if tag is not None:
        cupones = [c for c in cupones if tag in (c.tags or [])]
    if destacado is not None:
        cupones = [c for c in cupones if c.destacado == destacado]
    return [c.model_dump(mode="json") for c in cupones]


async def get_cupon_detalle(
    cupon_id: PydanticObjectId, cliente: Optional[Cliente],
) -> CuponDetalleResponse:
    """Detalle público (auth opcional) de un cupón — usado por la página
    compartible /wallet/cupon/:id. La disponibilidad se calcula con
    cupon_acceso_service.evaluar_acceso_cupon, que NO exige una
    RelacionClienteEmpresa previa (ver Parte 1: la afiliación es un efecto
    secundario del primer canje, no un prerequisito para ver/canjear)."""
    cupon = await Cupon.get(cupon_id)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")

    emp = await Empresa.get(cupon.empresa_id)
    if not emp or emp.estado != EstadoEmpresa.activo:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")

    relacionados_docs = await _cupon_vigente_query(cupon.empresa_id).find(
        Cupon.id != cupon.id,
    ).limit(3).to_list()

    esta_afiliado = False
    if cliente is not None:
        relacion = await RelacionClienteEmpresa.find_one(
            RelacionClienteEmpresa.empresa_id == cupon.empresa_id,
            RelacionClienteEmpresa.cliente_id == cliente.id,
        )
        esta_afiliado = relacion is not None

    acceso = await _acceso(cupon, cliente.id if cliente is not None else None, cupon.empresa_id)

    base = cupon_service.cupon_to_response(cupon)
    return CuponDetalleResponse(
        **base.model_dump(),
        estaDisponibleParaMi=acceso.puede_canjear,
        estaAfiliado=esta_afiliado,
        accesoEstado=acceso.estado,
        progresoActual=acceso.progreso_actual,
        progresoMeta=acceso.progreso_meta,
        progresoPorcentaje=acceso.progreso_porcentaje,
        accesoMensaje=acceso.mensaje,
        desbloqueadoEn=acceso.desbloqueado_en,
        empresa=EmpresaResumenCupon(
            id=str(emp.id),
            nombre=emp.nombre,
            rubro=emp.rubro,
            logoUrl=getattr(emp, "logo_url", None),
            descripcion=getattr(emp, "descripcion", None),
            direccion=getattr(emp, "direccion", None),
            horario=getattr(emp, "horario", None),
            telefonoContacto=getattr(emp, "telefono_contacto", None),
            instagram=getattr(emp, "instagram", None),
            facebook=getattr(emp, "facebook", None),
            tiktok=getattr(emp, "tiktok", None),
            sitioWeb=getattr(emp, "sitio_web", None),
        ),
        cuponesRelacionados=[cupon_service.cupon_to_response(c) for c in relacionados_docs],
    )


def _reto_to_response(r: Reto, cupon_nombre: Optional[str]) -> RetoResponse:
    return RetoResponse(
        id=str(r.id),
        empresaId=str(r.empresa_id),
        nombre=r.nombre,
        condicionTipo=r.condicion_tipo,
        condicionValor=r.condicion_valor,
        periodoDias=r.periodo_dias,
        productoObjetivoId=str(r.producto_objetivo_id) if r.producto_objetivo_id else None,
        categoriaObjetivo=r.categoria_objetivo,
        fechaInicio=r.fecha_inicio,
        fechaFin=r.fecha_fin,
        recompensaCuponId=str(r.recompensa_cupon_id) if r.recompensa_cupon_id else None,
        recompensaCuponNombre=cupon_nombre,
        descripcionRecompensa=r.descripcion_recompensa,
        mostrarProgresoPublico=r.mostrar_progreso_publico,
        notificarAlCompletar=r.notificar_al_completar,
        mensajeCompletado=r.mensaje_completado,
        notificado=r.notificado,
        cancelado=r.cancelado,
    )


async def get_mis_retos(cliente_id: PydanticObjectId) -> List[Dict[str, Any]]:
    """Retos activos del cliente en TODAS sus empresas, con progreso calculado
    en tiempo real — usado por /wallet/mis-retos (a diferencia de
    get_empresa_detalle, que solo trae los de una empresa)."""
    now = datetime.now(timezone.utc)
    relaciones = await RelacionClienteEmpresa.find(RelacionClienteEmpresa.cliente_id == cliente_id).to_list()
    if not relaciones:
        return []

    empresa_ids = [r.empresa_id for r in relaciones]
    relacion_map = {r.empresa_id: r for r in relaciones}
    empresas = await Empresa.find(
        {"_id": {"$in": empresa_ids}}, Empresa.estado == EstadoEmpresa.activo,
    ).to_list()

    retos = await Reto.find(
        {"empresa_id": {"$in": empresa_ids}},
        Reto.fecha_inicio <= now,
        Reto.fecha_fin > now,
        Reto.cancelado == False,  # noqa: E712
    ).to_list()
    retos_por_empresa: Dict[PydanticObjectId, List[Reto]] = {}
    for r in retos:
        retos_por_empresa.setdefault(r.empresa_id, []).append(r)

    cupon_ids = [r.recompensa_cupon_id for r in retos if r.recompensa_cupon_id]
    cupones = await Cupon.find({"_id": {"$in": cupon_ids}}).to_list() if cupon_ids else []
    cupon_map = {c.id: c for c in cupones}

    resultado: List[Dict[str, Any]] = []
    for emp in empresas:
        retos_emp = retos_por_empresa.get(emp.id, [])
        if not retos_emp:
            continue
        rel = relacion_map.get(emp.id)

        retos_data = []
        for r in retos_emp:
            progreso = 0.0
            if rel:
                progreso = await progreso_service.calcular_progreso_reto(r, rel, emp.id, cliente_id)
            porcentaje = min(100.0, progreso / r.condicion_valor * 100) if r.condicion_valor > 0 else 0.0
            cupon = cupon_map.get(r.recompensa_cupon_id) if r.recompensa_cupon_id else None
            fecha_fin = r.fecha_fin if r.fecha_fin.tzinfo is not None else r.fecha_fin.replace(tzinfo=timezone.utc)
            dias_restantes = max(0, (fecha_fin - now).days)

            retos_data.append({
                "reto": _reto_to_response(r, cupon.nombre if cupon else None),
                "progreso_actual": progreso,
                "meta": r.condicion_valor,
                "porcentaje": round(porcentaje, 1),
                "completado": progreso >= r.condicion_valor,
                "cupon_recompensa": cupon_service.cupon_to_response(cupon) if cupon else None,
                "dias_restantes": dias_restantes,
            })

        resultado.append({
            "empresa": {
                "id": str(emp.id),
                "nombre": emp.nombre,
                "logo_url": getattr(emp, "logo_url", None),
            },
            "retos": retos_data,
        })
    return resultado


async def get_cupones_wallet(cliente_id: PydanticObjectId) -> Dict[str, Any]:
    """Todos los cupones que el cliente puede VER (público/vip/en-progreso/
    ya desbloqueados) de TODAS las empresas activas — a diferencia de
    get_mis_cupones, NO exige una RelacionClienteEmpresa previa (Parte 1: la
    afiliación no es un prerequisito). Usado por MisCuponesPage (tabs
    Disponibles / En progreso)."""
    now = datetime.now(timezone.utc)
    empresas = await Empresa.find(Empresa.estado == EstadoEmpresa.activo).to_list()
    cupones = await Cupon.find(
        Cupon.estado == EstadoCupon.activo,
        Cupon.fecha_inicio <= now,
        Cupon.fecha_expiracion > now,
    ).to_list()
    cupones_por_empresa: Dict[PydanticObjectId, List[Cupon]] = {}
    for c in cupones:
        cupones_por_empresa.setdefault(c.empresa_id, []).append(c)

    agrupados: Dict[str, Any] = {}
    for emp in empresas:
        items = []
        for c in cupones_por_empresa.get(emp.id, []):
            acceso = await _acceso(c, cliente_id, emp.id)
            if not acceso.puede_ver:
                continue
            c_dict = c.model_dump(mode="json")
            c_dict["acceso"] = acceso.model_dump(mode="json")
            items.append(c_dict)
        if items:
            agrupados[str(emp.id)] = {
                "empresa": {"id": str(emp.id), "nombre": emp.nombre, "logo_url": getattr(emp, "logo_url", None)},
                "cupones": items,
            }
    return agrupados


async def get_cupones_desbloqueados(cliente_id: PydanticObjectId) -> List[Dict[str, Any]]:
    """Cupones que el cliente desbloqueó (CuponDesbloqueado) pero aún no
    canjeó, ordenados por fecha de expiración del cupón ascendente (los que
    vencen antes, primero) — usado por el tab Desbloqueados de MisCuponesPage."""
    desbloqueos = await CuponDesbloqueado.find(
        CuponDesbloqueado.cliente_id == cliente_id,
        CuponDesbloqueado.canjeado == False,  # noqa: E712
    ).to_list()
    if not desbloqueos:
        return []

    cupon_ids = [d.cupon_id for d in desbloqueos]
    cupones = await Cupon.find({"_id": {"$in": cupon_ids}}).to_list()
    cupon_map = {c.id: c for c in cupones}
    desbloqueo_map = {d.cupon_id: d for d in desbloqueos}

    empresas = await Empresa.find({"_id": {"$in": [c.empresa_id for c in cupones]}}).to_list()
    empresa_map = {e.id: e for e in empresas}

    items = []
    for cupon in cupones:
        emp = empresa_map.get(cupon.empresa_id)
        c_dict = cupon.model_dump(mode="json")
        c_dict["desbloqueado_en"] = desbloqueo_map[cupon.id].desbloqueado_en
        c_dict["empresa"] = {
            "id": str(emp.id) if emp else None,
            "nombre": emp.nombre if emp else "Desconocida",
            "logo_url": getattr(emp, "logo_url", None) if emp else None,
        }
        items.append(c_dict)

    items.sort(key=lambda i: i["fecha_expiracion"])
    return items


async def confirmar_desbloqueo_cupon(cupon_id: PydanticObjectId, cliente_id: PydanticObjectId) -> Dict[str, Any]:
    """El cliente reclama un cupón que ya cumplió su condición (estado
    desbloqueado_pendiente) — botón '¡Reclamar mi cupón!' en MisRetosPage.
    Idempotente vía cupon_desbloqueo_service.desbloquear_cupon (índice único
    cliente_id+cupon_id)."""
    cupon = await Cupon.get(cupon_id)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")

    acceso = await _acceso(cupon, cliente_id, cupon.empresa_id)
    if acceso.estado != EstadoAcceso.desbloqueado_pendiente and acceso.desbloqueado_en is None:
        raise HTTPException(status_code=400, detail="Este cupón todavía no cumple la condición de desbloqueo")

    desbloqueo = await cupon_desbloqueo_service.desbloquear_cupon(cupon_id, cliente_id, cupon.empresa_id)
    if desbloqueo is None:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")

    return {"cupon_id": str(cupon_id), "desbloqueado_en": desbloqueo.desbloqueado_en}
