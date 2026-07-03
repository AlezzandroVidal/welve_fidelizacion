import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper, Ticket, Trophy, ShoppingCart, QrCode, Rocket } from "lucide-react";
import { StoryModal, type StoryScreen } from "../ui";

const STORAGE_KEY = "welve_onboarding_done";

function buildScreens(empresaNombre: string): StoryScreen[] {
  return [
    {
      icon: PartyPopper, iconColor: "text-welve-500", floatClass: "animate-float-1",
      title: `¡Bienvenido a Welve, ${empresaNombre}! 🎉`,
      text: "En 2 minutos conocerás todo lo que puedes hacer.",
    },
    {
      icon: Ticket, iconColor: "text-blue-500", floatClass: "animate-float-2",
      title: "Crea tus cupones y beneficios",
      text: "Diseña descuentos, promociones 2x1, productos gratis y más. Tus clientes los verán en su celular automáticamente.",
    },
    {
      icon: Trophy, iconColor: "text-amber-500", floatClass: "animate-float-3",
      title: "Motiva con retos y misiones",
      text: "Crea desafíos: \"Visita 5 veces y gana un café gratis\". El cliente ve su progreso en tiempo real.",
    },
    {
      icon: ShoppingCart, iconColor: "text-emerald-500", floatClass: "animate-float-1",
      title: "Tu caja conectada a la fidelización",
      text: "Registra ventas, aplica cupones automáticamente y controla tu inventario desde un solo lugar.",
    },
    {
      icon: QrCode, iconColor: "text-gray-700", floatClass: "animate-float-2",
      title: "Tus clientes entran con un QR",
      text: "Imprime tu QR en la caja o compártelo en redes. El cliente escanea, se registra y empieza a ganar beneficios.",
    },
    {
      icon: Rocket, iconColor: "text-pink-500", floatClass: "animate-float-3",
      title: "¡Todo listo para empezar! 🚀",
      text: "Tu primer paso: crea tu primer cupón.",
    },
  ];
}

export function onboardingCompletado(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

interface Props {
  empresaNombre: string;
  onDone: () => void;
}

export default function OnboardingTutorial({ empresaNombre, onDone }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const screens = buildScreens(empresaNombre || "tu negocio");

  function cerrar() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onDone();
  }

  return (
    <StoryModal
      open={open}
      screens={screens}
      onClose={cerrar}
      dotsFrom={1}
      renderFooter={(index, goNext) => {
        const esUltima = index === screens.length - 1;
        if (index === 0) {
          return (
            <button
              onClick={goNext}
              className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
            >
              Empezar →
            </button>
          );
        }
        if (esUltima) {
          return (
            <div className="space-y-3">
              <button
                onClick={() => { cerrar(); navigate("/admin/cupones"); }}
                className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
              >
                Crear mi primer cupón
              </button>
              <button onClick={cerrar} className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600">
                Explorar el dashboard
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <button
              onClick={goNext}
              className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
            >
              Siguiente →
            </button>
            <button onClick={cerrar} className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600">
              Saltar tutorial
            </button>
          </div>
        );
      }}
    />
  );
}
