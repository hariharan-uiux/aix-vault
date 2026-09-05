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
import { createPortal } from "react-dom";

interface PopoverContextType {
  close: () => void;
}

const PopoverContext = createContext<PopoverContextType>({ close: () => {} });

export const usePopover = () => useContext(PopoverContext);

export function Popover({
  label,
  children,
  align = "center",
  side = "top",
  triggerClassName,
  contentClassName,
}: {
  label: ReactNode | ((props: { open: boolean }) => ReactNode);
  children: ReactNode;
  align?: "left" | "right" | "center";
  side?: "top" | "bottom";
  triggerClassName?: string | ((props: { open: boolean }) => string);
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    bottom?: number;
    top?: number;
    left?: number;
    right?: number;
    isCenter?: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const dockPill = triggerRef.current.closest(".frosted-dock") ?? triggerRef.current;
    const dockRect = dockPill.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();

    if (side === "top") {
      // Snug 6px gap directly above the dock
      const bottom = Math.max(12, Math.round(window.innerHeight - dockRect.top + 6));
      if (align === "center") {
        // Centered on trigger button, clamped so 320px popover never clips off viewport edges
        const center = Math.round(triggerRect.left + triggerRect.width / 2);
        const halfWidth = 160;
        const left = Math.max(
          halfWidth + 12,
          Math.min(window.innerWidth - halfWidth - 12, center),
        );
        setCoords({ bottom, left, isCenter: true });
      } else if (align === "right") {
        const right = Math.round(window.innerWidth - triggerRect.right);
        setCoords({ bottom, right });
      } else {
        const left = Math.round(triggerRect.left);
        setCoords({ bottom, left });
      }
    } else {
      const top = Math.round(triggerRect.bottom + 8);
      if (align === "right") {
        const right = Math.round(window.innerWidth - triggerRect.right);
        setCoords({ top, right });
      } else if (align === "center") {
        const center = Math.round(triggerRect.left + triggerRect.width / 2);
        const halfWidth = 160;
        const left = Math.max(
          halfWidth + 12,
          Math.min(window.innerWidth - halfWidth - 12, center),
        );
        setCoords({ top, left, isCenter: true });
      } else {
        const left = Math.round(triggerRect.left);
        setCoords({ top, left });
      }
    }
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [open, side, align]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target) &&
        !(target as Element).closest?.("[data-popover-child]")
      ) {
        setOpen(false);
      }
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

  const toggle = () => {
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <PopoverContext.Provider value={{ close: () => setOpen(false) }}>
      <div className="relative inline-block" ref={triggerRef}>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] px-3 text-[13px] text-muted-foreground transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground cursor-pointer",
            open && !triggerClassName && "border-black/[0.12] dark:border-white/[0.18] bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-2xs",
            typeof triggerClassName === "function" ? triggerClassName({ open }) : triggerClassName,
          )}
        >
          {typeof label === "function" ? label({ open }) : label}
        </button>
      </div>

      {mounted && open && coords &&
        createPortal(
          <div
            style={{
              position: "fixed",
              bottom: coords?.bottom !== undefined ? `${coords.bottom}px` : undefined,
              top: coords?.top !== undefined ? `${coords.top}px` : undefined,
              left: coords?.left !== undefined ? `${coords.left}px` : undefined,
              right: coords?.right !== undefined ? `${coords.right}px` : undefined,
              transform: coords?.isCenter ? "translateX(-50%)" : undefined,
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <div
              ref={contentRef}
              role="dialog"
              className={cn(
                "pointer-events-auto min-w-[190px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain rounded-3xl border border-black/[0.08] dark:border-white/[0.14] frosted-popup p-3 shadow-2xl shadow-black/25 dark:shadow-black/70 animate-popover-slide-up",
                contentClassName,
              )}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </PopoverContext.Provider>
  );
}
