"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { sorts } from "@/components/filters/filters";
import { tags } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import {
  ArrowUpDown,
  Check,
  Folder,
  FolderOpen,
  Grid2x2,
  LayoutList,
  MoreHorizontal,
  Rows3,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function DockMoreMenu() {
  const {
    sidebarOpen,
    setSidebarOpen,
    navigation,
    filters,
    setFilters,
    resourceTypes,
    sort,
    setSort,
    view,
    setView,
  } = useVault();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "filter" | "sort">("none");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; right: number; isMobile: boolean } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isNavActive = navigation.kind === "collection";
  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0) +
    (filters.openSource ? 1 : 0);

  const hasActiveState = isNavActive || activeFilterCount > 0 || sidebarOpen;
  const currentSortLabel = sorts.find((item) => item.id === sort)?.label ?? "Sort";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const dockPill = menuRef.current?.closest(".frosted-dock") ?? menuRef.current;
      if (!dockPill) return;

      const rect = dockPill.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      // Snug 6px gap between the top of the dock pill and the bottom of the popup
      const bottom = Math.max(12, Math.round(window.innerHeight - rect.top + 6));
      const right = Math.round(window.innerWidth - rect.right);

      setCoords({ bottom, right, isMobile });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false);
        setActiveTab("none");
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveTab("none");
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      setActiveTab("none");
    } else {
      setOpen(true);
      setActiveTab(activeFilterCount > 0 ? "filter" : "none");
    }
  };

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        {/* Three-dot Trigger Button */}
        <Tooltip label={open ? "Close menu" : "More options (Grid, Folders, Filters, Sort)"}>
          <button
            type="button"
            aria-expanded={open}
            aria-label="More options (Grid, Folders, Filters, Sort)"
            onClick={toggleOpen}
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer",
              open || hasActiveState
                ? "border-black/[0.12] dark:border-white/[0.18] bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-2xs"
                : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
            )}
          >
            <MoreHorizontal size={16} />
            {hasActiveState && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Frosted Portal Popup directly mounted to body with real backdrop-filter */}
      {mounted && open &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="More options menu"
            style={{
              bottom: coords ? `${coords.bottom}px` : "5rem",
              right: coords && !coords.isMobile ? `${coords.right}px` : undefined,
            }}
            className="fixed z-50 max-sm:left-1/2 max-sm:right-auto sm:left-auto w-[min(calc(100vw-24px),21rem)] rounded-3xl border border-black/[0.08] dark:border-white/[0.14] frosted-popup p-3 animate-popup-from-below"
          >
            {/* Grid & View Layout Customization */}
            <div className="pb-2.5 px-0.5">
              <div className="flex items-center justify-between mb-1.5 px-1.5">
                <span className="text-[12px] font-medium text-muted-foreground">Grid & Layout</span>
                <span className="text-[11.5px] text-muted-foreground capitalize font-mono">{view} view</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-1 border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-full text-[12.5px] font-medium transition-all cursor-pointer select-none",
                    view === "grid"
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                >
                  <Grid2x2 size={15} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-full text-[12.5px] font-medium transition-all cursor-pointer select-none",
                    view === "list"
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                >
                  <LayoutList size={15} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("compact")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-full text-[12.5px] font-medium transition-all cursor-pointer select-none",
                    view === "compact"
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                >
                  <Rows3 size={15} />
                  <span>Compact</span>
                </button>
              </div>
            </div>

            {/* Action Icons Row (Folders, Filter, Sort) */}
            <div className="pt-2 border-t border-black/[0.08] dark:border-white/[0.1]">
              <div className="flex items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-1 border border-black/[0.06] dark:border-white/[0.08]">
                {/* 1. Folder Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(!sidebarOpen);
                  }}
                  className={cn(
                    "flex-1 flex h-9.5 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium transition-all cursor-pointer select-none",
                    sidebarOpen || isNavActive
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                  aria-label={sidebarOpen ? "Close collections" : "Open collections"}
                >
                  {sidebarOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
                  <span>Folders</span>
                  {isNavActive && (
                    <span className="size-1.5 rounded-full bg-foreground" />
                  )}
                </button>

                {/* 2. Filter Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab((prev) => (prev === "filter" ? "none" : "filter"));
                  }}
                  className={cn(
                    "flex-1 flex h-9.5 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium transition-all cursor-pointer select-none",
                    activeTab === "filter" || activeFilterCount > 0
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                  aria-label="Filter resources"
                >
                  <SlidersHorizontal size={16} />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* 3. Sort Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab((prev) => (prev === "sort" ? "none" : "sort"));
                  }}
                  className={cn(
                    "flex-1 flex h-9.5 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium transition-all cursor-pointer select-none",
                    activeTab === "sort"
                      ? "bg-background/90 dark:bg-neutral-800/90 text-foreground shadow-xs font-semibold border border-black/[0.08] dark:border-white/[0.14]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                  aria-label={`Sort: ${currentSortLabel}`}
                >
                  <ArrowUpDown size={16} />
                  <span>Sort</span>
                </button>
              </div>
            </div>

            {/* Subpanel: Filter Options */}
            {activeTab === "filter" && (
              <div className="pt-2.5 pb-1 px-1 border-t border-black/[0.08] dark:border-white/[0.1] mt-2 space-y-3 animate-in fade-in-0 duration-150">
                {/* Type Select */}
                <label className="block">
                  <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
                    Resource Type
                  </span>
                  <select
                    value={filters.type ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value || null })
                    }
                    className="h-9 w-full rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-background/80 px-3.5 text-[12.5px] text-foreground focus:outline-none"
                  >
                    <option value="">Any Type</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.slug}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Free & Open Source Checkboxes */}
                <div className="flex items-center gap-4 text-[12.5px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.free}
                      onChange={(e) => setFilters({ ...filters, free: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span>Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.openSource}
                      onChange={(e) =>
                        setFilters({ ...filters, openSource: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <span>Open Source</span>
                  </label>
                </div>

                {/* Tags Cloud */}
                <div>
                  <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">
                    Tags
                  </span>
                  <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto overscroll-contain pr-1">
                    {tags.slice(0, 16).map((tag) => {
                      const active = filters.tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setFilters({
                              ...filters,
                              tagIds: active
                                ? filters.tagIds.filter((id) => id !== tag.id)
                                : [...filters.tagIds, tag.id],
                            })
                          }
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11.5px] transition-colors cursor-pointer",
                            active
                              ? "border-foreground bg-foreground text-background font-medium"
                              : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover:text-foreground",
                          )}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Filters Option */}
                {activeFilterCount > 0 && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          type: null,
                          free: false,
                          openSource: false,
                          tagIds: [],
                        })
                      }
                      className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subpanel: Sort Options */}
            {activeTab === "sort" && (
              <div className="pt-2 pb-1 px-1 border-t border-black/[0.08] dark:border-white/[0.1] mt-2 flex flex-col gap-0.5 animate-in fade-in-0 duration-150">
                <span className="mb-1 px-2 text-[11.5px] font-medium text-muted-foreground">
                  Sort resources by
                </span>
                {sorts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSort(item.id);
                      setActiveTab("none");
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer",
                      sort === item.id
                        ? "bg-black/[0.06] dark:bg-white/[0.1] font-medium text-foreground"
                        : "text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground",
                    )}
                  >
                    <span>{item.label}</span>
                    {sort === item.id && <Check size={14} className="text-foreground" />}
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
