"use client";

import {
  FilterPopover,
  PlatformToggle,
  SortMenu,
  ViewToggle,
} from "@/components/filters/filters";
import { DockMoreMenu } from "@/components/dock/dock-more-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import { Folder, FolderOpen, Home, Plus } from "lucide-react";

export function FloatingDock() {
  const {
    setAddOpen,
    navigation,
    goBack,
    isAdmin,
    sidebarOpen,
    setSidebarOpen,
  } = useVault();
  const isFolder = navigation.kind === "collection";

  return (
    <aside
      aria-label="Quick Actions and Filters"
      className="pointer-events-none fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-40 flex items-center justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-4"
    >
      <div
        className={cn(
          "pointer-events-auto frosted-dock relative flex items-center gap-1 sm:gap-1.5 rounded-full border border-black/10 dark:border-white/12 p-1 sm:p-1.5 transition-all duration-200",
          isAdmin ? "max-w-[calc(100vw-4.5rem)]" : "max-w-[calc(100vw-1.5rem)]",
        )}
      >
        {/* Home button when inside a folder */}
        {isFolder && (
          <Tooltip label="Home">
            <button
              type="button"
              onClick={goBack}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground cursor-pointer"
              aria-label="Home"
            >
              <Home size={14} />
            </button>
          </Tooltip>
        )}

        {/* Platform Mode: All / Dev / Design */}
        <PlatformToggle />

        {/* Divider */}
        <div className="h-4 w-px shrink-0 bg-border/80 mx-0.5 sm:mx-0" />

        {/* Desktop Detailed Dock Controls (All buttons directly visible in the dock) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
          {/* 1. Folders Button */}
          <Tooltip label={sidebarOpen ? "Close collections" : "Collections & Folders"}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer",
                sidebarOpen || isFolder
                  ? "border-black/[0.12] dark:border-white/[0.18] bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-2xs"
                  : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
              )}
              aria-label={sidebarOpen ? "Close collections" : "Collections & Folders"}
            >
              {sidebarOpen ? (
                <FolderOpen size={14} />
              ) : (
                <Folder size={14} />
              )}
              {isFolder && (
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground" />
              )}
            </button>
          </Tooltip>

          {/* 2. Filters Popover Button */}
          <FilterPopover side="top" align="center" iconOnly />

          {/* 3. Sort Menu Popover Button */}
          <SortMenu side="top" align="center" iconOnly />

          {/* 4. Grid / List / Compact View Toggle */}
          <ViewToggle />
        </div>

        {/* Mobile More Button (compact dock for small screens) */}
        <div className="sm:hidden">
          <DockMoreMenu />
        </div>
      </div>

      {/* Separate Add Resource Button (Admin Only) */}
      {isAdmin && (
        <Tooltip label="Add resource (Space)">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="pointer-events-auto frosted-dock shrink-0 flex size-10 items-center justify-center rounded-full border border-black/10 dark:border-white/12 text-foreground transition-all duration-200 hover:bg-subtle-background hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Add resource"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </Tooltip>
      )}
    </aside>
  );
}
