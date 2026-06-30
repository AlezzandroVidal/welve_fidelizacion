import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

type State = "verifying" | "success" | "error";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState<State>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);  // evita doble llamada en StrictMode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setErrorMsg("No se encontró el token en la URL.");
      return;
    }

    authApi.verificarMagicLink(token)
      .then((res) => {
        login(res.data.accessToken);
        setState("success");
        setTimeout(() => navigate("/wallet"), 1200);
      })
      .catch((e) => {
        setState("error");
        const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setErrorMsg(msg ?? "Token inválido o expirado.");
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-welve-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-welve-500 shadow-lg mb-4">
          <span className="text-2xl font-black text-white">W</span>
        </div>

        {state === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-welve-200 border-t-welve-500" />
            <p className="text-gray-600">Verificando tu acceso…</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mb-4 text-4xl">✓</div>
            <p className="font-semibold text-welve-700">¡Acceso verificado!</p>
            <p className="mt-1 text-sm text-gray-500">Redirigiendo…</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mb-4 text-4xl">✗</div>
            <p className="font-semibold text-red-600">Link inválido o expirado</p>
            <p className="mt-1 text-sm text-gray-500">{errorMsg}</p>
            <a
              href="/login"
              className="mt-4 inline-block rounded-xl bg-welve-500 px-6 py-2.5 text-sm font-semibold text-white
                hover:bg-welve-600 active:scale-[0.97] transition-all"
            >
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  );
}
