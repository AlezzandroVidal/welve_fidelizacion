import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { type Rol, type TokenPayload, parseJwt } from "../api/auth";

interface User {
  id: string;
  rol: Rol;
  email?: string;
  empresaId?: string;
}

interface AuthCtx {
  user: User | null;
  isAuthenticated: boolean;
  rol: Rol | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

function userFromPayload(p: TokenPayload): User {
  return {
    id: p.sub,
    rol: p.rol,
    email: p.email,
    empresaId: p.empresa_id,
  };
}

function loadFromStorage(): User | null {
  const token = localStorage.getItem("welve_token");
  if (!token) return null;
  const p = parseJwt(token);
  if (!p) return null;
  if (p.exp * 1000 < Date.now()) {
    localStorage.removeItem("welve_token");
    return null;
  }
  return userFromPayload(p);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadFromStorage);

  const login = useCallback((token: string) => {
    const p = parseJwt(token);
    if (!p) return;
    localStorage.setItem("welve_token", token);
    setUser(userFromPayload(p));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("welve_token");
    setUser(null);
  }, []);

  const ctx = useMemo(
    () => ({ user, isAuthenticated: !!user, rol: user?.rol ?? null, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
