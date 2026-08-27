"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { categoryById, tagById, typeBySlug } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";
import { ExternalLink } from "lucide-react";

export function ResourceRow({
  resource,
  selected,
  onSelect,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
}) {
  const category = categoryById(resource.categoryId);
  const type = typeBySlug(resource.type);
  const tags = resource.tagIds
    .slice(0, 3)
    .map((id) => tagById(id)?.name ?? id)
    .join(" · ");

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-2 border-b border-border px-2 py-2.5 text-left transition-colors duration-[120ms] hover:bg-subtle-background sm:gap-3 sm:px-3 sm:py-3",
        selected && "bg-subtle-background",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(resource.id)}
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
      >
        <ResourceIcon resource={resource} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium tracking-tight sm:text-[15px]">
            {resource.name}
          </span>
          <span className="mt-0.5 hidden truncate text-[13px] text-muted-foreground sm:block">
            {resource.description}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-subtle-foreground sm:text-[12px]">
            {category?.name ?? resource.categoryId}
            {type ? ` · ${type.name}` : ""}
            {tags ? ` · ${tags}` : ""}
          </span>
        </span>
      </button>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${resource.name}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-subtle-foreground hover:bg-background hover:text-foreground sm:size-8"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export function ResourceGridCard({
  resource,
  selected,
  onSelect,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
}) {
  const category = categoryById(resource.categoryId);
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[8px] border border-border p-2.5 transition-colors duration-[120ms] hover:bg-subtle-background sm:gap-3 sm:p-3",
        selected && "bg-subtle-background",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(resource.id)}
        className="flex items-start gap-2.5 text-left sm:flex-col sm:items-start sm:gap-3"
      >
        <ResourceIcon resource={resource} size={32} />
        <span>
          <span className="block truncate text-[13px] font-medium sm:text-[14px]">{resource.name}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground sm:text-[12px]">
            {category?.name ?? resource.categoryId}
          </span>
        </span>
      </button>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground sm:text-[12px]"
      >
        Open <ExternalLink size={12} />
      </a>
    </div>
  );
}

export function ResourceCompactItem({
  resource,
  selected,
  onSelect,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(resource.id)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border border-border px-2 py-1.5 text-[12px] hover:bg-subtle-background sm:gap-2 sm:text-[13px]",
        selected && "bg-subtle-background",
      )}
    >
      <ResourceIcon resource={resource} size={32} />
      {resource.name}
    </button>
  );
}
