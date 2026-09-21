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
  DollarSign,
  Layers,
  Palette,
  Search,
  SlidersHorizontal,
  Tag,
  Type,
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
          "pointer-events-none absolute inset-y-0.5 rounded-full bg-white shadow-sm",
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
            ? "text-black font-semibold"
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
            ? "text-black font-semibold"
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
            ? "text-black font-semibold"
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
  { id: "upvotes", label: "Most Upvoted" },
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
          className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.14] bg-background/95 dark:bg-[#18191e]/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/20 dark:shadow-black/60 animate-in fade-in-0 zoom-in-95 duration-150"
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
                      "flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-full text-left transition-colors cursor-pointer select-none outline-none focus:outline-none",
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

function TagsSelectDropdown({
  selectedTagIds,
  onChange,
}: {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedTagIds.length;

  const currentLabel = useMemo(() => {
    if (selectedCount === 0) return "All Tags";
    if (selectedCount === 1) {
      const tag = tags.find((t) => t.id === selectedTagIds[0]);
      return tag ? tag.name : "1 tag selected";
    }
    return `${selectedCount} tags selected`;
  }, [selectedTagIds, selectedCount]);

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [query]);

  // Click outside to collapse
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

  // Reset query when closing and auto-focus
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    } else {
      setQuery("");
    }
  }, [open]);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tId) => tId !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-full border px-3.5 text-[12.5px] transition-colors cursor-pointer outline-none select-none",
          selectedCount > 0
            ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 font-medium"
            : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.03] dark:bg-white/[0.05] text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
          open && selectedCount === 0 && "border-black/20 dark:border-white/20 bg-black/[0.06] dark:bg-white/[0.08]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="truncate font-medium">{currentLabel}</span>
          {selectedCount > 1 && (
            <span className="shrink-0 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
              {selectedCount}
            </span>
          )}
        </div>
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
          className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.14] bg-background/95 dark:bg-[#18191e]/95 backdrop-blur-xl p-2 shadow-xl shadow-black/20 dark:shadow-black/60 animate-in fade-in-0 zoom-in-95 duration-150"
          role="listbox"
        >
          {/* Search input with smooth pill container */}
          <div className="p-0.5 pb-2">
            <div className="flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.05] px-2.5 py-1.5 transition-colors focus-within:border-black/20 dark:focus-within:border-white/20">
              <Search size={12} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                name="tag-search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tags..."
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

          {/* Tag Pills Container */}
          <div className="max-h-36 overflow-y-auto overscroll-contain flex flex-wrap gap-1.5 p-1 no-scrollbar">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors cursor-pointer select-none inline-flex items-center gap-1",
                      active
                        ? "border-orange-500/50 bg-orange-500/20 text-orange-700 dark:border-orange-400/50 dark:bg-orange-400/25 dark:text-orange-300 font-medium shadow-2xs"
                        : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover:text-foreground",
                    )}
                  >
                    <span>{tag.name}</span>
                    {active && <Check size={11} className="shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-2.5 w-full text-center text-[11.5px] text-muted-foreground">
                No tags found
              </div>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="pt-1.5 mt-1 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between px-1">
              <span className="text-[10.5px] text-muted-foreground font-mono">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Clear all tags
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FilterSortContent({
  onClose,
}: {
  onClose?: () => void;
  showTitle?: boolean;
} = {}) {
  const { filters, setFilters, sort, setSort } = useVault();

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0);

  const isCustomSort = sort !== "upvotes";
  const totalActiveCount = activeFilterCount + (isCustomSort ? 1 : 0);

  return (
    <div className="space-y-3.5 text-[13px]">
      {/* Sort Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ArrowUpDown size={11} />
            Sort By
          </span>
          {isCustomSort && (
            <span className="text-[10.5px] font-mono font-medium text-orange-600 dark:text-orange-400">
              {sorts.find((s) => s.id === sort)?.label}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {sorts.map((item) => {
            const isSelected = sort === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSort(item.id)}
                className={cn(
                  "flex items-center justify-center rounded-full px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12px] font-medium transition-all cursor-pointer border select-none",
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold shadow-2xs"
                    : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-muted-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-foreground",
                )}
              >
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-black/[0.06] dark:bg-white/[0.08]" />

      {/* Filter Section: Pricing & License */}
      <div>
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <DollarSign size={11} />
          Pricing & License
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[11.5px] sm:text-[12px]">
          <button
            type="button"
            onClick={() => setFilters({ ...filters, free: filters.free === "free" ? null : "free" })}
            className={cn(
              "flex items-center justify-center rounded-full border px-2.5 sm:px-3 py-1.5 cursor-pointer select-none transition-colors",
              filters.free === "free"
                ? "border-orange-500/50 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-medium"
                : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">Free</span>
          </button>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, free: filters.free === "freemium" ? null : "freemium" })}
            className={cn(
              "flex items-center justify-center rounded-full border px-2.5 sm:px-3 py-1.5 cursor-pointer select-none transition-colors",
              filters.free === "freemium"
                ? "border-orange-500/50 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-medium"
                : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">Freemium</span>
          </button>
        </div>
      </div>

      {/* Filter Section: Resource Type */}
      <div>
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Type size={11} />
          Resource Type
        </span>
        <TypeSelectDropdown
          value={filters.type}
          onChange={(type) => setFilters({ ...filters, type })}
        />
      </div>

      {/* Filter Section: Tags */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag size={11} />
            Tags {filters.tagIds.length > 0 && `(${filters.tagIds.length})`}
          </span>
          {filters.tagIds.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, tagIds: [] })}
              className="text-[10.5px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear tags
            </button>
          )}
        </div>
        <TagsSelectDropdown
          selectedTagIds={filters.tagIds}
          onChange={(tagIds) => setFilters({ ...filters, tagIds })}
        />
      </div>

      {totalActiveCount > 0 && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setFilters({
                type: null,
                free: null,
                openSource: false,
                hasUpvotes: false,
                tagIds: [],
              });
              setSort("upvotes");
            }}
            className="text-[11.5px] font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer underline underline-offset-2"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}

export function FilterSortPopover({
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
  const { filters, sort } = useVault();
  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0);
  const isCustomSort = sort !== "upvotes";
  const totalActiveCount = activeFilterCount + (isCustomSort ? 1 : 0);
  const currentSortLabel = sorts.find((s) => s.id === sort)?.label ?? "Sort";

  return (
    <Popover
      side={side}
      align={align}
      triggerClassName={({ open }) =>
        cn(
          iconOnly
            ? "size-10 sm:size-8 p-0 justify-center rounded-full border transition-all cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none active:scale-95"
            : "rounded-full h-10 sm:h-8 px-3 text-[12px] sm:text-[13px] border transition-all cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none active:scale-95",
          totalActiveCount > 0
            ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-400 shadow-xs shadow-orange-500/10 dark:shadow-orange-400/10 font-semibold"
            : open
              ? "border-black/20 dark:border-white/20 bg-black/[0.08] dark:bg-white/[0.12] text-foreground"
              : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-foreground",
          triggerClassName,
        )
      }
      contentClassName="w-[min(calc(100vw-24px),18.5rem)] sm:w-[285px] p-3 sm:p-3.5"
      label={({ open }) => {
        const hasActive = totalActiveCount > 0;
        const tooltipLabel = hasActive
          ? isCustomSort && activeFilterCount > 0
            ? `Filter & Sort (${activeFilterCount} active, ${currentSortLabel})`
            : isCustomSort
              ? `Filter & Sort (${currentSortLabel})`
              : `Filter & Sort (${activeFilterCount} active)`
          : "Filter & Sort";

        return iconOnly ? (
          <Tooltip label={tooltipLabel}>
            <span className="relative flex size-10 sm:size-8 items-center justify-center">
              <SlidersHorizontal
                size={16}
                className={cn(
                  "sm:size-3.5 transition-colors",
                  hasActive
                    ? "text-orange-600 dark:text-orange-400"
                    : open
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              />
              {hasActive && (
                <span className="absolute top-1.5 right-1.5 sm:top-0 sm:right-0 flex size-3.5 sm:size-3 items-center justify-center rounded-full bg-orange-500 text-[8.5px] sm:text-[8px] font-bold text-white shadow-xs">
                  {totalActiveCount}
                </span>
              )}
            </span>
          </Tooltip>
        ) : (
          <>
            <span className={cn("hidden sm:inline", hasActive && "text-orange-600 dark:text-orange-400 font-medium")}>
              Filter & Sort
            </span>
            <span className={cn("sm:hidden", hasActive && "text-orange-600 dark:text-orange-400 font-medium")}>
              Filter & Sort
            </span>
            {hasActive ? (
              <Badge className="h-4 min-w-4 justify-center px-1 py-0 text-[10px] bg-orange-500 text-white">
                {totalActiveCount}
              </Badge>
            ) : (
              <ChevronDown size={12} className={hasActive ? "text-orange-600 dark:text-orange-400" : ""} />
            )}
          </>
        );
      }}
    >
      <FilterSortContent />
    </Popover>
  );
}

// Backward compatibility exports
export const FilterPopover = FilterSortPopover;
export const SortMenu = FilterSortPopover;
