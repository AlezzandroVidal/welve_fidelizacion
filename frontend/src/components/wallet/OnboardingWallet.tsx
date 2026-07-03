import { useState } from "react";
import { Compass, Gift, QrCode } from "lucide-react";
import { StoryModal, type StoryScreen } from "../ui";

const STORAGE_KEY = "welve_onboarding_wallet_done";

const SCREENS: StoryScreen[] = [
  {
    icon: Compass, iconColor: "text-welve-500", floatClass: "animate-float-1",
    title: "Descubre beneficios cerca de ti",
    text: "Explora empresas locales y sus cupones exclusivos.",
  },
  {
    icon: Gift, iconColor: "text-pink-500", floatClass: "animate-float-2",
    title: "Acumula y desbloquea",
    text: "Visita tus lugares favoritos, completa retos y gana cupones gratis.",
  },
  {
    icon: QrCode, iconColor: "text-gray-700", floatClass: "animate-float-3",
    title: "Canjea con tu código QR",
    text: "Muestra tu código al staff para aplicar tus descuentos.",
  },
];

export function onboardingWalletCompletado(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export default function OnboardingWallet({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(true);

  function cerrar() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onDone();
  }

  return (
    <StoryModal
      open={open}
      screens={SCREENS}
      onClose={cerrar}
      renderFooter={(index, goNext) => {
        const esUltima = index === SCREENS.length - 1;
        return (
          <button
            onClick={esUltima ? cerrar : goNext}
            className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
          >
            {esUltima ? "¡Explorar ahora!" : "Siguiente →"}
          </button>
        );
      }}
    />
  );
}
