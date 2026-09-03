"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, usePopover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import type { SortMode, ViewMode } from "@/types";
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
  SlidersHorizontal,
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
        "flex h-8 items-center rounded-full border border-border/80 bg-subtle-background/80 p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleSelect("all")}
        className={cn(
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px]",
          isAll
            ? "bg-background text-foreground font-medium"
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
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px]",
          isDev
            ? "bg-background text-foreground font-medium"
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
          "flex h-7 shrink-0 whitespace-nowrap items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 text-[12px] transition-all duration-[120ms] sm:text-[13px]",
          isDesign
            ? "bg-background text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Palette size={13} />
        <span>Design</span>
      </button>
    </div>
  );
}

const sorts: { id: SortMode; label: string }[] = [
  { id: "recent", label: "Recently Added" },
  { id: "name", label: "Name A–Z" },
  { id: "saved", label: "Most Saved" },
];

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
  const { filters, setFilters, resourceTypes } = useVault();
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
          ? "size-8 p-0 justify-center rounded-full"
          : "rounded-full h-8 px-3 text-[12px] sm:text-[13px]",
        activeCount > 0 && "text-foreground bg-subtle-background border-foreground/40",
        triggerClassName,
      )}
      contentClassName="w-[min(calc(100vw-24px),18rem)] sm:w-80"
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
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">Type</span>
          <select
            value={filters.type ?? ""}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value || null })
            }
            className="h-8 w-full rounded-full border border-border bg-background px-3"
          >
            <option value="">Any</option>
            {resourceTypes.map((type) => (
              <option key={type.id} value={type.slug}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.free}
            onChange={(event) => setFilters({ ...filters, free: event.target.checked })}
          />
          Free
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.openSource}
            onChange={(event) =>
              setFilters({ ...filters, openSource: event.target.checked })
            }
          />
          Open Source
        </label>
        <div>
          <p className="mb-1 text-[12px] text-muted-foreground">Tags</p>
          <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto">
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
                    "rounded-full border border-border px-2 py-0.5 text-[12px]",
                    active && "border-foreground bg-foreground text-background",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Popover>
  );
}

function SortMenuList() {
  const { sort, setSort } = useVault();
  const { close } = usePopover();

  return (
    <div className="flex min-w-[150px] flex-col gap-0.5">
      {sorts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setSort(item.id);
            close();
          }}
          className={cn(
            "flex items-center justify-between rounded-full px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-subtle-background",
            sort === item.id && "font-medium text-foreground",
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
  const shortLabel = sort === "recent" ? "Recent" : sort === "name" ? "A–Z" : "Saved";

  return (
    <Popover
      side={side}
      align={align}
      triggerClassName={cn(
        iconOnly
          ? "size-8 p-0 justify-center rounded-full"
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
            <span className="sm:hidden">{shortLabel}</span>{" "}
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
        "flex h-8 items-center rounded-full border border-border/80 bg-subtle-background/80 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Tooltip key={option.id} label={option.label}>
            <button
              type="button"
              aria-label={option.label}
              onClick={() => setView(option.id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-[120ms]",
                view === option.id && "bg-background text-foreground font-medium shadow-xs",
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
