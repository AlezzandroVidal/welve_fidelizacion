import { ChevronDown, FileText } from 'lucide-react';

export default function TerminosAccordion({ terminos }: { terminos: string }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <FileText size={16} className="text-welve-500" />
          Términos y condiciones
        </span>
        <ChevronDown size={18} className="text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-gray-600">{terminos}</p>
    </details>
  );
}
