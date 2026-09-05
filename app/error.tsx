"use client";

import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-border/80 bg-subtle-background/50 backdrop-blur-xl shadow-xl flex flex-col items-center">
        <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
          <RotateCcw size={22} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected issue occurred while rendering this page. You can try refreshing or returning to the home page.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-orange-500 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Try again</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border bg-subtle-background text-foreground hover:bg-subtle-background/80 transition-all cursor-pointer active:scale-95"
          >
            <Home size={14} />
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
