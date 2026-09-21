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
  showHeader = true,
  footer,
  footerClassName,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  headerActions?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showHeader?: boolean;
  footer?: ReactNode;
  footerClassName?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    } else if (mounted) {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

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
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center pointer-events-auto">
      {/* Backdrop: fades in and out smoothly */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-240 ease-out",
          visible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel: simple pure slide in from down without popup effects */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex w-full max-w-full sm:max-w-2xl md:max-w-3xl flex-col",
          "rounded-t-xl border-t border-x border-black/10 dark:border-white/[0.14]",
          "bg-background dark:bg-[#121318] shadow-[0_-12px_44px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_44px_rgba(0,0,0,0.7)]",
          "max-h-[88dvh] sm:max-h-[85dvh] overflow-hidden",
          "transition-transform duration-240 ease-out transform-gpu",
          visible ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {showHeader && (
          <>
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {headerActions}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {headerRight}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 border border-border/80 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Distinct divider line below the title */}
            <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />
          </>
        )}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            contentClassName ?? "px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-8",
          )}
        >
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              "shrink-0 border-t border-black/10 dark:border-white/[0.14] bg-background/95 dark:bg-[#121318]/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-center pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
