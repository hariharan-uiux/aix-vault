"use client";

import {
  FilterPopover,
  PlatformToggle,
  SortMenu,
  ViewToggle,
} from "@/components/filters/filters";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import { Folder, FolderOpen, Home, Plus } from "lucide-react";

export function FloatingDock() {
  const { setAddOpen, navigation, goBack, isAdmin, sidebarOpen, setSidebarOpen } = useVault();
  const isFolder = navigation.kind === "collection";
  const isNavActive = navigation.kind === "collection";

  return (
    <aside
      aria-label="Quick Actions and Filters"
      className="pointer-events-none fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-40 flex items-center justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-4"
    >
      <div
        className={cn(
          "pointer-events-auto apple-blur relative flex items-center gap-1 sm:gap-2 rounded-full border border-border/80 bg-background/85 p-1 sm:p-1.5 transition-all duration-200",
          isAdmin ? "max-w-[calc(100vw-4.5rem)]" : "max-w-[calc(100vw-1.5rem)]",
        )}
      >
        {/* Home button when inside a folder */}
        {isFolder && (
          <Tooltip label="Home">
            <button
              type="button"
              onClick={goBack}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle-background hover:text-foreground cursor-pointer"
              aria-label="Home"
            >
              <Home size={14} />
            </button>
          </Tooltip>
        )}

        {/* Platform Mode: Dev / Design */}
        <PlatformToggle />

        <div className="h-4 w-px shrink-0 bg-border/80" />

        {/* Display Controls: Folders (mobile), Filters, Sort, View Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Folder toggle button (Mobile only; on desktop it is in the header) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "sm:hidden relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors cursor-pointer",
              sidebarOpen
                ? "bg-subtle-background text-foreground"
                : "bg-subtle-background/50 text-muted-foreground hover:bg-subtle-background hover:text-foreground",
            )}
            aria-label={sidebarOpen ? "Close collections" : "Collections & Folders"}
          >
            {sidebarOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
            {isNavActive && (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />
            )}
          </button>

          <FilterPopover side="top" align="center" iconOnly />
          <SortMenu side="top" align="center" iconOnly />
          <div className="hidden sm:block">
            <ViewToggle />
          </div>
        </div>
      </div>

      {/* Separate Add Resource Button (Admin Only) */}
      {isAdmin && (
        <Tooltip label="Add resource">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="pointer-events-auto apple-blur shrink-0 flex size-10 items-center justify-center rounded-full border border-border/80 bg-background/85 text-foreground transition-all duration-200 hover:bg-subtle-background hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Add resource"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </Tooltip>
      )}
    </aside>
  );
}

