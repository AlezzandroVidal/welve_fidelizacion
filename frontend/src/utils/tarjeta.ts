export type MarcaTarjeta = "visa" | "mastercard" | "desconocida";

/** Visa empieza con 4, Mastercard con 5 — el resto no se soporta en esta simulación. */
export function detectarMarca(numero: string): MarcaTarjeta {
  const limpio = numero.replace(/\D/g, "");
  if (limpio.startsWith("4")) return "visa";
  if (limpio.startsWith("5")) return "mastercard";
  return "desconocida";
}

export function formatearNumeroTarjeta(valor: string): string {
  const limpio = valor.replace(/\D/g, "").slice(0, 16);
  return (limpio.match(/.{1,4}/g) ?? []).join(" ");
}

export function numeroTarjetaValido(valor: string): boolean {
  return valor.replace(/\D/g, "").length === 16;
}

export function ultimos4Digitos(valor: string): string {
  return valor.replace(/\D/g, "").slice(-4);
}

export function formatearVencimiento(valor: string): string {
  const limpio = valor.replace(/\D/g, "").slice(0, 4);
  if (limpio.length <= 2) return limpio;
  return `${limpio.slice(0, 2)}/${limpio.slice(2)}`;
}

export function vencimientoValido(valor: string): boolean {
  const limpio = valor.replace(/\D/g, "");
  if (limpio.length !== 4) return false;
  const mes = Number(limpio.slice(0, 2));
  const anio = 2000 + Number(limpio.slice(2));
  if (mes < 1 || mes > 12) return false;
  const finDeMes = new Date(anio, mes, 0, 23, 59, 59);
  return finDeMes.getTime() >= Date.now();
}

export function cvvValido(valor: string): boolean {
  return /^\d{3,4}$/.test(valor);
}
