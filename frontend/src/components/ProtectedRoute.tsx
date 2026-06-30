import { Navigate } from "react-router-dom";
import type { Rol } from "../api/auth";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles: Rol[];
  redirectTo?: string;
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo = "/login" }: Props) {
  const { isAuthenticated, rol } = useAuth();

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (rol && !allowedRoles.includes(rol)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
