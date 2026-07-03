import { useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export interface StoryScreen {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  text: string;
  floatClass?: string;
}

interface StoryModalProps {
  open: boolean;
  screens: StoryScreen[];
  onClose: () => void;
  /** Footer por pantalla — botones primarios/secundarios, distintos en cada paso. */
  renderFooter: (index: number, goNext: () => void, goPrev: () => void) => ReactNode;
  /** Desde qué índice se muestran los dots (ej. 1 si la pantalla 0 es una bienvenida sin indicador). */
  dotsFrom?: number;
}

const SWIPE_THRESHOLD = 50;

export default function StoryModal({ open, screens, onClose, renderFooter, dotsFrom = 0 }: StoryModalProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!open) return null;

  const screen = screens[index];
  const Icon = screen.icon;
  const goNext = () => setIndex((i) => Math.min(i + 1, screens.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));
  const dots = screens.slice(dotsFrom);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(30,27,46,0.85)" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta > SWIPE_THRESHOLD) goPrev();
        else if (delta < -SWIPE_THRESHOLD) goNext();
        touchStartX.current = null;
      }}
    >
      <div className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] bg-white p-10 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Saltar tutorial"
        >
          <X size={18} />
        </button>

        <div key={index} className="animate-fade-up text-center">
          <div className="mx-auto mb-6 flex h-[180px] items-center justify-center">
            <Icon size={96} strokeWidth={1.25} className={`${screen.iconColor} ${screen.floatClass ?? "animate-float-1"}`} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">{screen.title}</h2>
          <p className="mx-auto mb-6 max-w-[340px] text-sm leading-relaxed text-gray-500">{screen.text}</p>
        </div>

        {dots.length > 1 && index >= dotsFrom && (
          <div className="mb-5 flex justify-center gap-1.5">
            {dots.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(dotsFrom + i)}
                aria-label={`Ir a pantalla ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  dotsFrom + i === index ? "w-5 bg-welve-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {renderFooter(index, goNext, goPrev)}
      </div>
    </div>
  );
}
