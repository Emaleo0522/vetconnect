"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Calificacion" : `${value} de ${max} estrellas`}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(displayValue);

        return (
          <button
            key={starValue}
            type="button"
            disabled={!interactive}
            tabIndex={interactive ? 0 : -1}
            className={cn(
              "transition-colors",
              interactive
                ? "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                : "cursor-default",
            )}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === "ArrowRight" && starValue < max) {
                onChange?.(starValue + 1);
              }
              if (e.key === "ArrowLeft" && starValue > 1) {
                onChange?.(starValue - 1);
              }
            }}
            aria-label={`${starValue} estrella${starValue > 1 ? "s" : ""}`}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? starValue === value : undefined}
          >
            <Star
              className={cn(
                SIZES[size],
                filled
                  ? "fill-[#F5A623] text-[#F5A623]"
                  : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
