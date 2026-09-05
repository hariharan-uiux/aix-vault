"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { AdminLoginModal } from "@/components/auth/admin-login-modal";
import { FeedbackPopup } from "@/components/feedback/feedback-popup";
import { Coffee, Contrast, Loader2, MessageSquarePlus, Moon, Palette, Search, Shield, Sun } from "lucide-react";

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, iconMode, setIconMode } = useVault();

  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-center rounded-full border border-border bg-subtle-background/50 p-0.5 shadow-2xs backdrop-blur-sm",
        className,
      )}
    >
      {/* 1. Theme Toggle (Dark / Light Mode) */}
      <Tooltip
        side="bottom"
        label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <button
          type="button"
          onClick={(e) => setTheme(theme === "dark" ? "light" : "dark", e)}
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-subtle-background hover:text-foreground active:scale-90 cursor-pointer"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="relative flex size-4 items-center justify-center">
            <Sun
              size={14}
              className={cn(
                "absolute transition-all duration-300 ease-out",
                theme === "dark"
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-0 -rotate-90 opacity-0 pointer-events-none",
              )}
            />
            <Moon
              size={14}
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

      {/* Subtle Divider */}
      <div className="h-3.5 w-px shrink-0 bg-border/80 mx-0.5" />

      {/* 2. Icon Mode Toggle (Black & White vs Color Icons) */}
      <Tooltip
        side="bottom"
        label={
          iconMode === "mono"
            ? "Switch to color icons"
            : "Switch to black & white icons"
        }
      >
        <button
          type="button"
          onClick={() => setIconMode(iconMode === "mono" ? "color" : "mono")}
          className={cn(
            "relative flex size-7 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer",
            iconMode === "mono"
              ? "text-orange-500 dark:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-400/10"
              : "text-muted-foreground hover:bg-subtle-background hover:text-foreground",
          )}
          aria-label={
            iconMode === "mono"
              ? "Switch to color icons"
              : "Switch to black & white icons"
          }
        >
          <span className="relative flex size-4 items-center justify-center">
            <Contrast
              size={14}
              className={cn(
                "absolute transition-all duration-300 ease-out",
                iconMode === "mono"
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-0 -rotate-90 opacity-0 pointer-events-none",
              )}
            />
            <Palette
              size={14}
              className={cn(
                "absolute transition-all duration-300 ease-out",
                iconMode === "color"
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-0 rotate-90 opacity-0 pointer-events-none",
              )}
            />
          </span>
        </button>
      </Tooltip>
    </div>
  );
}

export function Header() {
  const {
    view,
    search,
    setSearch,
    setCommandOpen,
    setNavigation,
    result,
    deferredSearch,
    role,
    authModalOpen,
    setAuthModalOpen,
    isLoading,
  } = useVault();

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border apple-blur transition-all",
        (authModalOpen || feedbackOpen) && "z-50",
      )}
    >
      <div className="mx-auto h-12 w-full max-w-[1800px] xl:px-12 2xl:px-16">
        <div className="relative h-full w-full">
          {/* Background Grid Lines matching the Resource Grid below */}
          {view === "grid" && (
            <div className="pointer-events-none absolute inset-0 -mr-px grid h-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 border-l border-r border-border dark:border-white/[0.08]">
              <div className="h-full border-r border-border dark:border-white/[0.08]" />
              <div className="h-full border-r border-border dark:border-white/[0.08]" />
              <div className="hidden md:block h-full border-r border-border dark:border-white/[0.08]" />
              <div className="hidden lg:block h-full border-r border-border dark:border-white/[0.08]" />
              <div className="hidden xl:block h-full border-r border-border dark:border-white/[0.08]" />
              <div className="hidden 2xl:block h-full border-r border-border dark:border-white/[0.08]" />
            </div>
          )}

          <div className="relative z-10 flex h-full w-full items-center justify-between px-3 sm:px-4">
          {/* Left: Brand with Hover Popup & Mobile Resource Count */}
          <div className="group relative flex h-full items-center shrink-0 pr-3 sm:pr-4 sm:min-w-[140px]">
            <button
              type="button"
              onClick={() => setNavigation({ kind: "all" })}
              className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.14em] text-foreground transition-opacity hover:opacity-80 cursor-pointer"
            >
              <span>AIX VAULT</span>
              {/* Mobile view: resource count near AIX vault text in brackets */}
              <span className="sm:hidden text-[12px] font-normal tracking-normal text-muted-foreground font-mono">
                ({result.total})
              </span>
            </button>

            {/* Brand hover popup */}
            <div
              role="tooltip"
              className="pointer-events-none hidden md:block absolute left-0 top-[calc(100%+8px)] z-50 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border/80 dark:border-white/10 bg-background/95 dark:bg-background/95 backdrop-blur-xl p-2.5 sm:px-3 sm:py-2.5 shadow-xl shadow-black/10 dark:shadow-black/50 opacity-0 -translate-y-1 scale-95 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100"
            >
              <div className="text-[12px] font-semibold text-foreground tracking-tight">
                AI + UX = Vault
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-normal">
                handpicked tool for fellow UIdevs like me! :)
              </p>
            </div>
          </div>

          {/* Middle: Desktop Centered Search with Folder toggle and Dark mode toggle (Desktop only) */}
          <div className="hidden sm:flex mx-4 flex-1 min-w-0 max-w-md items-center gap-2">
            <div className="relative flex-1 min-w-0 flex items-center">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search resources..."
                aria-label="Search resources"
                className="h-8 pl-9 pr-10 text-[13px] bg-subtle-background/80 focus:bg-background truncate backdrop-blur-sm"
              />
              <div className="pointer-events-none absolute left-3 inset-y-0 z-10 flex items-center justify-center">
                <Search
                  size={14}
                  strokeWidth={2}
                  className="text-muted-foreground select-none"
                />
              </div>
              <div className="absolute right-2 inset-y-0 z-10 flex items-center">
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="inline-flex rounded-full border border-border px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Search (/ or ⌘K)"
                >
                  /
                </button>
              </div>
            </div>

            {/* Dark mode toggle (Desktop) */}
            <ThemeToggle />
          </div>

          {/* Right: Actions, Profile Toggle & Resource Count */}
          <div className="flex h-full items-center justify-end gap-1.5 sm:gap-2.5 shrink-0 pl-3 sm:pl-4 sm:min-w-[170px]">
        {/* Mobile Search Icon Button */}
        <Tooltip side="bottom" label="Search resources (/ or ⌘K)">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={cn(
              "sm:hidden relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors cursor-pointer",
              search
                ? "bg-subtle-background text-foreground border-foreground/30 shadow-2xs"
                : "bg-subtle-background/50 text-muted-foreground hover:bg-subtle-background hover:text-foreground",
            )}
            aria-label="Search resources"
          >
            <Search size={15} />
            {search && (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />
            )}
          </button>
        </Tooltip>

        {/* Mobile Dark mode toggle */}
        <ThemeToggle className="sm:hidden" />
        {isLoading && result.total === 0 ? (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/80 bg-subtle-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground select-none"
            title="Loading vault resources from Supabase..."
          >
            <Loader2 size={12} className="animate-spin text-muted-foreground" />
            <span className="tabular-nums">Loading...</span>
          </div>
        ) : (
          <span
            className="hidden sm:flex whitespace-nowrap text-[12px] font-medium text-muted-foreground tabular-nums select-none items-center gap-1.5"
            title={`${result.total} ${result.total === 1 ? "resource" : "resources"}${deferredSearch ? ` for "${deferredSearch}"` : ""}`}
          >
            <span>
              {result.total}{" "}
              <span>
                {result.total === 1 ? "resource" : "resources"}
              </span>
              {deferredSearch ? (
                <span className="hidden md:inline text-subtle-foreground truncate max-w-[120px]">
                  {` for "${deferredSearch}"`}
                </span>
              ) : null}
            </span>
          </span>
        )}

        {/* Buy Me a Coffee icon button in viewer mode */}
        {role !== "admin" && (
          <Tooltip side="bottom" label="Buy me a coffee">
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

        {/* Suggest a Tool or Feature (Notes / Feedback) */}
        {role !== "admin" && (
          <Tooltip side="bottom" label="Suggest a tool or feature">
            <button
              type="button"
              data-feedback-trigger="true"
              onClick={() => setFeedbackOpen((prev) => !prev)}
              className={cn(
                "flex size-7.5 sm:size-8 items-center justify-center rounded-full border border-border/80 bg-subtle-background/60 text-muted-foreground transition-all duration-200 hover:bg-subtle-background hover:text-foreground cursor-pointer",
                feedbackOpen && "ring-2 ring-emerald-500/30 border-emerald-500/40 text-foreground bg-subtle-background",
              )}
              aria-label="Suggest a tool or feature"
              aria-expanded={feedbackOpen}
              aria-haspopup="dialog"
            >
              <MessageSquarePlus size={14} />
            </button>
          </Tooltip>
        )}

        <FeedbackPopup open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

        {/* Profile / Role Badge & Popup (only visible in Admin mode) */}
        {role === "admin" && (
          <div className="relative">
            <Tooltip side="bottom" label="Admin active • Full CRUD enabled (click to manage)">
              <button
                type="button"
                data-admin-trigger="true"
                onClick={() => setAuthModalOpen(!authModalOpen)}
                className={cn(
                  "flex size-7.5 sm:size-8 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer select-none",
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50",
                  authModalOpen && "ring-2 ring-emerald-500/30 bg-emerald-500/15",
                )}
                aria-expanded={authModalOpen}
                aria-haspopup="dialog"
                aria-label="Admin profile active"
              >
                <Shield size={14} className="shrink-0 text-emerald-500" />
              </button>
            </Tooltip>

            <AdminLoginModal />
          </div>
        )}
      </div>
    </div>
  </div>
</div>

      {/* Ambient Top Shimmer Bar during Supabase Loading / Syncing */}
      {isLoading && (
        <div className="absolute -bottom-px left-0 right-0 h-[1.5px] overflow-hidden bg-transparent z-40 pointer-events-none">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-foreground/60 to-transparent indeterminate-progress" />
        </div>
      )}
    </header>
  );
}

