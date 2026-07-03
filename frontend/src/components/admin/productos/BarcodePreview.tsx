import { barrasVisuales } from "../../../utils/barcode";

export default function BarcodePreview({ codigo }: { codigo: string }) {
  if (!codigo) return null;
  const barras = barrasVisuales(codigo);

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex h-14 items-end gap-[2px]">
        {barras.map((w, i) => (
          <div key={i} className="bg-gray-900" style={{ width: `${w}px`, height: "100%" }} />
        ))}
      </div>
      <p className="font-mono text-xs tracking-widest text-gray-600">{codigo}</p>
    </div>
  );
}
