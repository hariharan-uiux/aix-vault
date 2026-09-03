"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault/store";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { useState, useRef, useEffect } from "react";
import { Lock, ShieldCheck, LogOut, KeyRound, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLoginModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    role,
    loginAsAdmin,
    logout,
    currentUser,
    isSyncing,
    isDatabaseConnected,
  } = useVault();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isConfigured = hasSupabaseConfig();

  useEffect(() => {
    if (!authModalOpen) return;

    const onMouseDown = (event: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const trigger = (event.target as HTMLElement)?.closest?.('[data-admin-trigger="true"]');
        if (!trigger) {
          setAuthModalOpen(false);
          setError(null);
        }
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAuthModalOpen(false);
        setError(null);
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
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAsAdmin(email.trim(), password);
      if (!result.ok) {
        setError(result.error ?? "Failed to authenticate.");
      } else {
        setAuthModalOpen(false);
        setPassword("");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginAsAdmin("admin", "admin");
      if (result.ok) {
        setAuthModalOpen(false);
      } else {
        setError(result.error ?? "Failed to unlock.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthModalOpen(false);
  };

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-label={role === "admin" ? "Admin Profile Active" : "Admin Authentication"}
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] z-50",
        "w-[340px] sm:w-[380px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-80px)] overflow-y-auto overscroll-contain",
        "rounded-2xl border border-border bg-background/95 backdrop-blur-2xl p-4 sm:p-5",
        "shadow-md",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 ease-out origin-top-right",
      )}
    >
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          {role === "admin" ? (
            <>
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Admin Profile Active
              </h3>
            </>
          ) : (
            <>
              <Shield size={14} className="text-muted-foreground" />
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Admin Authentication
              </h3>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setAuthModalOpen(false);
            setError(null);
          }}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-subtle-background hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close popup"
        >
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {role === "admin" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                <ShieldCheck size={18} />
              </div>
              <div className="text-[12px] space-y-1">
                <p className="font-medium text-foreground">You have Admin permissions</p>
                <p className="text-muted-foreground leading-relaxed">
                  Full CRUD access enabled: You can create, edit, delete resources and organize folders.
                </p>
                {currentUser?.email && (
                  <p className="text-[11px] text-muted-foreground pt-1 font-mono">
                    Signed in as: <span className="text-foreground">{currentUser.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.03] p-3 flex items-center justify-between text-[11.5px]">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2 shrink-0">
                  {isSyncing ? (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </>
                  ) : isDatabaseConnected ? (
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  ) : (
                    <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                  )}
                </span>
                <div>
                  <p className="font-medium text-foreground">Database: Supabase</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {isSyncing ? "Syncing data in progress..." : "Connected & live realtime sync active"}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {isSyncing ? "SYNCING" : "LIVE"}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => setAuthModalOpen(false)}
                className="h-8 text-[12px] px-3"
              >
                Close
              </Button>
              <Button
                variant="subtle"
                onClick={handleLogout}
                className="h-8 text-[12px] px-3 gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={13} />
                Switch to Viewer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="rounded-xl border border-border/70 bg-subtle-background/50 p-3 flex items-start gap-2.5">
              <Lock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                {isConfigured ? (
                  <span>
                    Sign in with your Supabase Admin account to unlock Create, Update, and Delete permissions.
                  </span>
                ) : (
                  <span>
                    Supabase keys not configured in <code className="font-mono text-[11px] text-foreground">.env.local</code>. Use demo mode with password <strong className="text-foreground">admin</strong>.
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Email / Username</label>
              <Input
                type={isConfigured ? "email" : "text"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isConfigured ? "admin@example.com" : "admin"}
                required
                autoComplete="username"
                className="h-8 text-[12px]"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-8 text-[12px]"
              />
            </div>

            <div className="flex items-center justify-between pt-1.5">
              {!isConfigured ? (
                <button
                  type="button"
                  onClick={handleQuickDemoUnlock}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <KeyRound size={12} />
                  <span>Quick Demo Unlock</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setError(null);
                  }}
                  className="h-8 text-[12px] px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-8 text-[12px] px-3"
                >
                  {loading ? "Verifying..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
