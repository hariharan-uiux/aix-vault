"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { categoryById, getResourcePricing, typeBySlug } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import type { Resource } from "@/types";
import { ArrowUpRight, Check, Star } from "lucide-react";
import { useRef } from "react";

function useLongPress({
  onLongPress,
  disabled = false,
}: {
  onLongPress: (e: { clientX: number; clientY: number }) => void;
  disabled?: boolean;
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(() => {
      onLongPress({ clientX: touch.clientX, clientY: touch.clientY });
      timerRef.current = null;
    }, 500);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!startPosRef.current || !timerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPosRef.current.x);
    const dy = Math.abs(touch.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

function PricingBadge({
  pricing,
  className,
}: {
  pricing: "Free" | "Freemium";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 sm:h-5.5 shrink-0 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-subtle-background px-2 text-[10.5px] sm:text-[11px] font-medium tracking-tight text-muted-foreground select-none",
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
  const { isAdmin, isSelectMode, selectedResourceIds, toggleSelectResource, toggleRecommendResource } = useVault();
  const pricing = getResourcePricing(resource);
  const typeObj = typeBySlug(resource.type);
  const isChecked = selectedResourceIds.includes(resource.id);

  const longPressProps = useLongPress({
    disabled: !isAdmin || !onContextMenu,
    onLongPress: (pos) => {
      onContextMenu?.({
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: pos.clientX,
        clientY: pos.clientY,
      } as unknown as React.MouseEvent, resource);
    },
  });

  const handleClick = () => {
    if (isAdmin && isSelectMode) {
      toggleSelectResource(resource.id);
    } else {
      onSelect(resource.id);
    }
  };

  return (
    <div
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      {...longPressProps}
      className={cn(
        "group flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors duration-[120ms] hover:bg-subtle-background sm:px-4 sm:py-3",
        isChecked && "bg-orange-500/[0.06] border-orange-500/40",
        selected && !isChecked && "bg-subtle-background",
      )}
    >
      {/* Admin Selection Checkbox */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectResource(resource.id);
          }}
          aria-label={isChecked ? `Deselect ${resource.name}` : `Select ${resource.name}`}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 cursor-pointer -mr-1",
            isChecked
              ? "bg-orange-500 border-orange-500 text-white shadow-xs scale-100 opacity-100"
              : isSelectMode
                ? "border-border bg-subtle-background text-transparent opacity-100 hover:border-foreground/40 hover:bg-background"
                : "border-border/80 bg-background/80 text-transparent opacity-0 group-hover:opacity-100 hover:border-foreground/40",
          )}
        >
          <Check size={12} strokeWidth={3} className={cn(isChecked ? "text-white" : "opacity-0")} />
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none cursor-pointer"
      >
        <ResourceIcon resource={resource} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium tracking-tight text-foreground sm:text-[15px]">
              {resource.name}
            </span>
            {typeObj && (
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground/75">
                • {typeObj.name}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <PricingBadge pricing={pricing} />

        {/* Admin Recommendation Star (Only shown if recommended) */}
        {resource.isRecommended && (
          <button
            type="button"
            onClick={(e) => {
              if (isAdmin) {
                toggleRecommendResource(resource.id, e);
              } else {
                e.stopPropagation();
              }
            }}
            title={isAdmin ? "Admin recommended (Click to remove)" : "Admin recommended"}
            aria-label="Admin recommended"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background text-orange-500 dark:text-orange-400 transition-all duration-150 outline-none focus:outline-none",
              isAdmin ? "cursor-pointer active:scale-90 hover:border-foreground/30 hover:bg-subtle-background/80" : "cursor-default",
            )}
          >
            <Star
              size={13}
              className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400 scale-105"
            />
          </button>
        )}

        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Visit ${resource.name}`}
          aria-label={`Visit ${resource.name}`}
          onClick={(e) => e.stopPropagation()}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background text-muted-foreground transition-all hover:border-foreground/30 hover:bg-foreground hover:text-background cursor-pointer"
        >
          <ArrowUpRight size={13} />
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
  const { isAdmin, isSelectMode, selectedResourceIds, toggleSelectResource, toggleRecommendResource } = useVault();
  const pricing = getResourcePricing(resource);
  const typeObj = typeBySlug(resource.type);
  const category = categoryById(resource.categoryId);
  const isChecked = selectedResourceIds.includes(resource.id);

  const longPressProps = useLongPress({
    disabled: !isAdmin || !onContextMenu,
    onLongPress: (pos) => {
      onContextMenu?.({
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: pos.clientX,
        clientY: pos.clientY,
      } as unknown as React.MouseEvent, resource);
    },
  });

  const handleClick = () => {
    if (isAdmin && isSelectMode) {
      toggleSelectResource(resource.id);
    } else {
      onSelect(resource.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      {...longPressProps}
      className={cn(
        "group relative flex min-h-[108px] sm:min-h-[118px] w-full cursor-pointer flex-col justify-between border-b border-r border-border dark:border-white/[0.08] p-3 sm:p-3.5 text-left transition-colors duration-[140ms] hover:bg-subtle-background/90 focus:outline-none select-none",
        "xl:before:pointer-events-none xl:before:absolute xl:before:right-full xl:before:w-[100vw] xl:before:bottom-0 xl:before:h-px xl:before:bg-border dark:xl:before:bg-white/[0.08]",
        "xl:after:pointer-events-none xl:after:absolute xl:after:left-full xl:after:w-[100vw] xl:after:bottom-0 xl:after:h-px xl:after:bg-border dark:xl:after:bg-white/[0.08]",
        isChecked && "bg-orange-500/[0.06] ring-2 ring-inset ring-orange-500/70 z-10",
        selected && !isChecked && "bg-subtle-background ring-1 ring-inset ring-orange-500/60 dark:ring-orange-400/60 z-10",
      )}
    >
      {/* Admin Selection Checkbox */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectResource(resource.id);
          }}
          aria-label={isChecked ? `Deselect ${resource.name}` : `Select ${resource.name}`}
          className={cn(
            "absolute top-2.5 right-2.5 z-20 flex size-5 items-center justify-center rounded-md border transition-all duration-150 cursor-pointer",
            isChecked
              ? "bg-orange-500 border-orange-500 text-white shadow-xs scale-100 opacity-100 ring-2 ring-orange-500/20"
              : isSelectMode
                ? "border-border bg-subtle-background text-transparent opacity-100 hover:border-foreground/40 hover:bg-background"
                : "border-border/80 bg-background/80 text-transparent opacity-0 group-hover:opacity-100 hover:border-foreground/40 hover:scale-105",
          )}
        >
          <Check size={12} strokeWidth={3} className={cn(isChecked ? "text-white" : "opacity-0")} />
        </button>
      )}

      {/* Top: Bigger Icon on left + Name & Tool Type to the right of the icon */}
      <div className="flex w-full min-w-0 items-center gap-2.5 sm:gap-3 pr-5">
        <ResourceIcon
          resource={resource}
          size={40}
          className="sm:hidden group-hover:scale-[1.03] transition-transform duration-200 shrink-0"
        />
        <ResourceIcon
          resource={resource}
          size={46}
          className="hidden sm:flex group-hover:scale-[1.03] transition-transform duration-200 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] sm:text-[14px] font-semibold tracking-tight text-foreground group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
            {resource.name}
          </h3>
          <p className="truncate text-[11px] sm:text-[11.5px] font-medium text-muted-foreground/75 mt-0.5">
            {typeObj?.name || category?.name || ""}
          </p>
        </div>
      </div>

      {/* Bottom: Pricing badge on left + Star & View Icon Button on right */}
      <div className="flex w-full items-center justify-between gap-2 pt-2">
        <PricingBadge pricing={pricing} />

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Admin Recommendation Star (Only shown if recommended) */}
          {resource.isRecommended && (
            <button
              type="button"
              onClick={(e) => {
                if (isAdmin) {
                  toggleRecommendResource(resource.id, e);
                } else {
                  e.stopPropagation();
                }
              }}
              title={isAdmin ? "Admin recommended (Click to remove)" : "Admin recommended"}
              aria-label="Admin recommended"
              className={cn(
                "flex size-6.5 sm:size-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background text-orange-500 dark:text-orange-400 transition-all duration-150 outline-none focus:outline-none",
                isAdmin ? "cursor-pointer active:scale-90 hover:border-foreground/30 hover:bg-subtle-background/80" : "cursor-default",
              )}
            >
              <Star
                size={12}
                className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400 scale-105"
              />
            </button>
          )}

          {/* View Icon-only Button */}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${resource.name}`}
            aria-label={`Visit ${resource.name}`}
            onClick={(e) => e.stopPropagation()}
            className="flex size-6.5 sm:size-7 shrink-0 items-center justify-center rounded-full border border-border bg-subtle-background text-muted-foreground transition-all hover:border-foreground/30 hover:bg-foreground hover:text-background cursor-pointer"
          >
            <ArrowUpRight size={12} />
          </a>
        </div>
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
  const { isAdmin, isSelectMode, selectedResourceIds, toggleSelectResource } = useVault();
  const isChecked = selectedResourceIds.includes(resource.id);

  const longPressProps = useLongPress({
    disabled: !isAdmin || !onContextMenu,
    onLongPress: (pos) => {
      onContextMenu?.({
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: pos.clientX,
        clientY: pos.clientY,
      } as unknown as React.MouseEvent, resource);
    },
  });

  const handleClick = () => {
    if (isAdmin && isSelectMode) {
      toggleSelectResource(resource.id);
    } else {
      onSelect(resource.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu?.(e, resource)}
      {...longPressProps}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-border bg-subtle-background/40 px-3 py-1.5 text-[12px] hover:bg-subtle-background sm:text-[13px] transition-colors cursor-pointer select-none",
        isChecked && "bg-orange-500/[0.08] border-orange-500/50 text-foreground font-medium",
        selected && !isChecked && "bg-subtle-background border-orange-500/50 text-foreground font-medium",
      )}
    >
      {/* Admin Selection Checkbox */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectResource(resource.id);
          }}
          aria-label={isChecked ? `Deselect ${resource.name}` : `Select ${resource.name}`}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-all cursor-pointer -ml-0.5 mr-0.5",
            isChecked
              ? "bg-orange-500 border-orange-500 text-white"
              : isSelectMode
                ? "border-border bg-background text-transparent"
                : "border-border/80 bg-background/80 text-transparent opacity-0 group-hover:opacity-100",
          )}
        >
          <Check size={10} strokeWidth={3} className={cn(isChecked ? "text-white" : "opacity-0")} />
        </button>
      )}

      <ResourceIcon resource={resource} size={24} />
      <span className="font-medium text-foreground">{resource.name}</span>
      {resource.isRecommended && (
        <Star
          size={12}
          className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400 shrink-0"
        />
      )}
    </div>
  );
}
