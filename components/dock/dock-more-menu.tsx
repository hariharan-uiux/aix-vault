"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { sorts } from "@/components/filters/filters";
import { tags } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  Folder,
  FolderOpen,
  MoreHorizontal,
  SlidersHorizontal,
  SquareCheck,
  X,
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
    isAdmin,
    isSelectMode,
    setSelectMode,
    clearSelection,
    selectedResourceIds,
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
      // Snug 8px gap between the top of the dock pill and the bottom of the popup
      const bottom = Math.max(12, Math.round(window.innerHeight - rect.top + 8));
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
      setActiveTab("none");
    }
  };

  return (
    <>
      <div className="relative inline-flex items-center justify-center" ref={menuRef}>
        {/* Three-dot Trigger Button (toggles to X when open) */}
        <Tooltip label={open ? "Close options" : "More options (Folders, Filters, Sort)"}>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close options" : "More options (Folders, Filters, Sort)"}
            onClick={toggleOpen}
            className={cn(
              "relative flex size-10 sm:size-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer active:scale-95 select-none",
              open || hasActiveState
                ? "border-black/[0.12] dark:border-white/[0.18] bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-2xs"
                : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
            )}
          >
            {open ? (
              <X size={18} className="transition-transform duration-200" />
            ) : (
              <>
                <MoreHorizontal className="size-5 sm:size-4" />
                {hasActiveState && (
                  <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 size-2 sm:size-1.5 rounded-full bg-orange-500 dark:bg-orange-400 ring-1.5 sm:ring-1 ring-background" />
                )}
              </>
            )}
          </button>
        </Tooltip>

        {/* Vertical Icon Stack popping above the More button without any background or container */}
        {open && activeTab === "none" && (
          <div
            className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-2.5 z-50 pointer-events-auto"
            role="toolbar"
            aria-label="Quick actions"
          >
            {/* 1. Folders Icon Button */}
            <Tooltip label={sidebarOpen ? "Close collections" : "Collections & Folders"}>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                  setOpen(false);
                }}
                style={{ animationDelay: "0ms" }}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-lg animate-speed-dial-pop",
                  "backdrop-blur-xl bg-background/90 dark:bg-[#141416]/95",
                  isNavActive
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-orange-500/10"
                    : sidebarOpen
                      ? "border-black/20 dark:border-white/20 bg-black/[0.08] dark:bg-white/[0.12] text-foreground"
                      : "border-black/[0.1] dark:border-white/[0.14] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                )}
                aria-label={sidebarOpen ? "Close collections" : "Collections & Folders"}
              >
                {sidebarOpen ? (
                  <FolderOpen size={18} className={isNavActive ? "text-orange-600 dark:text-orange-400" : "text-foreground"} />
                ) : (
                  <Folder size={18} className={isNavActive ? "text-orange-600 dark:text-orange-400" : ""} />
                )}
                {isNavActive && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-orange-500 dark:bg-orange-400 ring-2 ring-background" />
                )}
              </button>
            </Tooltip>

            {/* 2. Filter Icon Button */}
            <Tooltip label={activeFilterCount > 0 ? `Filters (${activeFilterCount} active)` : "Filters"}>
              <button
                type="button"
                onClick={() => setActiveTab("filter")}
                style={{ animationDelay: "35ms" }}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-lg animate-speed-dial-pop",
                  "backdrop-blur-xl bg-background/90 dark:bg-[#141416]/95",
                  activeFilterCount > 0
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-orange-500/10 font-semibold"
                    : "border-black/[0.1] dark:border-white/[0.14] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                )}
                aria-label="Filter resources"
              >
                <SlidersHorizontal size={18} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-orange-500 text-[9.5px] font-bold text-white shadow-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* 3. Sort Icon Button */}
            <Tooltip label={`Sort: ${currentSortLabel}`}>
              <button
                type="button"
                onClick={() => setActiveTab("sort")}
                style={{ animationDelay: "70ms" }}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-lg animate-speed-dial-pop",
                  "backdrop-blur-xl bg-background/90 dark:bg-[#141416]/95",
                  sort !== "recent"
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-orange-500/10"
                    : "border-black/[0.1] dark:border-white/[0.14] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                )}
                aria-label={`Sort: ${currentSortLabel}`}
              >
                <ArrowUpDown size={18} />
                {sort !== "recent" && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-orange-500 dark:bg-orange-400 ring-2 ring-background" />
                )}
              </button>
            </Tooltip>

            {/* 4. Select Button (Admin Only) */}
            {isAdmin && (
              <Tooltip label={isSelectMode ? "Exit selection" : "Select multiple resources"}>
                <button
                  type="button"
                  onClick={() => {
                    if (isSelectMode) {
                      clearSelection();
                    } else {
                      setSelectMode(true);
                    }
                    setOpen(false);
                  }}
                  style={{ animationDelay: "105ms" }}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-lg animate-speed-dial-pop",
                    "backdrop-blur-xl bg-background/90 dark:bg-[#141416]/95",
                    isSelectMode || selectedResourceIds.length > 0
                      ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-orange-500/10"
                      : "border-black/[0.1] dark:border-white/[0.14] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                  )}
                  aria-label="Select resources"
                >
                  <SquareCheck size={18} />
                  {selectedResourceIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-orange-500 text-[9.5px] font-bold text-white shadow-xs">
                      {selectedResourceIds.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Frosted Portal Popup ONLY when Filter or Sort subpanel is chosen */}
      {mounted && open && activeTab !== "none" &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label={activeTab === "filter" ? "Filter options" : "Sort options"}
            style={{
              bottom: coords ? `${coords.bottom}px` : "5.5rem",
            }}
            className="fixed z-50 left-1/2 -translate-x-1/2 w-[min(calc(100vw-24px),21.5rem)] rounded-3xl border border-black/[0.08] dark:border-white/[0.14] frosted-popup p-3.5 animate-popup-from-below shadow-2xl"
          >
            {/* Header: Back Button + Title + Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08] dark:border-white/[0.1] mb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("none")}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  aria-label="Back to options"
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="text-[13px] font-semibold text-foreground">
                  {activeTab === "filter" ? "Filter Resources" : "Sort Resources"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setActiveTab("none");
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Subpanel: Filter Options */}
            {activeTab === "filter" && (
              <div className="space-y-3 animate-in fade-in-0 duration-150 text-[12.5px] pt-1 pb-0.5">
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
                    className={cn(
                      "h-9.5 w-full rounded-full border px-3.5 text-[12.5px] focus:outline-none transition-colors",
                      filters.type
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 font-medium"
                        : "border-black/[0.08] dark:border-white/[0.12] bg-background/80 text-foreground",
                    )}
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
                      className="rounded border-border accent-orange-500 dark:accent-orange-500 cursor-pointer"
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
                      className="rounded border-border accent-orange-500 dark:accent-orange-500 cursor-pointer"
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
                            "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors cursor-pointer",
                            active
                              ? "border-orange-500/50 bg-orange-500/20 text-orange-700 dark:border-orange-400/50 dark:bg-orange-400/25 dark:text-orange-300 font-medium shadow-2xs"
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
                      className="text-[11.5px] text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subpanel: Sort Options */}
            {activeTab === "sort" && (
              <div className="flex flex-col gap-0.5 animate-in fade-in-0 duration-150 pt-1 pb-0.5">
                <span className="mb-1 px-2 text-[11.5px] font-medium text-muted-foreground">
                  Sort resources by
                </span>
                {sorts.map((item) => {
                  const isSelected = sort === item.id;
                  const isCustomSort = isSelected && item.id !== "recent";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSort(item.id);
                        setOpen(false);
                        setActiveTab("none");
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-full px-3.5 py-2.5 text-left text-[13px] transition-colors cursor-pointer",
                        isCustomSort
                          ? "bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-400 font-medium"
                          : isSelected
                            ? "bg-black/[0.04] dark:bg-white/[0.06] text-foreground font-medium"
                            : "text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground",
                      )}
                    >
                      <span>{item.label}</span>
                      {isSelected && (
                        <Check
                          size={15}
                          className={isCustomSort ? "text-orange-600 dark:text-orange-400" : "text-foreground"}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
