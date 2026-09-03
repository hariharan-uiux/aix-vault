"use client";

import type { ReactNode } from "react";

export function Toast({ message }: { message: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-background px-4 py-2 text-[13px] shadow-[var(--shadow)]"
    >
      {message}
    </div>
  );
}
