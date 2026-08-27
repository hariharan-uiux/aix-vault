"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Popover({
  label,
  children,
  align = "right",
}: {
  label: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border px-2.5 text-[13px] text-foreground hover:bg-subtle-background"
      >
        {label}
      </button>
      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+6px)] z-30 min-w-[220px] rounded-[8px] border border-border bg-background p-3 shadow-[var(--shadow)] max-sm:left-0 max-sm:right-0 max-sm:min-w-0",
            align === "right" ? "right-0 sm:right-0" : "left-0",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
