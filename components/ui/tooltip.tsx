"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, type ReactNode } from "react";

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "auto";
}) {
  const [visible, setVisible] = useState(false);
  const [computedSide, setComputedSide] = useState<"top" | "bottom">("top");
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const containerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  function isTouchOrMobile() {
    if (typeof window === "undefined") return true;
    return (
      window.innerWidth < 768 ||
      window.matchMedia("(hover: none), (pointer: coarse)").matches
    );
  }

  function show() {
    if (isTouchOrMobile()) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If forced to bottom or if near the top of the screen (< 50px), show below
      if (side === "bottom" || rect.top < 50) {
        setComputedSide("bottom");
      } else {
        setComputedSide("top");
      }

      // Check horizontal boundary to avoid cut-off
      if (rect.left + rect.width / 2 < 80) {
        setAlign("left");
      } else if (window.innerWidth - (rect.left + rect.width / 2) < 80) {
        setAlign("right");
      } else {
        setAlign("center");
      }
    }

    setVisible(true);
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 80);
  }

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={(e) => {
        // Only show tooltip for keyboard navigation, not touch taps
        if (e.currentTarget.matches(":focus-visible")) {
          show();
        }
      }}
      onBlur={hide}
      onTouchStart={hide}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") hide();
      }}
    >
      {children}
      {visible ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-lg shadow-black/20 dark:shadow-black/60",
            "hidden md:inline-flex",
            computedSide === "top" && "bottom-full mb-2",
            computedSide === "bottom" && "top-full mt-2",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "left" && "left-0",
            align === "right" && "right-0",
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
