import CuponCardMini from '../CuponCardMini';
import type { CuponResumen } from '../../../api/wallet';

interface Props {
  cupones: CuponResumen[];
  empresaNombre: string;
}

export default function RelacionadosSection({ cupones, empresaNombre }: Props) {
  if (cupones.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-gray-900">Más de {empresaNombre}</h2>
      <div className="space-y-3">
        {cupones.map((c) => (
          <CuponCardMini key={c.id} cupon={c} empresaNombre={empresaNombre} />
        ))}
      </div>
    </div>
  );
}
