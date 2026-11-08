"use client";

import { cn } from "@/lib/utils";
import { ShieldCheck, Sparkles } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number; // 0 to 100
  variant?: "ring" | "badge" | "compact";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  score,
  variant = "ring",
  size = "md",
  showLabel = true,
  className,
}: ConfidenceBadgeProps) {
  // Clamped score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color theme based on score
  const isHigh = clampedScore >= 90;
  const isMed = clampedScore >= 80 && clampedScore < 90;

  const colorConfig = isHigh
    ? {
        text: "text-green-400",
        stroke: "#34d399",
        bgFill: "fill-green-500/10",
        border: "border-green-500/30",
        badgeBg: "bg-green-500/10",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.25)]",
        label: "Very High Certainty",
        badgeText: "text-green-300",
      }
    : isMed
    ? {
        text: "text-gold-400",
        stroke: "#fbbf24",
        bgFill: "fill-gold-500/10",
        border: "border-gold-500/30",
        badgeBg: "bg-gold-500/10",
        glow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]",
        label: "High Confidence",
        badgeText: "text-gold-300",
      }
    : {
        text: "text-blue-400",
        stroke: "#60a5fa",
        bgFill: "fill-blue-500/10",
        border: "border-blue-500/30",
        badgeBg: "bg-blue-500/10",
        glow: "shadow-none",
        label: "Moderate Edge",
        badgeText: "text-blue-300",
      };

  if (variant === "compact" || variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide border min-h-[28px]",
          colorConfig.badgeBg,
          colorConfig.border,
          colorConfig.badgeText,
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-heading font-bold">{clampedScore}%</span>
        {variant === "badge" && (
          <span className="hidden sm:inline font-normal text-slate-400">
            Certainty
          </span>
        )}
      </div>
    );
  }

  // Ring variant (circular progress)
  const dimensions =
    size === "lg"
      ? { radius: 46, strokeWidth: 7, sizePx: 116 }
      : size === "sm"
      ? { radius: 26, strokeWidth: 4, sizePx: 64 }
      : { radius: 38, strokeWidth: 6, sizePx: 96 };

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset =
    circumference - (clampedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-smooth",
          colorConfig.glow
        )}
        style={{ width: dimensions.sizePx, height: dimensions.sizePx }}
      >
        <svg
          className="-rotate-90 transform"
          width={dimensions.sizePx}
          height={dimensions.sizePx}
        >
          {/* Background Track */}
          <circle
            cx={dimensions.sizePx / 2}
            cy={dimensions.sizePx / 2}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Animated Progress Arc */}
          <circle
            cx={dimensions.sizePx / 2}
            cy={dimensions.sizePx / 2}
            r={dimensions.radius}
            stroke={colorConfig.stroke}
            strokeWidth={dimensions.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={cn(
              "font-heading font-extrabold tracking-tight",
              colorConfig.text,
              size === "lg"
                ? "text-2xl sm:text-3xl"
                : size === "sm"
                ? "text-sm"
                : "text-xl sm:text-2xl"
            )}
          >
            {clampedScore}%
          </span>
          {size !== "sm" && (
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
              Score
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <div className="flex items-center gap-1.5 text-center">
          <ShieldCheck className={cn("h-3.5 w-3.5", colorConfig.text)} />
          <span className="text-xs font-medium text-slate-300">
            {colorConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}

