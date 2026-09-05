"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, usePopover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { categoryById, tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import type { SortMode } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Code2,
  Layers,
  Palette,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export function PlatformToggle({ className }: { className?: string } = {}) {
  const { navigation, setNavigation } = useVault();

  const isFolder = navigation.kind === "collection" || navigation.kind === "saved";

  const isAll = isFolder
    ? !navigation.platform || navigation.platform === "all"
    : navigation.kind === "all";

  const isDev = isFolder
    ? navigation.platform === "development"
    : navigation.kind === "category" &&
      (navigation.categoryId === "development" ||
        Boolean(navigation.categoryId?.startsWith("development-")) ||
        categoryById(navigation.categoryId || "")?.parentId === "development");

  const isDesign = isFolder
    ? navigation.platform === "design"
    : navigation.kind === "category" &&
      (navigation.categoryId === "design" ||
        Boolean(navigation.categoryId?.startsWith("design-")) ||
        categoryById(navigation.categoryId || "")?.parentId === "design");

  const activeKey: "all" | "development" | "design" = isDev
    ? "development"
    : isDesign
      ? "design"
      : "all";

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<"all" | "development" | "design", HTMLButtonElement | null>>({
    all: null,
    development: null,
    design: null,
  });

  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const hasMountedRef = useRef(false);

  const updatePill = useCallback(() => {
    const target = tabRefs.current[activeKey];
    if (target) {
      setPillStyle({
        left: target.offsetLeft,
        width: target.offsetWidth,
        ready: true,
      });
    }
  }, [activeKey]);

  useEffect(() => {
    updatePill();
    const timer = requestAnimationFrame(() => {
      hasMountedRef.current = true;
    });

    const container = containerRef.current;
    if (!container) return () => cancelAnimationFrame(timer);

    const ro = new ResizeObserver(() => {
      updatePill();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(timer);
      ro.disconnect();
    };
  }, [updatePill]);

  const handleSelect = (platform: "all" | "development" | "design") => {
    const target = tabRefs.current[platform];
    if (target) {
      setPillStyle({
        left: target.offsetLeft,
        width: target.offsetWidth,
        ready: true,
      });
    }

    if (navigation.kind === "collection") {
      setNavigation({
        kind: "collection",
        collectionId: navigation.collectionId,
        platform,
      });
    } else if (navigation.kind === "saved") {
      setNavigation({
        kind: "saved",
        platform,
      });
    } else {
      if (platform === "all") {
        setNavigation({ kind: "all" });
      } else {
        setNavigation({ kind: "category", categoryId: platform });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-10 sm:h-8 flex-1 sm:flex-initial min-w-0 items-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] p-0.5 sm:p-0.5 shadow-2xs",
        className,
      )}
    >
      {/* Animated Sliding Highlight Pill */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0.5 rounded-full bg-background/95 dark:bg-neutral-900/95 shadow-xs",
          pillStyle.ready ? "opacity-100" : "opacity-0",
        )}
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
          transition: hasMountedRef.current
            ? "left 0.4s cubic-bezier(0.65, 0, 0.35, 1), width 0.4s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.2s ease"
            : "opacity 0.2s ease",
        }}
      />

      <button
        ref={(el) => {
          tabRefs.current.all = el;
        }}
        type="button"
        onClick={() => handleSelect("all")}
        className={cn(
          "relative z-10 flex h-9 sm:h-7 flex-1 sm:flex-initial min-w-0 items-center justify-center gap-1.5 rounded-full px-3 sm:px-3.5 text-[13px] font-medium transition-colors duration-300 ease-in-out cursor-pointer active:scale-95 select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border-0 bg-transparent",
          isAll
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Layers size={15} className="shrink-0 sm:size-[13px]" />
        <span className="shrink-0 whitespace-nowrap">All</span>
      </button>
      <button
        ref={(el) => {
          tabRefs.current.development = el;
        }}
        type="button"
        onClick={() => handleSelect("development")}
        className={cn(
          "relative z-10 flex h-9 sm:h-7 flex-1 sm:flex-initial min-w-0 items-center justify-center gap-1.5 rounded-full px-3 sm:px-3.5 text-[13px] font-medium transition-colors duration-300 ease-in-out cursor-pointer active:scale-95 select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border-0 bg-transparent",
          isDev
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Code2 size={15} className="shrink-0 sm:size-[13px]" />
        <span className="shrink-0 whitespace-nowrap">Dev</span>
      </button>
      <button
        ref={(el) => {
          tabRefs.current.design = el;
        }}
        type="button"
        onClick={() => handleSelect("design")}
        className={cn(
          "relative z-10 flex h-9 sm:h-7 flex-1 sm:flex-initial min-w-0 items-center justify-center gap-1.5 rounded-full px-3 sm:px-3.5 text-[13px] font-medium transition-colors duration-300 ease-in-out cursor-pointer active:scale-95 select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border-0 bg-transparent",
          isDesign
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Palette size={15} className="shrink-0 sm:size-[13px]" />
        <span className="shrink-0 whitespace-nowrap">Design</span>
      </button>
    </div>
  );
}

export const sorts: { id: SortMode; label: string }[] = [
  { id: "recent", label: "Recently Added" },
  { id: "name", label: "Name A–Z" },
];

function TypeSelectDropdown({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string | null) => void;
}) {
  const { resourceTypes } = useVault();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    return [
      { slug: "", name: "Any Type" },
      ...resourceTypes.map((t) => ({ slug: t.slug, name: t.name })),
    ];
  }, [resourceTypes]);

  const currentLabel = useMemo(() => {
    if (!value) return "Any Type";
    return resourceTypes.find((t) => t.slug === value)?.name ?? "Any Type";
  }, [value, resourceTypes]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.name.toLowerCase().includes(q));
  }, [options, query]);

  // Click outside container listener to collapse the dropdown
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Reset query when closing and auto-focus without browser square focus box
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else {
      setQuery("");
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-full border px-3.5 text-[12.5px] transition-colors cursor-pointer outline-none select-none",
          value
            ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 font-medium"
            : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
          open && !value && "border-black/20 dark:border-white/20 bg-black/[0.06] dark:bg-white/[0.08]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate font-medium">{currentLabel}</span>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {open && (
        <div
          className="mt-1.5 w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-background/95 dark:bg-[#18191e]/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/20 dark:shadow-black/60 animate-in fade-in-0 zoom-in-95 duration-150"
          role="listbox"
        >
          {/* Search filter input with smooth pill container and ZERO square box/outline */}
          <div className="p-1 pb-1.5">
            <div className="flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.05] px-2.5 py-1.5 transition-colors focus-within:border-black/20 dark:focus-within:border-white/20">
              <Search size={12} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                name="type-search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search types..."
                style={{
                  outline: "none",
                  boxShadow: "none",
                  border: "none",
                }}
                className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 border-none p-0 m-0 shadow-none focus:shadow-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer outline-none focus:outline-none"
                  title="Clear"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list of types */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 py-0.5 overscroll-contain pr-0.5 no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = (value ?? "") === opt.slug;
                const isRealType = Boolean(opt.slug);
                const isSelectedRealType = isSelected && isRealType;

                return (
                  <button
                    key={opt.slug || "any"}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.slug || null);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-xl text-left transition-colors cursor-pointer select-none outline-none focus:outline-none",
                      isSelectedRealType
                        ? "bg-orange-500/15 font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-400"
                        : isSelected
                          ? "bg-black/[0.05] dark:bg-white/[0.08] font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && (
                      <Check
                        size={13}
                        className={cn(
                          "shrink-0 ml-2",
                          isSelectedRealType
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-foreground",
                        )}
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-[11.5px] text-muted-foreground">
                No types found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterPopover({
  side = "top",
  align = "center",
  triggerClassName,
  iconOnly = true,
}: {
  side?: "top" | "bottom";
  align?: "left" | "right" | "center";
  triggerClassName?: string;
  iconOnly?: boolean;
} = {}) {
  const { filters, setFilters } = useVault();
  const activeCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0) +
    (filters.openSource ? 1 : 0);

  return (
    <Popover
      side={side}
      align={align}
      triggerClassName={({ open }) =>
        cn(
          iconOnly
            ? "size-8 p-0 justify-center rounded-full border transition-all cursor-pointer"
            : "rounded-full h-8 px-3 text-[12px] sm:text-[13px] border transition-all cursor-pointer",
          activeCount > 0
            ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-xs shadow-orange-500/10 dark:shadow-orange-400/10"
            : open
              ? "border-black/20 dark:border-white/20 bg-black/[0.08] dark:bg-white/[0.12] text-foreground"
              : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
          triggerClassName,
        )
      }
      contentClassName="w-[min(calc(100vw-24px),19rem)] sm:w-80"
      label={({ open }) => {
        const hasActive = activeCount > 0;
        return iconOnly ? (
          <Tooltip label={hasActive ? `Filters (${activeCount} active)` : "Filters"}>
            <span className="relative flex size-8 items-center justify-center">
              <SlidersHorizontal
                size={14}
                className={cn(
                  "transition-colors",
                  hasActive
                    ? "text-orange-600 dark:text-orange-400"
                    : open
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              />
              {hasActive && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </span>
          </Tooltip>
        ) : (
          <>
            <span className={cn("hidden sm:inline", hasActive && "text-orange-600 dark:text-orange-400 font-medium")}>
              Filters
            </span>
            <span className={cn("sm:hidden", hasActive && "text-orange-600 dark:text-orange-400 font-medium")}>
              Filter
            </span>
            {hasActive ? (
              <Badge className="h-4 min-w-4 justify-center px-1 py-0 text-[10px] bg-orange-500 text-white">
                {activeCount}
              </Badge>
            ) : (
              <ChevronDown size={12} className={hasActive ? "text-orange-600 dark:text-orange-400" : ""} />
            )}
          </>
        );
      }}
    >
      <div className="space-y-3 text-[13px]">
        <div>
          <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">Resource Type</span>
          <TypeSelectDropdown
            value={filters.type}
            onChange={(type) => setFilters({ ...filters, type })}
          />
        </div>
        <div className="flex items-center gap-4 text-[12.5px]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.free}
              onChange={(event) => setFilters({ ...filters, free: event.target.checked })}
              className="rounded border-border accent-orange-500 dark:accent-orange-500 cursor-pointer"
            />
            <span>Free</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.openSource}
              onChange={(event) =>
                setFilters({ ...filters, openSource: event.target.checked })
              }
              className="rounded border-border accent-orange-500 dark:accent-orange-500 cursor-pointer"
            />
            <span>Open Source</span>
          </label>
        </div>
        <div>
          <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">Tags</span>
          <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto overscroll-contain pr-1">
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
                    "rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors cursor-pointer",
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
        {activeCount > 0 && (
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
    </Popover>
  );
}

function SortMenuList({ className }: { className?: string } = {}) {
  const { sort, setSort } = useVault();
  const popover = usePopover();

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="mb-1 px-2.5 text-[11.5px] font-medium text-muted-foreground">
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
              popover.close();
            }}
            className={cn(
              "flex items-center justify-between rounded-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer",
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
                size={14}
                className={isCustomSort ? "text-orange-600 dark:text-orange-400" : "text-foreground"}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SortMenu({
  side = "top",
  align = "center",
  triggerClassName,
  iconOnly = true,
}: {
  side?: "top" | "bottom";
  align?: "left" | "right" | "center";
  triggerClassName?: string;
  iconOnly?: boolean;
} = {}) {
  const { sort } = useVault();
  const current = sorts.find((item) => item.id === sort)?.label ?? "Sort";
  const isSorted = sort !== "recent";

  return (
    <Popover
      side={side}
      align={align}
      triggerClassName={({ open }) =>
        cn(
          iconOnly
            ? "size-8 p-0 justify-center rounded-full border transition-all cursor-pointer"
            : "rounded-full h-8 px-3 text-[12px] sm:text-[13px] border transition-all cursor-pointer",
          isSorted
            ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-xs shadow-orange-500/10 dark:shadow-orange-400/10"
            : open
              ? "border-black/20 dark:border-white/20 bg-black/[0.08] dark:bg-white/[0.12] text-foreground"
              : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
          triggerClassName,
        )
      }
      label={({ open }) => {
        return iconOnly ? (
          <Tooltip label={`Sort: ${current}`}>
            <span className="relative flex size-8 items-center justify-center">
              <ArrowUpDown
                size={14}
                className={cn(
                  "transition-colors",
                  isSorted
                    ? "text-orange-600 dark:text-orange-400"
                    : open
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              />
              {isSorted && (
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-orange-500 dark:bg-orange-400 ring-2 ring-background" />
              )}
            </span>
          </Tooltip>
        ) : (
          <>
            <span className={cn("hidden sm:inline", isSorted && "text-orange-600 dark:text-orange-400 font-medium")}>{current}</span>
            <ChevronDown size={12} className={isSorted ? "text-orange-600 dark:text-orange-400" : ""} />
          </>
        );
      }}
    >
      <SortMenuList />
    </Popover>
  );
}
