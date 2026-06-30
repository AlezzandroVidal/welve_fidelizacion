from datetime import datetime, timezone
from typing import Any, Dict, List
from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.cupon import Cupon
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.models.membresia import Membresia
from app.models.membresia_cliente import MembresiaCliente
from app.models.cliente import Cliente
from app.models.canje import Canje
from app.models.enums import EstadoEmpresa, EstadoCupon, TipoCondicionReto, EstadoMembresiaCliente

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
        for c in cupones_empresa:
            if c.exclusivo:
                if rel and rel.segmento == "exclusivo":
                    cupones_validos += 1
            else:
                cupones_validos += 1
                
        resultado.append({
            "id": str(emp.id),
            "nombre": emp.nombre,
            "rubro": emp.rubro,
            "logo_url": getattr(emp, "logo_url", None),
            "descripcion": getattr(emp, "descripcion", None),
            "direccion": getattr(emp, "direccion", None),
            "horario": getattr(emp, "horario", None),
            "instagram": getattr(emp, "instagram", None),
            "facebook": getattr(emp, "facebook", None),
            "tiktok": getattr(emp, "tiktok", None),
            "total_cupones_activos": cupones_validos,
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
        if c.exclusivo:
            if rel and rel.segmento == "exclusivo":
                cupones_validos.append(c.model_dump(mode='json'))
        else:
            cupones_validos.append(c.model_dump(mode='json'))
            
    retos = await Reto.find(
        Reto.empresa_id == empresa_id,
        Reto.fecha_inicio <= now,
        Reto.fecha_fin > now
    ).to_list()
    
    retos_response = []
    for r in retos:
        progreso = 0
        if rel:
            if r.condicion_tipo == TipoCondicionReto.num_visitas:
                progreso = min(rel.visitas_totales, r.condicion_valor)
            elif r.condicion_tipo == TipoCondicionReto.monto_acumulado:
                progreso = min(rel.monto_acumulado, r.condicion_valor)
        
        r_dict = r.model_dump(mode='json')
        r_dict["progreso_actual"] = progreso
        r_dict["porcentaje"] = (progreso / r.condicion_valor * 100) if r.condicion_valor > 0 else 0
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
            "descripcion": getattr(emp, "descripcion", None),
            "direccion": getattr(emp, "direccion", None),
            "horario": getattr(emp, "horario", None),
            "instagram": getattr(emp, "instagram", None),
            "facebook": getattr(emp, "facebook", None),
            "tiktok": getattr(emp, "tiktok", None)
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
    relacion_map = {r.empresa_id: r for r in relaciones}
    
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
        rel = relacion_map.get(c.empresa_id)
        
        if c.exclusivo and (not rel or rel.segmento != "exclusivo"):
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
        agrupados[emp_id]["cupones"].append(c.model_dump(mode='json'))
        
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
            "segmento": r.segmento
        })
        total_puntos += r.puntos
        if r.racha_maxima > racha_max:
            racha_max = r.racha_maxima
            
    total_canjes = await Canje.find(Canje.cliente_id == cliente_id).count()
    
    return {
        "cliente": {
            "nombre": cliente.nombre,
            "email": cliente.email,
            "whatsapp": getattr(cliente, "whatsapp", None)
        },
        "resumen": resumen,
        "total_canjes": total_canjes,
        "total_empresas": len(resumen),
        "total_puntos_global": total_puntos,
        "racha_maxima_global": racha_max
    }
