export interface PillTabOption<T extends string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  options: PillTabOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

/**
 * Tabs con indicador deslizante via clip-path (extraído del LoginPage
 * original). N columnas, no solo 2 — Login usa hasta 3 (Empresa/Cliente/Admin).
 */
export default function PillTabs<T extends string>({ options, value, onChange }: PillTabsProps<T>) {
  const n = options.length;
  const idx = options.findIndex((o) => o.value === value);
  const pct = 100 / n;

  return (
    <div className="relative mb-6 rounded-xl bg-welve-50 p-1">
      <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-lg py-2 text-sm font-medium text-gray-500 transition-colors duration-200"
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden>
        <div
          className="rounded-lg bg-welve-500 shadow-sm transition-transform duration-200 ease-out"
          style={{ transform: `translateX(calc(${idx * 100}% + ${idx * 4}px))` }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-1 grid gap-1 overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          clipPath: `inset(0 ${100 - pct * (idx + 1)}% 0 ${pct * idx}% round 8px)`,
          transition: "clip-path 200ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {options.map((o) => (
          <span key={o.value} className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-white">
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );
}
