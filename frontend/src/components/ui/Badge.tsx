import { ReactNode } from "react";

export type BadgeColor = "purple" | "green" | "blue" | "orange" | "gray" | "red" | "yellow";
export type BadgeSize  = "sm" | "md";

interface BadgeProps {
  color?:    BadgeColor;
  size?:     BadgeSize;
  dot?:      boolean;
  children:  ReactNode;
  className?: string;
}

const COLORS: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  purple: { bg: "bg-welve-100",  text: "text-welve-700",  dot: "bg-welve-500"  },
  green:  { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  blue:   { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  gray:   { bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
  red:    { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2   py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1   text-xs     gap-1.5",
};

export function Badge({
  color = "gray",
  size  = "md",
  dot   = false,
  children,
  className = "",
}: BadgeProps) {
  const c = COLORS[color];
  return (
    <span
      className={[
        "inline-flex items-center font-semibold rounded-full",
        c.bg, c.text,
        SIZES[size],
        className,
      ].join(" ")}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      )}
      {children}
    </span>
  );
}
