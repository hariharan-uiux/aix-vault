"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackPopupProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackPopup({ open, onClose }: FeedbackPopupProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus textarea when opened
  useEffect(() => {
    if (open) {
      setIsSuccess(false);
      setError(null);
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside popup or clicking the trigger button
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        !target.closest('[data-feedback-trigger="true"]')
      ) {
        onClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("touchstart", onMouseDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("touchstart", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: cleanMessage }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send feedback.");
      }

      setIsSuccess(true);
      setMessage("");

      // Auto close after showing success message
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2200);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]",
          isClosing ? "animate-drawer-backdrop-out" : "animate-drawer-backdrop-in",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Popup */}
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-label="Suggest a tool or feature"
        className={cn(
          "relative z-10 flex w-full max-w-full sm:max-w-2xl md:max-w-3xl flex-col",
          "rounded-t-xl border-t border-x border-black/10 dark:border-white/[0.14]",
          "bg-background dark:bg-[#121318] shadow-[0_-12px_44px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_44px_rgba(0,0,0,0.7)]",
          "max-h-[85dvh] overflow-hidden",
          isClosing ? "animate-drawer-out" : "animate-drawer-in",
        )}
      >
        <div className="flex w-full min-h-full">
          {/* Main Content: Left Column (Identity) + Middle Column (Message Cell) */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row">
            {/* Left Column: Identity */}
            <div className="w-full sm:w-[220px] md:w-[250px] shrink-0 p-5 sm:p-6 flex flex-col text-center sm:text-left">
              {/* Emerald Sparkles Icon */}
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3.5 mx-auto sm:mx-0 border border-emerald-500/20">
                <Sparkles size={20} />
              </div>

              {/* Title */}
              <h2 className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-foreground leading-snug">
                Feedback & Ideas
              </h2>

              {/* Subtitle */}
              <p className="mt-1 sm:mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
                Suggest new tools, request features, or share feedback directly with the creator.
              </p>
            </div>

            {/* Distinct vertical line between left and right division (Desktop) */}
            <div className="hidden sm:block w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

            {/* Distinct horizontal line between top and bottom division (Mobile) */}
            <div className="sm:hidden h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

            {/* Middle Column: Textarea Cell */}
            <div className="flex-1 min-w-0 flex flex-col p-5 sm:p-6 text-left">
              {isSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center animate-in fade-in-0 zoom-in-95 duration-200">
                  <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2.5">
                    <Check size={20} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Feedback Delivered!</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    Thank you for helping improve AIX Vault. Your suggestion has been sent.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 block select-none">
                      Your Suggestion
                    </span>
                    <span className="hidden sm:inline text-[10.5px] text-muted-foreground/60 select-none">
                      Press ⌘+Enter to send
                    </span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe a tool you'd like added, or any thoughts to improve the vault..."
                    rows={4}
                    required
                    disabled={isSubmitting}
                    className={cn(
                      "w-full flex-1 resize-none rounded-xl border border-black/10 dark:border-white/10 bg-subtle-background/50 px-3.5 py-3 text-[12.5px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/60",
                      "focus:border-foreground/30 focus:bg-background focus:outline-none",
                      "transition-all duration-150 disabled:opacity-50 min-h-[110px]"
                    )}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (message.trim() && !isSubmitting) {
                          handleSubmit(e);
                        }
                      }
                    }}
                  />

                  {error && (
                    <p className="text-[11.5px] text-destructive font-medium mt-2 px-0.5 animate-in fade-in">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Distinct vertical line before right action column */}
          <div className="w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

          {/* Right Column: Close & Send Actions (Last Column) */}
          <div className="w-[52px] sm:w-14 md:w-16 shrink-0 bg-subtle-background/20 dark:bg-white/[0.015] self-stretch flex flex-col">
            <div className="flex-1 flex flex-col items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 sm:size-9.5 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 border border-border/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Close popup"
                title="Close"
              >
                <X size={15} />
              </button>

              {/* Send Button (Vertical Pill matching ResourceDrawer Open button) */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className={cn(
                  "flex w-9 sm:w-9.5 flex-1 min-h-12 items-center justify-center rounded-full transition-all shadow-xs active:scale-[0.96] cursor-pointer select-none",
                  "bg-foreground text-background hover:bg-emerald-600 hover:text-white",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
                title="Send Feedback"
                aria-label="Send Feedback"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin shrink-0" />
                ) : (
                  <Send size={15} className="shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
