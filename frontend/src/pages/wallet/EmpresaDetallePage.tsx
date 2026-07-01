import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmpresaDetalle } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import QRDisplay from '../../components/admin/QRDisplay';
import EmpresaMapView from '../../components/maps/EmpresaMapView';
import ResenasSection from '../../components/wallet/ResenasSection';
import { Clock, MapPin, Flame, Ticket, X, QrCode, Video } from 'lucide-react';

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useEmpresaDetalle(id || '');
  const [activeTab, setActiveTab] = useState<'todos' | 'exclusivos'>('todos');
  const [selectedCupon, setSelectedCupon] = useState<any | null>(null);

  if (isLoading || !data) {
    return <div className="p-6 text-center animate-pulse">Cargando empresa...</div>;
  }

  const { empresa, cupones, mi_relacion, retos_activos, membresias_disponibles, mi_membresia } = data;

  const cuponesTodos = cupones.filter((c: any) => !c.exclusivo);
  const cuponesExclusivos = cupones.filter((c: any) => c.exclusivo);

  const getGradientForRubro = (rubro: string) => {
    switch (rubro) {
      case 'food_beverage': return 'from-orange-400 to-yellow-400';
      case 'belleza': return 'from-pink-400 to-purple-500';
      case 'retail': return 'from-blue-400 to-emerald-400';
      default: return 'from-gray-400 to-slate-600';
    }
  };

  const getCuponColor = (tipo: string) => {
    switch(tipo) {
      case 'descuento_porcentual': return 'from-blue-500 to-indigo-600';
      case 'descuento_fijo': return 'from-emerald-400 to-teal-500';
      case 'producto_gratis': return 'from-orange-400 to-rose-500';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="pb-10 relative bg-welve-100 min-h-screen">
      {/* HERO COVER */}
      <div className={`h-[200px] w-full bg-gradient-to-br ${getGradientForRubro(empresa.rubro)} rounded-b-[40px] shadow-sm relative`}>
        {/* Mock image for now */}
        {empresa.logo_url && (
           <div className="absolute inset-0 bg-black/20 rounded-b-[40px]">
             <img src={empresa.logo_url} className="w-full h-full object-cover rounded-b-[40px] mix-blend-overlay opacity-50" alt="cover" />
           </div>
        )}
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg shadow-welve-900/10 mb-3">
            {empresa.logo_url ? (
              <img src={empresa.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${getGradientForRubro(empresa.rubro)} flex items-center justify-center text-white text-3xl font-bold`}>
                {empresa.nombre.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center leading-tight mb-1">{empresa.nombre}</h1>
          <span className="text-[10px] font-semibold text-welve-600 bg-welve-100 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            {empresa.rubro.replace('_', ' ')}
          </span>
          
          {/* Redes y contacto */}
          <div className="flex items-center gap-4 mb-6">
            {empresa.instagram && <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-pink-600 hover:scale-110 transition-transform"><Video size={18} /></a>}
            {empresa.facebook && <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 hover:scale-110 transition-transform"><Video size={18} /></a>}
            {empresa.tiktok && <a href="#" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-black hover:scale-110 transition-transform"><Video size={16} /></a>}
          </div>

          {/* Las visitas y canjes los registra el staff del local — el cliente solo muestra su código */}
          <button
            onClick={() => id && navigate(`/wallet/empresa/${id}/mi-qr`)}
            className="mb-6 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-gray-900/20 transition-transform active:scale-95"
          >
            <QrCode size={16} />
            Mostrar mi código
          </button>
        </div>

        {/* Info basica */}
        {(empresa.horario || empresa.direccion) && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
            {empresa.direccion && (
              <div className="flex items-start gap-3">
                <MapPin className="text-welve-500 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-gray-600">{empresa.direccion}</p>
              </div>
            )}
            {empresa.horario && (
              <div className="flex items-start gap-3">
                <Clock className="text-welve-500 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-gray-600">{empresa.horario}</p>
              </div>
            )}
          </div>
        )}

        {empresa.latitud != null && empresa.longitud != null && (
          <div className="mb-6">
            <EmpresaMapView lat={empresa.latitud} lng={empresa.longitud} nombre={empresa.nombre} />
          </div>
        )}

        {/* MI PROGRESO */}
        {mi_relacion && (
          <div className="bg-gradient-to-br from-welve-50 to-welve-100 rounded-3xl p-5 shadow-sm border border-welve-100 mb-6 relative overflow-hidden">
            {mi_relacion.segmento === 'exclusivo' && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-4 py-1 rounded-bl-xl shadow-sm">
                ⭐ Eres cliente VIP
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Flame className="text-orange-500" size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 leading-none mb-1">Tu racha</h3>
                <p className="text-sm text-gray-500">{mi_relacion.racha_actual} semanas seguidas</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-xl p-3 border border-white">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Visitas Totales</p>
                <p className="text-lg font-black text-gray-900">{mi_relacion.visitas_totales}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 border border-white">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Puntos</p>
                <p className="text-lg font-black text-gray-900">{mi_relacion.puntos}</p>
              </div>
            </div>
          </div>
        )}

        {/* RETOS */}
        {retos_activos && retos_activos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Desafíos activos</h2>
            <div className="space-y-4">
              {retos_activos.map((reto: any) => (
                <div key={reto._id || reto.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{reto.nombre}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        Meta: {reto.condicion_valor} {reto.condicion_tipo === 'num_visitas' ? 'visitas' : 'soles'}
                      </p>
                    </div>
                    {reto.recompensa_cupon_id && (
                      <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">
                        Premio listo
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                    <div 
                      className="bg-welve-500 h-3 rounded-full transition-all duration-1000 relative overflow-hidden" 
                      style={{ width: `${Math.min(reto.porcentaje, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>{reto.progreso_actual}</span>
                    <span>{reto.condicion_valor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUPONES DISPONIBLES */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-1 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Tus beneficios</h2>
            <span className="bg-welve-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cupones.length}</span>
          </div>

          {cuponesExclusivos.length > 0 && (
            <div className="flex gap-2 p-1 bg-white rounded-full mb-4 shadow-sm">
              <button
                onClick={() => setActiveTab('todos')}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${activeTab === 'todos' ? 'bg-welve-100 text-welve-700' : 'text-gray-500'}`}
              >
                Para todos
              </button>
              <button
                onClick={() => setActiveTab('exclusivos')}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors flex items-center justify-center gap-1 ${activeTab === 'exclusivos' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500'}`}
              >
                ⭐ Solo para ti
              </button>
            </div>
          )}

          <div className="space-y-4">
            {(activeTab === 'todos' ? cuponesTodos : cuponesExclusivos).map((cupon: any) => (
              <div key={cupon._id || cupon.id} className={`bg-white rounded-3xl overflow-hidden shadow-sm border ${cupon.exclusivo ? 'border-yellow-300' : 'border-gray-100'}`}>
                {/* Visual del ticket */}
                <div className={`p-6 relative bg-gradient-to-br ${getCuponColor(cupon.tipo)} text-white`}>
                  <div className="absolute -bottom-4 left-6 right-6 h-8 bg-white/20 rounded-full blur-md" />
                  
                  {cupon.exclusivo && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-md">
                      ⭐ VIP
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black leading-none tracking-tighter">
                      {cupon.tipo === 'descuento_porcentual' ? `${cupon.valor}%` :
                       cupon.tipo === 'descuento_fijo' ? `S/${cupon.valor}` :
                       cupon.tipo === 'dos_por_uno' ? '2x1' : 'GRATIS'}
                    </span>
                    <span className="text-sm font-bold uppercase opacity-90 pb-1">
                      {cupon.tipo === 'descuento_porcentual' ? 'OFF' :
                       cupon.tipo === 'descuento_fijo' ? 'DSCTO' :
                       cupon.tipo === 'dos_por_uno' ? 'PROMO' : 'REGALO'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 opacity-95">{cupon.nombre}</h3>
                  {cupon.monto_minimo > 0 && (
                    <p className="text-xs bg-black/20 self-start inline-block px-2 py-1 rounded-md font-medium">
                      Min. compra S/{cupon.monto_minimo}
                    </p>
                  )}
                  
                  {/* Zig zag bottom border for ticket effect */}
                  <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%, 100% 100%, 0% 100%)' }}></div>
                </div>

                <div className="p-5 pt-6 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Válido hasta</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(cupon.fecha_expiracion).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedCupon(cupon)}
                    className="bg-gray-900 text-white font-bold py-2.5 px-5 rounded-full text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-md shadow-gray-900/20"
                  >
                    Ver código
                  </button>
                </div>
              </div>
            ))}
            
            {(activeTab === 'todos' ? cuponesTodos : cuponesExclusivos).length === 0 && (
              <div className="text-center py-8 bg-white rounded-3xl border border-gray-100 border-dashed">
                <Ticket className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 font-medium text-sm">No hay cupones en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {/* MEMBRESÍAS */}
        {membresias_disponibles && membresias_disponibles.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Club {empresa.nombre}</h2>
            {membresias_disponibles.map((m: any) => (
              <div key={m._id || m.id} className="bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                {/* Decoración */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-welve-500 rounded-full blur-3xl opacity-30" />
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2">{m.nombre}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{m.descripcion}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-black text-white">S/{m.precio_mensual}</span>
                    <span className="text-gray-500 text-sm font-medium mb-1">/ mes</span>
                  </div>
                  
                  {mi_membresia && mi_membresia.membresia_id === m.id ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                      <span>✓ Suscripción Activa</span>
                    </div>
                  ) : (
                    <button className="w-full bg-welve-500 hover:bg-welve-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-welve-500/30">
                      Unirme al Club
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {id && <ResenasSection empresaId={id} puedeCalificar={!!mi_relacion} />}
      </div>

      {/* MODAL DE CANJE */}
      {selectedCupon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedCupon(null)}
          />
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden relative z-10 animate-scale-in shadow-2xl">
            <button 
              onClick={() => setSelectedCupon(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 z-10"
            >
              <X size={18} />
            </button>
            
            <div className={`pt-10 pb-6 px-6 bg-gradient-to-br ${getCuponColor(selectedCupon.tipo)} text-white text-center rounded-b-[40px] shadow-sm`}>
              <h2 className="text-2xl font-black leading-tight mb-2">{selectedCupon.nombre}</h2>
              <p className="text-white/80 text-sm font-medium">Muestra este código al staff</p>
            </div>
            
            <div className="p-8 pb-10 flex flex-col items-center">
              <QRDisplay
                path={`/qr/cupon/${selectedCupon._id ?? selectedCupon.id}?cliente=${user?.id ?? ''}`}
                size="lg"
                className="mb-6"
              />

              <div className="text-center w-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Código de canje</p>
                <div className="bg-gray-100 py-3 rounded-2xl">
                  <p className="text-3xl font-mono font-black text-gray-800 tracking-[0.2em]">{selectedCupon._id?.substring(0, 6).toUpperCase() || selectedCupon.id?.substring(0, 6).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
