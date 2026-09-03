"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  title,
  onClose,
  headerActions,
  headerRight,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  headerRight?: ReactNode;
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
          "absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-all duration-[180ms]",
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
          "absolute right-0 top-0 flex h-full w-full max-w-[380px] sm:max-w-[400px] flex-col border-l border-border bg-background shadow-[var(--shadow)] transition-transform duration-[240ms] ease-out",
          "max-md:top-auto max-md:bottom-0 max-md:h-[88dvh] max-md:max-h-[90dvh] max-md:max-w-none max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t",
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-x-full md:translate-y-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {headerActions}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-subtle-background/80 hover:text-foreground border border-border/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:px-6">{children}</div>
      </aside>
    </div>
  );
}
