import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyPage from "./pages/auth/VerifyPage";
import DashboardPage from "./pages/admin/DashboardPage";
import CuponesPage from "./pages/admin/CuponesPage";
import ClientesPage from "./pages/admin/ClientesPage";
import CanjesPage from "./pages/admin/CanjesPage";
import RetosPage from "./pages/admin/RetosPage";
import MembresiasPage from "./pages/admin/MembresiasPage";
import ConfigPage from "./pages/admin/ConfigPage";
import QRPage from "./pages/admin/QRPage";
import StaffPage from "./pages/admin/StaffPage";
import ResenasPage from "./pages/admin/ResenasPage";
import QRVisitaPage from "./pages/qr/QRVisitaPage";
import QRCuponPage from "./pages/qr/QRCuponPage";
import WalletLayout from "./layouts/WalletLayout";
import InicioPage from "./pages/wallet/InicioPage";
import EmpresaDetallePage from "./pages/wallet/EmpresaDetallePage";
import MisCuponesPage from "./pages/wallet/MisCuponesPage";
import HistorialPage from "./pages/wallet/HistorialPage";
import PerfilPage from "./pages/wallet/PerfilPage";
import MiQRPage from "./pages/wallet/MiQRPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/verify" element={<VerifyPage />} />

            {/* Admin panel — empresa role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["empresa"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="cupones"   element={<CuponesPage />} />
              <Route path="clientes"  element={<ClientesPage />} />
              <Route path="canjes"    element={<CanjesPage />} />
              <Route path="retos"     element={<RetosPage />} />
              <Route path="membresias" element={<MembresiasPage />} />
              <Route path="config"    element={<ConfigPage />} />
              <Route path="qr"        element={<QRPage />} />
              <Route path="staff"     element={<StaffPage />} />
              <Route path="resenas"   element={<ResenasPage />} />
            </Route>

            {/* QR — pantallas fullscreen sin sidebar */}
            {/* QR de afiliación: pública, el cliente lo usa una sola vez para unirse */}
            <Route path="/qr/visita/:empresaId" element={<QRVisitaPage />} />
            <Route
              path="/qr/cupon/:cuponId"
              element={
                <ProtectedRoute allowedRoles={["empresa"]}>
                  <QRCuponPage />
                </ProtectedRoute>
              }
            />

            {/* Cliente wallet */}
            <Route
              path="/wallet"
              element={
                <ProtectedRoute allowedRoles={["cliente"]}>
                  <WalletLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InicioPage />} />
              <Route path="empresa/:id" element={<EmpresaDetallePage />} />
              <Route path="mis-cupones" element={<MisCuponesPage />} />
              <Route path="historial" element={<HistorialPage />} />
              <Route path="perfil" element={<PerfilPage />} />
            </Route>

            {/* Mi código — pantalla fullscreen sin sidebar, el cliente la muestra al staff */}
            <Route
              path="/wallet/empresa/:empresaId/mi-qr"
              element={
                <ProtectedRoute allowedRoles={["cliente"]}>
                  <MiQRPage />
                </ProtectedRoute>
              }
            />

            {/* Super admin */}
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "soporte"]}>
                  <div className="p-8">Super Admin (por implementar)</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
