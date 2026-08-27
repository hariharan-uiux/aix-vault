"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "subtle";
type Size = "sm" | "md" | "icon";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" && "h-8 px-2.5 text-[13px]",
        size === "md" && "h-9 px-3 text-[13px]",
        size === "icon" && "size-8",
        variant === "primary" && "bg-foreground text-background hover:bg-foreground/90",
        variant === "ghost" && "text-foreground hover:bg-subtle-background",
        variant === "outline" &&
          "border border-border bg-background text-foreground hover:bg-subtle-background",
        variant === "subtle" && "bg-subtle-background text-foreground hover:bg-border",
        className,
      )}
      {...props}
    />
  );
}
