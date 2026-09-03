"use client";

import {
  FilterPopover,
  PlatformToggle,
  SortMenu,
  ViewToggle,
} from "@/components/filters/filters";
import { Tooltip } from "@/components/ui/tooltip";
import { useVault } from "@/lib/vault/store";
import { Home, Plus } from "lucide-react";

export function FloatingDock() {
  const { setAddOpen, navigation, goBack, isAdmin } = useVault();
  const isFolder = navigation.kind === "collection";

  return (
    <aside
      aria-label="Quick Actions and Filters"
      className="pointer-events-none fixed bottom-5 inset-x-0 z-30 flex items-center justify-center gap-2 sm:gap-2.5 px-4"
    >
      <div
        className="pointer-events-auto apple-blur relative flex max-w-[calc(100vw-5.5rem)] items-center gap-1.5 rounded-full border border-border/80 bg-background/85 p-1.5 transition-all duration-200 sm:gap-2"
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

        {/* Display Controls: Filters, Sort, View Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5">
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

