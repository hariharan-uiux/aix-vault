"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PopoverContextType {
  close: () => void;
}

const PopoverContext = createContext<PopoverContextType>({ close: () => {} });

export const usePopover = () => useContext(PopoverContext);

export function Popover({
  label,
  children,
  align = "right",
  side = "bottom",
  triggerClassName,
  contentClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
  side?: "top" | "bottom";
  triggerClassName?: string;
  contentClassName?: string;
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
    <PopoverContext.Provider value={{ close: () => setOpen(false) }}>
      <div className="relative inline-block" ref={ref}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] text-foreground transition-colors hover:bg-subtle-background",
            triggerClassName,
          )}
        >
          {label}
        </button>
        {open ? (
          <div
            className={cn(
              "absolute z-50 min-w-[200px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background p-3 shadow-2xl shadow-black/15 dark:shadow-black/50",
              side === "top"
                ? "bottom-[calc(100%+10px)]"
                : "top-[calc(100%+8px)]",
              align === "right"
                ? "right-0"
                : align === "center"
                ? "left-1/2 -translate-x-1/2"
                : "left-0",
              contentClassName,
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </PopoverContext.Provider>
  );
}

