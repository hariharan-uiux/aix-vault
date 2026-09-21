"use client";

import { FilterSortContent } from "@/components/filters/filters";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import {
  ChevronLeft,
  MoreHorizontal,
  SlidersHorizontal,
  SquareCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function DockMoreMenu() {
  const {
    filters,
    sort,
    isAdmin,
    isSelectMode,
    setSelectMode,
    clearSelection,
    selectedResourceIds,
  } = useVault();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "filter-sort">("none");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; right: number; isMobile: boolean } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0) +
    (filters.openSource ? 1 : 0);

  const isCustomSort = sort !== "recent";
  const totalActiveCount = activeFilterCount + (isCustomSort ? 1 : 0);
  const hasActiveState = totalActiveCount > 0;

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

      const dockBottomDistance = window.innerHeight - rect.top + 8;
      const dockRightDistance = window.innerWidth - rect.right;

      setCoords({
        bottom: dockBottomDistance,
        right: dockRightDistance,
        isMobile,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [open]);

  // Click outside to collapse
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setOpen(false);
        setActiveTab("none");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeTab !== "none") {
          setActiveTab("none");
        } else {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, activeTab]);

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
      <div ref={menuRef} className="relative inline-flex items-center">
        {/* Three-dot Trigger Button (toggles to X when open) */}
        <Tooltip label={open ? "Close options" : "More options (Filter & Sort)"}>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close options" : "More options (Filter & Sort)"}
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
            {/* Filter & Sort Icon Button */}
            <Tooltip label={totalActiveCount > 0 ? `Filter & Sort (${totalActiveCount} active)` : "Filter & Sort"}>
              <button
                type="button"
                onClick={() => setActiveTab("filter-sort")}
                style={{ animationDelay: "0ms" }}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-lg animate-speed-dial-pop",
                  "backdrop-blur-xl bg-background/90 dark:bg-[#141416]/95",
                  totalActiveCount > 0
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-orange-500/10 font-semibold"
                    : "border-black/[0.1] dark:border-white/[0.14] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.08]",
                )}
                aria-label="Filter & Sort resources"
              >
                <SlidersHorizontal size={18} />
                {totalActiveCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-orange-500 text-[9.5px] font-bold text-white shadow-xs">
                    {totalActiveCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Select Button (Admin Only) */}
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
                  style={{ animationDelay: "40ms" }}
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

      {/* Frosted Portal Popup ONLY when Filter & Sort subpanel is chosen */}
      {mounted && open && activeTab !== "none" &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Filter and sort resources"
            style={{
              bottom: coords ? `${coords.bottom}px` : "5.5rem",
              left: 0,
              right: 0,
              marginLeft: "auto",
              marginRight: "auto",
            }}
            className="fixed z-50 w-[min(calc(100vw-24px),20rem)] sm:w-[290px] max-h-[calc(100vh-120px)] overflow-y-auto overscroll-contain rounded-xl border border-black/[0.08] dark:border-white/[0.14] frosted-popup p-3 sm:p-3.5 animate-popup-from-below shadow-2xl no-scrollbar"
          >
            {/* Header: Back Button + Title + Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08] dark:border-white/[0.1] mb-3">
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
                  Filter & Sort
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setActiveTab("none");
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <FilterSortContent
              onClose={() => {
                setOpen(false);
                setActiveTab("none");
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
