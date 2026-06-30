import { useAuth } from "../../context/AuthContext";

export default function WalletPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-welve-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-welve-800">Mi Wallet</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-welve-600 transition-colors"
          >
            Salir
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="text-gray-500 text-sm">
            Cliente ID: <span className="font-mono text-welve-600">{user?.id}</span>
          </p>
          <p className="mt-4 text-gray-400">Aquí aparecerán tus cupones y recompensas.</p>
        </div>
      </div>
    </div>
  );
}
