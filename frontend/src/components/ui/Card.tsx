import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children:   ReactNode;
  padding?:   "none" | "sm" | "md" | "lg";
  clickable?: boolean;
}

const PADDING = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

export function Card({
  children,
  padding   = "md",
  clickable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-card shadow-card",
        PADDING[padding],
        clickable && [
          "cursor-pointer",
          "@media (hover: hover) and (pointer: fine) hover:shadow-[0_4px_20px_rgba(124,92,252,0.12)]",
          "hover:-translate-y-px",
          "transition-all duration-150",
          "active:scale-[0.99]",
        ].join(" "),
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
