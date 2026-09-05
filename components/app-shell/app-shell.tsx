"use client";

import { Header } from "@/components/header/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Header />
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
}

