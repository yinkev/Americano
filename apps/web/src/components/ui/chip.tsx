"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ChipColor = "neutral" | "primary" | "success" | "warning" | "info" | "accent"
type ChipSize = "sm" | "md"

export type ChipProps = {
  label: React.ReactNode
  value?: React.ReactNode
  color?: ChipColor
  icon?: React.ReactNode
  dot?: boolean
  size?: ChipSize
  className?: string
}

const colorMap: Record<ChipColor, { dot: string; text: string }> = {
  neutral: { dot: "bg-[oklch(0.66_0.03_240)]", text: "text-foreground" },
  primary: { dot: "bg-[oklch(0.68_0.12_165)]", text: "text-foreground" },
  success: { dot: "bg-success", text: "text-foreground" },
  warning: { dot: "bg-warning", text: "text-foreground" },
  info: { dot: "bg-info", text: "text-foreground" },
  accent: { dot: "bg-accent", text: "text-foreground" },
}

export function Chip({ label, value, color = "neutral", icon, dot, size = "sm", className }: ChipProps) {
  const sizing = size === "sm" ? "h-7 px-3 text-xs gap-2" : "h-8 px-3.5 text-sm gap-2.5"
  const { dot: dotCls, text } = colorMap[color]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted",
        sizing,
        className,
      )}
    >
      {icon ? (
        <span className={cn("shrink-0", size === "sm" ? "size-3.5" : "size-4")}>{icon}</span>
      ) : dot ? (
        <span className={cn("shrink-0 rounded-full", dotCls, size === "sm" ? "size-2.5" : "size-3")}></span>
      ) : null}
      <span className="text-muted-foreground">{label}</span>
      {value ? <span className={cn("font-semibold tabular-nums", text)}>{value}</span> : null}
    </span>
  )
}

export default Chip

