"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { getResourcePricing } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";

export function PricingBadge({
  pricing,
  className,
}: {
  pricing: "Free" | "Freemium";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background px-2.5 text-[12px] font-medium text-muted-foreground",
        className,
      )}
    >
      {pricing}
    </span>
  );
}

export function ResourceRow({
  resource,
  selected,
  onSelect,
  onContextMenu,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, resource: Resource) => void;
}) {
  const pricing = getResourcePricing(resource);

  return (
    <div
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      className={cn(
        "group flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors duration-[120ms] hover:bg-subtle-background sm:px-4 sm:py-3",
        selected && "bg-subtle-background",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(resource.id)}
        className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 text-left focus:outline-none cursor-pointer"
      >
        <ResourceIcon resource={resource} size={32} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-tight text-foreground sm:text-[15px]">
          {resource.name}
        </span>
      </button>
      <div className="flex items-center gap-2">
        <PricingBadge pricing={pricing} />
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${resource.name}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background px-3 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground hover:text-background"
        >
          View
        </a>
      </div>
    </div>
  );
}

export function ResourceGridCard({
  resource,
  selected,
  onSelect,
  onContextMenu,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, resource: Resource) => void;
}) {
  const pricing = getResourcePricing(resource);

  return (
    <div
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      className={cn(
        "group relative flex h-full w-full flex-col justify-between gap-3 rounded-2xl border border-border p-3.5 transition-colors duration-[120ms] hover:bg-subtle-background sm:p-4",
        selected && "bg-subtle-background border-foreground/30",
      )}
    >
      {/* Top: Icon and Name together */}
      <button
        type="button"
        onClick={() => onSelect(resource.id)}
        className="flex w-full min-w-0 cursor-pointer items-center gap-2.5 sm:gap-3 text-left focus:outline-none"
        aria-label={`View details for ${resource.name}`}
      >
        <ResourceIcon resource={resource} size={32} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground sm:text-[14px]">
          {resource.name}
        </span>
      </button>

      {/* Bottom: Tag and View */}
      <div className="flex w-full items-center justify-between gap-2">
        <PricingBadge pricing={pricing} />
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background px-3 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground hover:text-background"
        >
          View
        </a>
      </div>
    </div>
  );
}

export function ResourceCompactItem({
  resource,
  selected,
  onSelect,
  onContextMenu,
}: {
  resource: Resource;
  selected?: boolean;
  onSelect: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, resource: Resource) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(resource.id)}
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] hover:bg-subtle-background sm:gap-2 sm:text-[13px]",
        selected && "bg-subtle-background",
      )}
    >
      <ResourceIcon resource={resource} size={32} />
      {resource.name}
    </button>
  );
}
