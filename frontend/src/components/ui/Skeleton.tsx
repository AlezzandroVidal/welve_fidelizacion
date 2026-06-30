interface SkeletonProps {
  variant?:  "text" | "circle" | "rect" | "card";
  width?:    string | number;
  height?:   string | number;
  className?: string;
  lines?:    number;
}

const BASE = "relative overflow-hidden bg-gray-100 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export function Skeleton({
  variant   = "rect",
  width,
  height,
  className = "",
  lines,
}: SkeletonProps) {
  const style = {
    width:  width  !== undefined ? width  : undefined,
    height: height !== undefined ? height : undefined,
  };

  if (variant === "text" && lines && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${BASE} h-4 rounded-md`}
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  const shape: Record<string, string> = {
    text:   "h-4 rounded-md",
    circle: "rounded-full",
    rect:   "rounded-md",
    card:   "rounded-card h-32",
  };

  return (
    <div
      className={`${BASE} ${shape[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton variant="text" width={`${55 + (i % 3) * 20}%`} />
        </td>
      ))}
    </tr>
  );
}
