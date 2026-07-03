import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  current: number; // 0-indexed
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="mb-6 flex items-center">
      {steps.map((label, i) => (
        <div key={label} className={i < steps.length - 1 ? "flex flex-1 items-center" : "flex items-center"}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200",
                i < current
                  ? "bg-welve-500 text-white"
                  : i === current
                  ? "bg-welve-500 text-white ring-4 ring-welve-100"
                  : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium ${i <= current ? "text-welve-700" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${i < current ? "bg-welve-500" : "bg-gray-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
