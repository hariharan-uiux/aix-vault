"use client";

import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { childCategories, resourceTypes, tags, topCategories } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import type { SortMode, ViewMode } from "@/types";
import { Check, ChevronDown, LayoutList, Rows3, Grid2x2 } from "lucide-react";

const sorts: { id: SortMode; label: string }[] = [
  { id: "recent", label: "Recently Added" },
  { id: "name", label: "Name A–Z" },
  { id: "saved", label: "Most Saved" },
];

export function CategoryFilter() {
  const { navigation, setNavigation } = useVault();
  const parentId =
    navigation.kind === "category"
      ? navigation.categoryId.includes("-")
        ? navigation.categoryId.split("-")[0]
        : navigation.categoryId
      : null;

  if (!parentId) return null;

  const children = childCategories(parentId);
  const isParentAll =
    navigation.kind === "category" && navigation.categoryId === parentId;

  return (
    <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 sm:flex-wrap sm:overflow-visible">
      <FilterChip
        active={isParentAll}
        onClick={() => {
          setNavigation({ kind: "category", categoryId: parentId });
        }}
      >
        All {parentId === "development" ? "Dev" : "Design"}
      </FilterChip>
      {children.map((category) => (
        <FilterChip
          key={category.id}
          active={
            navigation.kind === "category" && navigation.categoryId === category.id
          }
          onClick={() =>
            setNavigation({ kind: "category", categoryId: category.id })
          }
        >
          {category.name}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border border-border px-2.5 text-[12px] text-muted-foreground transition-colors duration-[120ms] hover:text-foreground",
        active && "border-foreground bg-foreground text-background hover:text-background",
      )}
    >
      {children}
    </button>
  );
}

export function FilterPopover() {
  const { filters, setFilters } = useVault();
  const activeCount =
    (filters.type ? 1 : 0) +
    filters.tagIds.length +
    (filters.free ? 1 : 0) +
    (filters.openSource ? 1 : 0);

  return (
    <Popover
      label={
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
            className="h-8 w-full rounded-[6px] border border-border bg-background px-2"
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
          <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
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

export function SortMenu() {
  const { sort, setSort } = useVault();
  const current = sorts.find((item) => item.id === sort)?.label ?? "Sort";
  const shortLabel = sort === "recent" ? "Recent" : sort === "name" ? "A–Z" : "Saved";
  return (
    <Popover label={<>{<span className="hidden sm:inline">{current}</span>}<span className="sm:hidden">{shortLabel}</span> <ChevronDown size={12} /></>}>
      <div className="flex flex-col">
        {sorts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSort(item.id)}
            className="flex items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[13px] hover:bg-subtle-background"
          >
            {item.label}
            {sort === item.id ? <Check size={14} /> : null}
          </button>
        ))}
      </div>
    </Popover>
  );
}

export function ViewToggle() {
  const { view, setView } = useVault();
  const options: { id: ViewMode; label: string; icon: typeof LayoutList }[] = [
    { id: "list", label: "List", icon: LayoutList },
    { id: "grid", label: "Grid", icon: Grid2x2 },
    { id: "compact", label: "Compact", icon: Rows3 },
  ];
  return (
    <div className="flex rounded-[6px] border border-border p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Tooltip key={option.id} label={option.label}>
            <button
              type="button"
              aria-label={option.label}
              onClick={() => setView(option.id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-[4px] text-subtle-foreground",
                view === option.id && "bg-subtle-background text-foreground",
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
