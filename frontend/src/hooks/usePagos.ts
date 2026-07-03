import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pagosApi, IniciarPagoDto } from "../api/pagos";

export function useHistorialPagos() {
  return useQuery({
    queryKey: ["pagos", "historial"],
    queryFn: () => pagosApi.historial().then((r) => r.data),
  });
}

export function useIniciarPago() {
  return useMutation({
    mutationFn: (data: IniciarPagoDto) => pagosApi.iniciar(data).then((r) => r.data),
  });
}

export function useConfirmarPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pagoId: string) => pagosApi.confirmar(pagoId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagos", "historial"] });
      qc.invalidateQueries({ queryKey: ["empresa", "me"] });
    },
  });
}

export interface PlanInfo {
  id: "starter" | "growth" | "pro";
  nombre: string;
  precio: number;
  features: string[];
}

const PLANES: PlanInfo[] = [
  {
    id: "starter",
    nombre: "Starter",
    precio: 49,
    features: [
      "Hasta 100 clientes",
      "Hasta 5 cupones activos",
      "2 retos simultáneos",
      "Dashboard básico",
      "Soporte por email",
    ],
  },
  {
    id: "growth",
    nombre: "Growth",
    precio: 99,
    features: [
      "Hasta 500 clientes",
      "Cupones ilimitados",
      "Retos ilimitados",
      "Dashboard avanzado + métricas",
      "Membresías",
      "Soporte prioritario",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: 199,
    features: [
      "Clientes ilimitados",
      "Todo de Growth +",
      "API access",
      "Multi-sucursal (próximamente)",
      "Gerente de cuenta dedicado",
    ],
  },
];

export function usePlanesInfo(): PlanInfo[] {
  return PLANES;
}
