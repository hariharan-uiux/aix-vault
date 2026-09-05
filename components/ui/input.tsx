"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-full border border-border bg-background px-3.5 text-[13px] text-foreground placeholder:text-subtle-foreground outline-none focus:outline-none focus:border-foreground/60 transition-colors",
        className,
      )}
      {...props}
    />
  );
}
