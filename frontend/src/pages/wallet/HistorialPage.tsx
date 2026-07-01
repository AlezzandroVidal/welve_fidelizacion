import { useHistorial } from '../../hooks/useWallet';
import { QrCode, Link2, UserCheck, Clock, Sparkles } from 'lucide-react';

export default function HistorialPage() {
  const { data, isLoading } = useHistorial(1);
  // Implement infinite scroll in a real app, here we just show page 1 for simplicity

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando historial...</div>;
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Clock size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No hay actividad aún</h2>
        <p className="text-gray-500">Tus canjes de cupones aparecerán aquí.</p>
      </div>
    );
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  };

  // Agrupar por fecha
  const groups: Record<string, any[]> = {};
  items.forEach((item: any) => {
    const date = new Date(item.fecha);
    let key = '';
    if (isToday(date)) key = 'Hoy';
    else if (isYesterday(date)) key = 'Ayer';
    else key = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const getCanalIcon = (canal: string) => {
    switch(canal) {
      case 'qr': return <QrCode size={14} className="text-purple-600" />;
      case 'link': return <Link2 size={14} className="text-blue-600" />;
      case 'automatico': return <Sparkles size={14} className="text-green-600" />;
      default: return <UserCheck size={14} className="text-emerald-600" />;
    }
  };

  const getCanalColor = (canal: string) => {
    switch(canal) {
      case 'qr': return 'bg-purple-100';
      case 'link': return 'bg-blue-100';
      case 'automatico': return 'bg-green-100';
      default: return 'bg-emerald-100';
    }
  };

  return (
    <div className="p-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historial</h1>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {Object.entries(groups).map(([groupName, groupItems]) => (
          <div key={groupName} className="relative">
            <div className="sticky top-14 z-10 bg-welve-100/90 backdrop-blur-sm py-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider capitalize-first ml-12">
                {groupName}
              </h3>
            </div>
            
            <div className="space-y-6 mt-4">
              {groupItems.map((item: any) => (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-welve-100 bg-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCanalColor(item.canal)}`}>
                      {getCanalIcon(item.canal)}
                    </div>
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ml-4 md:ml-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-welve-600">{item.empresa_nombre}</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(item.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{item.cupon_nombre}</p>
                    <p className="text-[11px] text-gray-500 mt-2 capitalize flex items-center gap-1">
                      Canje vía {item.canal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
