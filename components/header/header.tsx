"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/lib/vault/store";
import { Menu, Moon, Plus, Search, Sun } from "lucide-react";

export function Header() {
  const { search, setSearch, setAddOpen, setCommandOpen, setSidebarOpen, theme, setTheme } =
    useVault();

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border px-4">
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-subtle-background md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={16} />
      </button>
      <p className="text-[13px] font-medium tracking-[0.14em]">AIX VAULT</p>
      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resources..."
          aria-label="Search resources"
          className="pl-8 pr-16"
        />
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[4px] border border-border px-1.5 py-0.5 text-[11px] font-mono text-subtle-foreground"
          aria-label="Search (/ or ⌘K)"
        >
          /
        </button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-subtle-background md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
        >
          <Search size={16} />
        </button>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-subtle-background"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Button size="icon" className="sm:h-8 sm:w-auto sm:px-2.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </header>
  );
}
