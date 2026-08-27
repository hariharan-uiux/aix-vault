"use client";

import { Header } from "@/components/header/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useVault();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[220px] shrink-0 border-r border-border md:block">
          <Sidebar />
        </aside>
        <div
          className={cn(
            "fixed inset-0 z-30 md:hidden",
            sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <button
            aria-label="Close navigation"
            className={cn(
              "absolute inset-0 bg-[var(--overlay)] transition-opacity duration-[180ms]",
              sidebarOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setSidebarOpen(false)}
            tabIndex={sidebarOpen ? 0 : -1}
          />
          <aside
            className={cn(
              "absolute left-0 top-0 h-full w-[240px] border-r border-border bg-background transition-transform duration-[240ms]",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <p className="px-5 pt-4 text-[13px] font-medium tracking-[0.14em]">AIX VAULT</p>
            <Sidebar />
          </aside>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
