"use client";

import { useVault } from "@/lib/vault/store";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { VaultApp } from "@/components/vault-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";

function AdminLoginPage() {
  const { loginAsAdmin } = useVault();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = hasSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAsAdmin(email.trim(), password);
      if (!result.ok) {
        setError(result.error ?? "Authentication failed.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginAsAdmin("admin", "admin");
      if (!result.ok) {
        setError(result.error ?? "Failed to unlock.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Product Header */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border apple-blur px-3.5 sm:px-6">
        <Link
          href="/"
          className="text-[13px] font-medium tracking-[0.14em] text-foreground hover:opacity-80 transition-opacity shrink-0"
        >
          AIX VAULT
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={13} />
          <span>
            <span className="hidden sm:inline">Return to </span>Directory
          </span>
        </Link>
      </header>

      {/* Main Form Content */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[340px] space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-foreground">
              AIX Vault Admin Portal
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Authenticate to manage developer & design resources, create categories, and organize collections.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-[12px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">
                Email / Username
              </label>
              <Input
                type={isConfigured ? "email" : "text"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isConfigured ? "admin@example.com" : "admin"}
                required
                className="h-9 rounded-full border-border bg-subtle-background/50 px-3.5 text-[13px] focus:bg-background"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-foreground">
                  Password
                </label>
                {!isConfigured && (
                  <span className="text-[11px] text-muted-foreground">Demo: admin</span>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-9 rounded-full border-border bg-subtle-background/50 px-3.5 text-[13px] focus:bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-full text-[13px] font-medium cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Admin"}
            </Button>
          </form>

          {!isConfigured && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-border py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
              >
                <KeyRound size={13} />
                <span>Quick Demo Unlock (One-Click)</span>
              </button>
            </div>
          )}

          <div className="text-center pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Return to Public Directory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin } = useVault();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginPage />;
  }

  return <VaultApp />;
}
