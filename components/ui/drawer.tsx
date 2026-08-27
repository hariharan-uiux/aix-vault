"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-40",
        open && "pointer-events-auto",
      )}
    >
      <button
        aria-label="Close details"
        className={cn(
          "absolute inset-0 bg-[var(--overlay)] transition-opacity duration-[180ms]",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col border-l border-border bg-background shadow-[var(--shadow)] transition-transform duration-[240ms] ease-out max-md:max-w-none max-md:rounded-t-[10px] max-md:border-l-0 max-md:border-t md:translate-x-0",
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-x-full md:translate-y-0",
        )}
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-subtle-background"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">{children}</div>
      </aside>
    </div>
  );
}
