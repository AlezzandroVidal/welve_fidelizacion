import { Clock, MapPin, Phone, Globe } from 'lucide-react';
import EmpresaMapView from '../../maps/EmpresaMapView';

interface Props {
  empresa: any;
  membresiasDisponibles: any[];
  miMembresia: any;
}

export default function TabInfo({ empresa, membresiasDisponibles, miMembresia }: Props) {
  const tieneContacto = empresa.horario || empresa.direccion || empresa.telefono_contacto || empresa.sitio_web;

  return (
    <div className="space-y-4">
      {empresa.descripcion && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-gray-800">Sobre {empresa.nombre}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{empresa.descripcion}</p>
        </div>
      )}

      {tieneContacto && (
        <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          {empresa.direccion && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 shrink-0 text-welve-500" size={18} />
              <p className="text-sm text-gray-600">{empresa.direccion}</p>
            </div>
          )}
          {empresa.horario && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 shrink-0 text-welve-500" size={18} />
              <p className="text-sm text-gray-600">{empresa.horario}</p>
            </div>
          )}
          {empresa.telefono_contacto && (
            <a href={`tel:${empresa.telefono_contacto}`} className="-m-1 flex items-start gap-3 rounded-lg p-1 active:bg-gray-50">
              <Phone className="mt-0.5 shrink-0 text-welve-500" size={18} />
              <p className="text-sm text-gray-600">{empresa.telefono_contacto}</p>
            </a>
          )}
          {empresa.sitio_web && (
            <a href={empresa.sitio_web} target="_blank" rel="noreferrer" className="-m-1 flex items-start gap-3 rounded-lg p-1 active:bg-gray-50">
              <Globe className="mt-0.5 shrink-0 text-welve-500" size={18} />
              <p className="truncate text-sm text-gray-600">{empresa.sitio_web}</p>
            </a>
          )}
        </div>
      )}

      {empresa.latitud != null && empresa.longitud != null && (
        <EmpresaMapView lat={empresa.latitud} lng={empresa.longitud} nombre={empresa.nombre} />
      )}

      {membresiasDisponibles.length > 0 && (
        <div>
          <h2 className="mb-4 px-1 text-lg font-bold text-gray-900">Club {empresa.nombre}</h2>
          {membresiasDisponibles.map((m: any) => (
            <div key={m._id || m.id} className="relative overflow-hidden rounded-3xl bg-gray-900 p-6 shadow-xl">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-welve-500 opacity-30 blur-3xl" />
              <div className="relative z-10">
                <h3 className="mb-2 text-xl font-bold text-white">{m.nombre}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">{m.descripcion}</p>
                <div className="mb-6 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">S/{m.precio}</span>
                  <span className="mb-1 text-sm font-medium text-gray-500">/ mes</span>
                </div>
                {miMembresia && miMembresia.membresia_id === m.id ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 px-4 font-bold text-emerald-400">
                    <span>✓ Suscripción Activa</span>
                  </div>
                ) : (
                  <button className="w-full rounded-xl bg-welve-500 py-3 px-4 font-bold text-white shadow-lg shadow-welve-500/30 transition-colors hover:bg-welve-600">
                    Unirme al Club
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
