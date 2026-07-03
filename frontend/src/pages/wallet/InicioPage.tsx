import { useState } from 'react';
import { Search, Coffee, Sparkles, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { useEmpresasWallet, usePerfil, useCuponesDestacados } from '../../hooks/useWallet';
import HeroBuscador from '../../components/wallet/inicio/HeroBuscador';
import CuponCardDestacada from '../../components/wallet/inicio/CuponCardDestacada';
import EmpresaCard from '../../components/wallet/inicio/EmpresaCard';
import TusEmpresasList from '../../components/wallet/inicio/TusEmpresasList';
import CuponesPorCategoria from '../../components/wallet/inicio/CuponesPorCategoria';
import TusRetosSection from '../../components/wallet/inicio/TusRetosSection';
import ProximosBeneficiosSection from '../../components/wallet/inicio/ProximosBeneficiosSection';
import OnboardingWallet, { onboardingWalletCompletado } from '../../components/wallet/OnboardingWallet';

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', icon: Search },
  { id: 'food_beverage', label: 'Cafeterías', icon: Coffee },
  { id: 'belleza', label: 'Belleza', icon: Sparkles },
  { id: 'retail', label: 'Retail', icon: ShoppingBag },
  { id: 'otro', label: 'Otros', icon: MoreHorizontal },
];

export default function InicioPage() {
  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [showOnboarding, setShowOnboarding] = useState(() => !onboardingWalletCompletado());

  const { data: empresasData, isLoading } = useEmpresasWallet();
  const { data: perfilData } = usePerfil();
  const { data: cuponesDestacadosData } = useCuponesDestacados();
  const nombreCliente = perfilData?.cliente?.nombre?.split(' ')[0];

  const empresas = empresasData || [];
  const cuponesDestacadosGlobal = cuponesDestacadosData || [];

  const empresasFiltradas = empresas.filter((emp: any) => {
    const matchSearch = emp.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = categoriaActiva === 'todos' || emp.rubro === categoriaActiva;
    return matchSearch && matchCategoria;
  });

  const tusEmpresas = empresas.filter((e: any) => e.mi_relacion);
  const empresasConDestacado = empresas.filter((e: any) => e.cupon_destacado);
  const sinFiltrosActivos = search === '' && categoriaActiva === 'todos';

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando...</div>;
  }

  return (
    <div className="pb-8">
      <HeroBuscador
        nombreCliente={nombreCliente}
        totalEmpresas={perfilData?.total_empresas || 0}
        totalCupones={empresas.reduce((acc: number, e: any) => acc + (e.total_cupones_activos || 0), 0)}
        totalPuntos={perfilData?.total_puntos_global || 0}
        search={search}
        onSearchChange={setSearch}
        empresas={empresas}
        cuponesDestacados={cuponesDestacadosGlobal}
      />

      <div className="mt-12 px-4 sm:px-6">
        {/* FILTROS */}
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide sm:-mx-6 sm:px-6">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  isActive
                    ? 'bg-welve-600 text-white shadow-md shadow-welve-600/30'
                    : 'border border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {empresasConDestacado.length > 0 && sinFiltrosActivos && (
          <div className="mt-6 mb-8">
            <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">✨ Destacados para ti</h2>
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
              {empresasConDestacado.map((emp: any) => (
                <CuponCardDestacada key={emp.id} empresa={emp} />
              ))}
            </div>
          </div>
        )}

        {sinFiltrosActivos && <TusEmpresasList empresas={tusEmpresas} />}
        {sinFiltrosActivos && <TusRetosSection />}
        {sinFiltrosActivos && <ProximosBeneficiosSection />}

        <div className="mt-8">
          <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">Empresas cerca de ti</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {empresasFiltradas.map((emp: any) => (
              <EmpresaCard key={emp.id} empresa={emp} />
            ))}

            {empresasFiltradas.length === 0 && (
              <div className="col-span-2 py-10 text-center md:col-span-3">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Search className="text-gray-400" size={24} />
                </div>
                <p className="font-medium text-gray-500">No se encontraron empresas</p>
              </div>
            )}
          </div>
        </div>

        {sinFiltrosActivos && <CuponesPorCategoria cupones={cuponesDestacadosGlobal} />}
      </div>

      {showOnboarding && <OnboardingWallet onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}
