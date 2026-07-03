const STORAGE_KEY = "welve_categorias_extra";

/** Categorías "vacías" que el admin quiere tener disponibles antes de que
 * algún producto las use — Producto.categoria es un texto libre, no hay
 * una colección de Categoria en el backend, así que esto es solo una
 * lista de sugerencias persistida en el navegador. */
export function getCategoriasExtra(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function agregarCategoriaExtra(nombre: string): string[] {
  const limpio = nombre.trim();
  if (!limpio) return getCategoriasExtra();
  const actuales = getCategoriasExtra();
  if (actuales.includes(limpio)) return actuales;
  const nuevas = [...actuales, limpio];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
  return nuevas;
}
