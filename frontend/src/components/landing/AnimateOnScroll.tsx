import type { ReactNode } from "react";
import { useInView } from "../../hooks/useInView";

interface Props {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

/** fade-in + slide-up al entrar en viewport (sin librería de animación, solo
 * IntersectionObserver + transición CSS) — usado en toda la landing. */
export default function AnimateOnScroll({ children, className = "", delayMs = 0 }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`animate-on-scroll transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: inView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
