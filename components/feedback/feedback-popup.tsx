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

      {/* Bottom Sheet Popup */}
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-label="Suggest a tool or feature"
        style={{
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className={cn(
          "relative z-10 flex w-full max-w-md sm:max-w-lg flex-col gap-3.5",
          "rounded-t-[28px] sm:rounded-t-[32px] border-t sm:border-x border-border/80 dark:border-white/12",
          "bg-background/95 dark:bg-[#121318]/95 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl",
          "will-change-transform transition-all duration-[320ms]",
          "max-h-[85dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-90",
        )}
      >
        {/* Pull Handle */}
        <div className="mx-auto -mt-1 mb-1 h-1.5 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
        {/* Header with Title & Close button */}
        <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Suggest a Tool or Feature
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Share your ideas directly with the creator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6.5 items-center justify-center rounded-full text-muted-foreground hover:bg-subtle-background hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2.5">
              <Check size={20} className="stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Feedback Sent!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Thank you for helping improve AIX Vault! Your suggestion has been delivered.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Text Enter Box */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="You can enter your feedbacks and features here"
                rows={4}
                required
                disabled={isSubmitting}
                className={cn(
                  "w-full resize-none rounded-xl border border-border/80 bg-subtle-background/50 px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70",
                  "focus:border-foreground/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10",
                  "transition-all duration-150 disabled:opacity-50"
                )}
                onKeyDown={(e) => {
                  // Allow Command+Enter or Ctrl+Enter to submit
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    if (message.trim() && !isSubmitting) {
                      handleSubmit(e);
                    }
                  }
                }}
              />
            </div>

            {error && (
              <p className="text-[11px] text-destructive font-medium px-0.5 animate-in fade-in">
                {error}
              </p>
            )}

            {/* Send Button Alone */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                "bg-foreground text-background shadow-sm hover:opacity-90 active:scale-[0.99]",
                "disabled:pointer-events-none disabled:opacity-45"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
