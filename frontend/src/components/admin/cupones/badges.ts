import type { TipoCupon, EstadoCupon } from "../../../api/cupones";

export const TIPO_LABEL: Record<TipoCupon, string> = {
  descuento_porcentual: "% Descuento",
  descuento_fijo:       "S/ Fijo",
  producto_gratis:      "Gratis",
  dos_por_uno:          "2×1",
};

export const TIPO_COLOR: Record<TipoCupon, string> = {
  descuento_porcentual: "bg-blue-100 text-blue-700",
  descuento_fijo:       "bg-green-100 text-green-700",
  producto_gratis:      "bg-welve-100 text-welve-700",
  dos_por_uno:          "bg-orange-100 text-orange-700",
};

export const ESTADO_LABEL: Record<EstadoCupon, string> = {
  activo:   "Activo",
  pausado:  "Pausado",
  expirado: "Expirado",
};

export const ESTADO_COLOR: Record<EstadoCupon, string> = {
  activo:   "bg-green-100 text-green-700",
  pausado:  "bg-yellow-100 text-yellow-700",
  expirado: "bg-gray-100 text-gray-500",
};
