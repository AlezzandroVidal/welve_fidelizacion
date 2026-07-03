import { Award, Flame, Store, Ticket } from "lucide-react";

interface Props {
  totalCanjes: number;
  totalEmpresas: number;
  totalPuntos: number;
  rachaMaxima: number;
}

export default function PerfilStats({ totalCanjes, totalEmpresas, totalPuntos, rachaMaxima }: Props) {
  const items = [
    { label: "Canjes", value: totalCanjes, icon: Ticket, bg: "bg-blue-50", fg: "text-blue-500" },
    { label: "Lugares", value: totalEmpresas, icon: Store, bg: "bg-orange-50", fg: "text-orange-500" },
    { label: "Puntos", value: totalPuntos, icon: Award, bg: "bg-yellow-50", fg: "text-yellow-600" },
    { label: "Racha Max", value: rachaMaxima, icon: Flame, bg: "bg-rose-50", fg: "text-rose-500" },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3">
      {items.map(({ label, value, icon: Icon, bg, fg }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg} ${fg}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
            <p className="text-lg font-black text-gray-800">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
