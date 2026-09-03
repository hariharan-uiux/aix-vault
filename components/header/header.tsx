"use client";

import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { AdminLoginModal } from "@/components/auth/admin-login-modal";
import { Coffee, Folder, FolderOpen, Moon, Search, Shield, Sun } from "lucide-react";

export function Header() {
  const {
    search,
    setSearch,
    setCommandOpen,
    sidebarOpen,
    setSidebarOpen,
    setNavigation,
    navigation,
    result,
    deferredSearch,
    theme,
    setTheme,
    role,
    authModalOpen,
    setAuthModalOpen,
  } = useVault();

  const isNavActive = navigation.kind === "collection";

  return (
    <header
      className={cn(
        "sticky top-0 flex h-12 items-center justify-between border-b border-border apple-blur px-3 sm:px-4 transition-all",
        authModalOpen ? "z-50" : "z-30",
      )}
    >
      {/* Left: Brand */}
      <div className="flex items-center min-w-[100px] sm:min-w-[140px] shrink-0">
        <button
          type="button"
          onClick={() => setNavigation({ kind: "all" })}
          className="text-[13px] font-medium tracking-[0.14em] text-foreground transition-opacity hover:opacity-80"
        >
          AIX VAULT
        </button>
      </div>

      {/* Middle: Centered Search with Folder toggle and Dark mode toggle */}
      <div className="mx-2 sm:mx-4 flex flex-1 max-w-xs sm:max-w-md items-center gap-1.5 sm:gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources..."
            aria-label="Search resources"
            className="h-8 pl-8 pr-10 text-[13px] bg-subtle-background/50 focus:bg-background"
          />
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border px-1.5 py-0.5 text-[11px] font-mono text-subtle-foreground hover:text-foreground"
            aria-label="Search (/ or ⌘K)"
          >
            /
          </button>
        </div>

        {/* Folder toggle button */}
        <Tooltip label={sidebarOpen ? "Close collections" : "Collections & Folders"}>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors",
              sidebarOpen
                ? "bg-subtle-background text-foreground"
                : "bg-subtle-background/50 text-muted-foreground hover:bg-subtle-background hover:text-foreground",
            )}
            aria-label={sidebarOpen ? "Close collections" : "Open collections"}
          >
            {sidebarOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
            {isNavActive && (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />
            )}
          </button>
        </Tooltip>

        {/* Dark mode toggle */}
        <Tooltip label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <button
            type="button"
            onClick={(e) => setTheme(theme === "dark" ? "light" : "dark", e)}
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background/50 text-muted-foreground transition-colors hover:bg-subtle-background hover:text-foreground cursor-pointer"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="relative flex size-4 items-center justify-center">
              <Sun
                size={15}
                className={cn(
                  "absolute transition-all duration-300 ease-out",
                  theme === "dark"
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-0 -rotate-90 opacity-0 pointer-events-none",
                )}
              />
              <Moon
                size={15}
                className={cn(
                  "absolute transition-all duration-300 ease-out",
                  theme === "dark"
                    ? "scale-0 rotate-90 opacity-0 pointer-events-none"
                    : "scale-100 rotate-0 opacity-100",
                )}
              />
            </span>
          </button>
        </Tooltip>
      </div>

      {/* Right: Profile Toggle & Resource Count */}
      <div className="flex items-center justify-end gap-2.5 min-w-[70px] sm:min-w-[170px] shrink-0">
        <span
          className="whitespace-nowrap text-[12px] font-medium text-muted-foreground tabular-nums select-none"
          title={`${result.total} ${result.total === 1 ? "resource" : "resources"}${deferredSearch ? ` for "${deferredSearch}"` : ""}`}
        >
          {result.total}{" "}
          <span className="hidden sm:inline">
            {result.total === 1 ? "resource" : "resources"}
          </span>
          {deferredSearch ? (
            <span className="hidden md:inline text-subtle-foreground truncate max-w-[120px]">
              {` for "${deferredSearch}"`}
            </span>
          ) : null}
        </span>

        {/* Buy Me a Coffee icon button in viewer mode */}
        {role !== "admin" && (
          <Tooltip label="Buy me a coffee">
            <a
              href="https://buymeacoffee.com/hariofficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy me a coffee"
              className="flex size-7.5 sm:size-8 items-center justify-center rounded-full border border-border/80 bg-subtle-background/60 text-muted-foreground transition-all duration-200 hover:bg-[#FFDD00]/15 hover:border-[#FFDD00]/40 hover:text-[#FF813F] dark:hover:text-[#FFDD00] cursor-pointer"
            >
              <Coffee size={14} />
            </a>
          </Tooltip>
        )}

        {/* Profile / Role Badge & Popup (only visible in Admin mode) */}
        {role === "admin" && (
          <div className="relative">
            <Tooltip label="Admin active • Full CRUD enabled (click to manage)">
              <button
                type="button"
                data-admin-trigger="true"
                onClick={() => setAuthModalOpen(!authModalOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer select-none",
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
                  authModalOpen && "ring-2 ring-emerald-500/30 bg-emerald-500/15",
                )}
                aria-expanded={authModalOpen}
                aria-haspopup="dialog"
                aria-label="Admin profile active"
              >
                <Shield size={12} className="shrink-0 text-emerald-500" />
                <span className="capitalize">Admin</span>
              </button>
            </Tooltip>

            <AdminLoginModal />
          </div>
        )}
      </div>
    </header>
  );
}

