"use client";

import {
  ResourceCompactItem,
  ResourceGridCard,
  ResourceRow,
} from "@/components/resources/resource-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resource, ViewMode } from "@/types";

export function ResourceList({
  resources,
  view,
  selectedId,
  loading,
  onSelect,
}: {
  resources: Resource[];
  view: ViewMode;
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="px-2 py-3 sm:px-3 sm:py-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 border-b border-border py-2.5 sm:gap-3 sm:py-3">
            <Skeleton className="size-8 shrink-0 sm:size-10" />
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <Skeleton className="h-3.5 w-32 sm:h-4 sm:w-40" />
              <Skeleton className="h-3 w-48 sm:w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="text-[14px] font-medium sm:text-[15px]">No resources found.</p>
        <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">
          Try another search or filter.
        </p>
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 md:grid-cols-3 xl:grid-cols-4">
        {resources.map((resource) => (
          <ResourceGridCard
            key={resource.id}
            resource={resource}
            selected={selectedId === resource.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className="flex flex-wrap gap-2 p-4">
        {resources.map((resource) => (
          <ResourceCompactItem
            key={resource.id}
            resource={resource}
            selected={selectedId === resource.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {resources.map((resource) => (
        <ResourceRow
          key={resource.id}
          resource={resource}
          selected={selectedId === resource.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
