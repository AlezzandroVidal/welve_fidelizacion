function calcularDigitoControlEAN13(digitos12: string): string {
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digitos12[i]);
    suma += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (suma % 10)) % 10);
}

export function generarEAN13(): string {
  let digitos = "";
  for (let i = 0; i < 12; i++) digitos += Math.floor(Math.random() * 10);
  return digitos + calcularDigitoControlEAN13(digitos);
}

/** Anchos de barra deterministas a partir del código, solo para el preview
 * visual del modal — no es un código de barras real ni escaneable (evita
 * depender de una librería como JsBarcode que no está instalada). */
export function barrasVisuales(codigo: string): number[] {
  const barras: number[] = [];
  for (let i = 0; i < codigo.length; i++) {
    barras.push((codigo.charCodeAt(i) % 4) + 1);
  }
  return barras;
}
