"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, usePopover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import type { SortMode, ViewMode } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Code2,
  Grid2x2,
  Layers,
  LayoutList,
  Palette,
  Rows3,
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
        navigation.categoryId.startsWith("development-"));

  const isDesign = isFolder
    ? navigation.platform === "design"
    : navigation.kind === "category" &&
      (navigation.categoryId === "design" ||
        navigation.categoryId.startsWith("design-"));

  const handleSelect = (platform: "all" | "development" | "design") => {
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
      className={cn(
        "flex h-8 items-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleSelect("all")}
        className={cn(
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px] cursor-pointer",
          isAll
            ? "bg-background/90 dark:bg-neutral-900/90 text-foreground font-medium shadow-xs border border-black/[0.06] dark:border-white/[0.1]"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Layers size={13} />
        <span>All</span>
      </button>
      <button
        type="button"
        onClick={() => handleSelect("development")}
        className={cn(
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px] cursor-pointer",
          isDev
            ? "bg-background/90 dark:bg-neutral-900/90 text-foreground font-medium shadow-xs border border-black/[0.06] dark:border-white/[0.1]"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Code2 size={13} />
        <span>Dev</span>
      </button>
      <button
        type="button"
        onClick={() => handleSelect("design")}
        className={cn(
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px] cursor-pointer",
          isDesign
            ? "bg-background/90 dark:bg-neutral-900/90 text-foreground font-medium shadow-xs border border-black/[0.06] dark:border-white/[0.1]"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Palette size={13} />
        <span>Design</span>
      </button>
    </div>
  );
}

export const sorts: { id: SortMode; label: string }[] = [
  { id: "recent", label: "Recently Added" },
  { id: "name", label: "Name A–Z" },
  { id: "saved", label: "Most Saved" },
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Position calculation: opens snugly above the trigger button
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const bottom = Math.round(window.innerHeight - rect.top + 6);
      const left = Math.round(rect.left);
      const width = Math.round(rect.width);
      setCoords({ bottom, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [open]);

  // Click outside & Escape listeners
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
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

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 text-[12.5px] text-foreground transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer outline-none select-none",
          open && "border-black/[0.16] dark:border-white/[0.2] bg-black/[0.06] dark:bg-white/[0.08]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {mounted && open && coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              bottom: `${coords.bottom}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 60,
            }}
            className="pointer-events-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.14] bg-background/95 dark:bg-[#141519]/95 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/25 dark:shadow-black/70 animate-in fade-in-0 zoom-in-95 duration-150"
            role="listbox"
          >
            {/* Search filter input */}
            <div className="relative flex items-center px-2.5 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] mb-1">
              <Search size={12} className="shrink-0 text-muted-foreground mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search types..."
                className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none border-none p-0 m-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Clear"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Scrollable list of types */}
            <div className="max-h-52 overflow-y-auto space-y-0.5 py-0.5 overscroll-contain pr-0.5 no-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = (value ?? "") === opt.slug;
                  return (
                    <button
                      key={opt.slug}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.slug || null);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-1.5 text-[12.5px] rounded-full text-left transition-colors cursor-pointer select-none",
                        isSelected
                          ? "bg-black/[0.06] dark:bg-white/[0.1] font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
                      )}
                    >
                      <span className="truncate">{opt.name}</span>
                      {isSelected && (
                        <Check size={13} className="shrink-0 text-foreground ml-2" />
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
          </div>,
          document.body,
        )}
    </>
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
      triggerClassName={cn(
        iconOnly
          ? "size-8 p-0 justify-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground"
          : "rounded-full h-8 px-3 text-[12px] sm:text-[13px]",
        activeCount > 0 && "text-foreground border-black/[0.12] dark:border-white/[0.18] bg-black/[0.08] dark:bg-white/[0.12] shadow-2xs",
        triggerClassName,
      )}
      contentClassName="w-[min(calc(100vw-24px),19rem)] sm:w-80"
      label={
        iconOnly ? (
          <Tooltip label={activeCount > 0 ? `Filters (${activeCount} active)` : "Filters"}>
            <span className="relative flex size-8 items-center justify-center">
              <SlidersHorizontal
                size={14}
                className={activeCount > 0 ? "text-foreground" : "text-muted-foreground"}
              />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                  {activeCount}
                </span>
              )}
            </span>
          </Tooltip>
        ) : (
          <>
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {activeCount > 0 ? (
              <Badge className="h-4 min-w-4 justify-center px-1 py-0 text-[10px]">
                {activeCount}
              </Badge>
            ) : (
              <ChevronDown size={12} />
            )}
          </>
        )
      }
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
              className="rounded border-border"
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
              className="rounded border-border"
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
              className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </Popover>
  );
}

export function SortMenuList({ className }: { className?: string } = {}) {
  const { sort, setSort } = useVault();
  const popover = usePopover();

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="mb-1 px-2.5 text-[11.5px] font-medium text-muted-foreground">
        Sort resources by
      </span>
      {sorts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setSort(item.id);
            popover.close();
          }}
          className={cn(
            "flex items-center justify-between rounded-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer",
            sort === item.id
              ? "bg-black/[0.06] dark:bg-white/[0.1] font-medium text-foreground"
              : "text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground",
          )}
        >
          <span>{item.label}</span>
          {sort === item.id ? <Check size={14} className="text-foreground" /> : null}
        </button>
      ))}
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

  return (
    <Popover
      side={side}
      align={align}
      triggerClassName={cn(
        iconOnly
          ? "size-8 p-0 justify-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground"
          : "rounded-full h-8 px-3 text-[12px] sm:text-[13px]",
        triggerClassName,
      )}
      label={
        iconOnly ? (
          <Tooltip label={`Sort: ${current}`}>
            <span className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground">
              <ArrowUpDown size={14} />
            </span>
          </Tooltip>
        ) : (
          <>
            <span className="hidden sm:inline">{current}</span>
            <ChevronDown size={12} />
          </>
        )
      }
    >
      <SortMenuList />
    </Popover>
  );
}

export function ViewToggle({ className }: { className?: string } = {}) {
  const { view, setView } = useVault();
  const options: { id: ViewMode; label: string; icon: typeof LayoutList }[] = [
    { id: "list", label: "List", icon: LayoutList },
    { id: "grid", label: "Grid", icon: Grid2x2 },
    { id: "compact", label: "Compact", icon: Rows3 },
  ];
  return (
    <div
      className={cn(
        "flex h-8 items-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = view === option.id;
        return (
          <Tooltip key={option.id} label={option.label}>
            <button
              type="button"
              aria-label={option.label}
              onClick={() => setView(option.id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-all duration-[120ms] cursor-pointer",
                active
                  ? "bg-background/90 dark:bg-neutral-900/90 text-foreground font-medium shadow-xs border border-black/[0.06] dark:border-white/[0.1]"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
              )}
            >
              <Icon size={14} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
