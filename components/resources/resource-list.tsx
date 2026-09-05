"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import {
  ResourceCompactItem,
  ResourceGridCard,
  ResourceRow,
} from "@/components/resources/resource-row";
import { Skeleton } from "@/components/ui/skeleton";
import { getResourcePricing } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import type { Resource, ViewMode } from "@/types";
import { Pencil, Plus, SquareCheck, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

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
  loading?: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    deleteResource,
    updateResource,
    toggleRecommendResource,
    isAdmin,
    selectedResourceIds,
    toggleSelectResource,
    setAddOpen,
    setFolderAddOpen,
    navigation,
  } = useVault();

  const [contextMenu, setContextMenu] = useState<{
    resource: Resource;
    x: number;
    y: number;
  } | null>(null);

  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editPricing, setEditPricing] = useState<"Free" | "Freemium">("Freemium");
  const [editRecommended, setEditRecommended] = useState(false);

  useEffect(() => {
    if (!contextMenu && !editingResource) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setEditingResource(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contextMenu, editingResource]);

  const handleContextMenu = (e: React.MouseEvent, resource: Resource) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const x = Math.max(12, Math.min(e.clientX, window.innerWidth - 230));
    const y = Math.max(12, Math.min(e.clientY, window.innerHeight - 340));
    setContextMenu({ resource, x, y });
  };

  const handleStartEdit = (resource: Resource) => {
    if (!isAdmin) return;
    setEditingResource(resource);
    setEditName(resource.name);
    setEditUrl(resource.url);
    setEditPricing(getResourcePricing(resource));
    setEditRecommended(Boolean(resource.isRecommended));
    setContextMenu(null);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin || !editingResource) return;
    const trimmedName = editName.trim();
    const trimmedUrl = editUrl.trim();
    let domain = editingResource.domain;
    try {
      if (trimmedUrl) {
        domain = new URL(
          trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`,
        ).hostname.replace(/^www\./, "");
      }
    } catch {
      // Keep existing domain on invalid URL
    }

    updateResource(editingResource.id, {
      name: trimmedName || editingResource.name,
      url: trimmedUrl || editingResource.url,
      domain,
      pricing: editPricing,
      isRecommended: editRecommended,
    });
    setEditingResource(null);
  };

  if (loading) {
    return (
      <div className="w-full">
        {view === "grid" && (
          <div className="w-full border-y border-border dark:border-white/[0.08] -mt-px bg-transparent">
            <div className="-mr-px -mb-px grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 border-l border-r border-border dark:border-white/[0.08]">
              {Array.from({ length: 18 }).map((_, index) => (
                <div
                  key={index}
                  className="relative flex min-h-[108px] sm:min-h-[118px] w-full flex-col justify-between border-b border-r border-border bg-subtle-background/10 p-3 sm:p-3.5 xl:before:pointer-events-none xl:before:absolute xl:before:right-full xl:before:w-[100vw] xl:before:bottom-0 xl:before:h-px xl:before:bg-border xl:after:pointer-events-none xl:after:absolute xl:after:left-full xl:after:w-[100vw] xl:after:bottom-0 xl:after:h-px xl:after:bg-border"
                >
                  {/* Top: Icon + Name & Subtitle skeletons to the right */}
                  <div className="flex w-full items-center gap-2.5 sm:gap-3">
                    <Skeleton className="size-10 sm:size-11.5 shrink-0 rounded-[14px]" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <Skeleton className="h-4 w-24 sm:w-32 rounded-md" />
                      <Skeleton className="h-3 w-16 sm:w-20 rounded-md opacity-60" />
                    </div>
                  </div>

                  {/* Bottom: Pricing badge + View icon button skeleton */}
                  <div className="flex w-full items-center justify-between gap-2 pt-2">
                    <Skeleton className="h-5 w-12 sm:w-14 rounded-full" />
                    <Skeleton className="size-6.5 sm:size-7 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "compact" && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 18 }).map((_, index) => (
              <div
                key={index}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-subtle-background/30 px-3 py-1.5"
              >
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3.5 w-16 sm:w-20 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {view === "list" && (
          <div className="overflow-hidden rounded-2xl border border-border">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2.5 sm:px-4 sm:py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="size-10 shrink-0 rounded-xl" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-36 sm:w-48 rounded-md" />
                    <Skeleton className="h-3 w-48 sm:w-72 rounded-md opacity-60" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="px-4 py-16 text-center sm:px-6 sm:py-20 flex flex-col items-center">
        <p className="text-[14px] font-medium sm:text-[15px]">No resources found.</p>
        <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">
          {isAdmin ? "Get started by adding tools to this collection." : "No resources added yet."}
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (navigation.kind === "collection") {
                setFolderAddOpen(true);
              } else {
                setAddOpen(true);
              }
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/12 bg-foreground text-background hover:bg-orange-500 hover:text-white px-4 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer shadow-xs active:scale-95 select-none"
          >
            <Plus size={15} strokeWidth={2.2} />
            <span>{navigation.kind === "collection" ? "Add Existing Tools" : "Add Tool"}</span>
          </button>
        )}
      </div>
    );
  }

  const activeContextMenuResource = contextMenu
    ? resources.find((r) => r.id === contextMenu.resource.id) ?? contextMenu.resource
    : null;
  const activePricing = activeContextMenuResource
    ? getResourcePricing(activeContextMenuResource)
    : "Freemium";

  return (
    <>
      {view === "grid" && (
        <div className="w-full border-y border-border dark:border-white/[0.08] -mt-px bg-transparent">
          <div className="-mr-px -mb-px grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 border-l border-r border-border dark:border-white/[0.08]">
            {resources.map((resource) => (
              <ResourceGridCard
                key={resource.id}
                resource={resource}
                selected={selectedId === resource.id}
                onSelect={onSelect}
                onContextMenu={isAdmin ? handleContextMenu : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {view === "compact" && (
        <div className="flex flex-wrap gap-2">
          {resources.map((resource) => (
            <ResourceCompactItem
              key={resource.id}
              resource={resource}
              selected={selectedId === resource.id}
              onSelect={onSelect}
              onContextMenu={isAdmin ? handleContextMenu : undefined}
            />
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-border">
          {resources.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              selected={selectedId === resource.id}
              onSelect={onSelect}
              onContextMenu={isAdmin ? handleContextMenu : undefined}
            />
          ))}
        </div>
      )}

      {/* Right-click Context Menu (Admin Only) */}
      {isAdmin && contextMenu && activeContextMenuResource && (
        <>
          {/* Transparent Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
          />

          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 min-w-[200px] max-w-[min(calc(100vw-24px),240px)] overflow-hidden rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >

            {/* Change Pricing Selector */}
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Pricing</span>
                <span className="text-[10px] font-mono font-semibold text-foreground px-1.5 py-0.5 rounded-full bg-subtle-background border border-border">
                  {activePricing}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-subtle-background/80 p-0.5 border border-border/60">
                {(["Free", "Freemium"] as const).map((p) => {
                  const isActive = activePricing === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        updateResource(activeContextMenuResource.id, { pricing: p });
                        setContextMenu(null);
                      }}
                      className={cn(
                        "rounded-full py-1 text-[11px] font-medium transition-all cursor-pointer text-center",
                        isActive
                          ? "bg-background text-foreground font-semibold border border-border/80"
                          : "text-muted-foreground hover:text-foreground border border-transparent",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-1.5 h-px bg-border/60" />

            {/* Select Resource (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  toggleSelectResource(activeContextMenuResource.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
              >
                <SquareCheck size={13} className="text-muted-foreground" />
                <span>
                  {selectedResourceIds.includes(activeContextMenuResource.id)
                    ? "Deselect Resource"
                    : "Select Resource"}
                </span>
              </button>
            )}

            {/* Recommend Tool (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  toggleRecommendResource(activeContextMenuResource.id, e);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
              >
                <Star
                  size={13}
                  className={cn(
                    activeContextMenuResource.isRecommended
                      ? "fill-orange-500 text-orange-500"
                      : "text-muted-foreground",
                  )}
                />
                <span>
                  {activeContextMenuResource.isRecommended
                    ? "Remove Recommendation"
                    : "Recommend Resource"}
                </span>
              </button>
            )}

            {/* Edit Name & URL (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleStartEdit(activeContextMenuResource)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
              >
                <Pencil size={13} className="text-muted-foreground" />
                <span>Update Name & URL</span>
              </button>
            )}

            {/* Delete Resource (Admin Only) */}
            {isAdmin && (
              <>
                <div className="my-1.5 h-px bg-border/60" />
                <button
                  type="button"
                  onClick={() => {
                    deleteResource(activeContextMenuResource.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Resource</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Edit Details Dialog */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setEditingResource(null)}
          />

          {/* Dialog Card */}
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <ResourceIcon resource={editingResource} size={32} />
                <h3 className="text-[16px] font-semibold text-foreground">Edit Resource</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-subtle-background hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Resource Name
                </label>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-subtle-background px-3 py-2 text-[13px] text-foreground outline-none focus:outline-none focus:border-foreground"
                  placeholder="e.g. Figma"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Website URL
                </label>
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-subtle-background px-3 py-2 text-[13px] text-foreground outline-none focus:outline-none focus:border-foreground"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Pricing Model
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-full bg-subtle-background/80 p-1 border border-border/60">
                  {(["Free", "Freemium"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPricing(p)}
                      className={cn(
                        "rounded-full py-1.5 text-[12px] font-medium text-center transition-all cursor-pointer",
                        editPricing === p
                          ? "bg-background text-foreground font-semibold border border-border/80"
                          : "text-muted-foreground hover:text-foreground border border-transparent",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Recommendation Toggle */}
              <div
                onClick={() => setEditRecommended((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer select-none",
                  editRecommended
                    ? "border-orange-500/40 bg-orange-500/10 shadow-2xs shadow-orange-500/10"
                    : "border-border/80 bg-subtle-background/40 hover:bg-subtle-background/80",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border transition-all",
                      editRecommended
                        ? "border-border/80 bg-subtle-background text-orange-500 dark:text-orange-400"
                        : "border-border/80 bg-background text-muted-foreground",
                    )}
                  >
                    <Star
                      size={14}
                      className={cn(
                        "transition-transform",
                        editRecommended
                          ? "fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400 scale-105"
                          : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[12px] font-medium text-foreground block leading-tight">
                      Admin Recommendation
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5 leading-tight">
                      Show an orange star badge on cards
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    editRecommended ? "bg-orange-500" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      editRecommended ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-subtle-background hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
