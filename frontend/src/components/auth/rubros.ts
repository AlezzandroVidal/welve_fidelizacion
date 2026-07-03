import { Coffee, Scissors, ShoppingBag, Dumbbell, GraduationCap, HeartPulse, Gamepad2, Package, type LucideIcon } from "lucide-react";

export const RUBROS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "food_beverage",   label: "Cafetería / Restaurante",    icon: Coffee },
  { value: "belleza",         label: "Belleza y cuidado personal", icon: Scissors },
  { value: "retail",          label: "Retail / Tienda",            icon: ShoppingBag },
  { value: "fitness",         label: "Fitness / Bienestar",        icon: Dumbbell },
  { value: "educacion",       label: "Educación",                  icon: GraduationCap },
  { value: "salud",           label: "Salud",                      icon: HeartPulse },
  { value: "entretenimiento", label: "Entretenimiento",            icon: Gamepad2 },
  { value: "otro",            label: "Otro",                       icon: Package },
];
