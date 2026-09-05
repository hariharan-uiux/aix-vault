"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function Drawer({
  open,
  title,
  onClose,
  headerActions,
  headerRight,
  children,
  className,
  contentClassName,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className={cn(
          "relative z-10 flex w-full max-w-full sm:max-w-2xl md:max-w-3xl flex-col",
          "rounded-t-[28px] sm:rounded-t-[32px] border-t border-x border-black/10 dark:border-white/[0.14]",
          "bg-background/95 dark:bg-[#121318]/95 backdrop-blur-2xl shadow-[0_-12px_44px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_44px_rgba(0,0,0,0.7)]",
          "max-h-[88dvh] sm:max-h-[85dvh] will-change-transform overflow-hidden",
          "transition-all duration-[320ms]",
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-90",
          className,
        )}
      >
        {/* Pull Handle */}
        <div className="mx-auto mt-2.5 -mb-0.5 h-1.5 w-10 rounded-full bg-muted-foreground/30 shrink-0" />

        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {headerActions}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-subtle-background/80 hover:text-foreground border border-border/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Distinct divider line below the title */}
        <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            contentClassName ?? "px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-8",
          )}
        >
          {children}
        </div>
      </aside>
    </div>
  );
}
