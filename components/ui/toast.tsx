"use client";

import type { ReactNode } from "react";

export function Toast({ message }: { message: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-24 left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-2rem)] truncate rounded-full border border-border bg-background px-4 py-2 text-[13px] shadow-[var(--shadow)] text-center"
    >
      {message}
    </div>
  );
}
