import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-welve-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-welve-500">
              <span className="text-sm font-black text-white">W</span>
            </div>
            <h1 className="text-xl font-bold text-welve-800">Dashboard</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-welve-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-gray-500 text-sm">
            Empresa ID: <span className="font-mono text-welve-600">{user?.id}</span>
          </p>
          <p className="mt-4 text-gray-400">Aquí irá el dashboard de métricas.</p>
        </div>
      </div>
    </div>
  );
}
