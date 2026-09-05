"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { useVault } from "@/lib/vault/store";
import { matchesQuery } from "@/lib/search";
import { categoryById, getResourcePricing } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { Check, Folder, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function FolderAddToolsDialog() {
  const {
    folderAddOpen,
    setFolderAddOpen,
    navigation,
    collections,
    resources,
    collectionResourceIds,
    addToCollection,
    removeResourcesFromCollection,
    isAdmin,
  } = useVault();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "available" | "in_folder">("all");
  const [hoveredRemoveId, setHoveredRemoveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCollectionId = navigation.kind === "collection" ? navigation.collectionId : null;
  const currentFolder = collections.find((c) => c.id === activeCollectionId);
  const folderName = currentFolder?.name || "Folder";

  const folderResourceIds = useMemo(() => {
    if (!activeCollectionId) return new Set<string>();
    return new Set(collectionResourceIds(activeCollectionId));
  }, [activeCollectionId, collectionResourceIds]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (folderAddOpen) {
      setQuery("");
      setTab("all");
      setHoveredRemoveId(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [folderAddOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!folderAddOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFolderAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [folderAddOpen, setFolderAddOpen]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const inFolder = folderResourceIds.has(resource.id);

      // Tab filter
      if (tab === "available" && inFolder) return false;
      if (tab === "in_folder" && !inFolder) return false;

      // Query filter
      if (!trimmed) return true;

      const directMatch = matchesQuery(resource, trimmed);
      if (directMatch) return true;

      const category = categoryById(resource.categoryId);
      if (category?.name.toLowerCase().includes(trimmed)) return true;

      if (resource.domain.toLowerCase().includes(trimmed)) return true;
      if (resource.description?.toLowerCase().includes(trimmed)) return true;

      return false;
    });
  }, [resources, folderResourceIds, tab, query]);

  const [mounted, setMounted] = useState(folderAddOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (folderAddOpen) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [folderAddOpen]);

  if (!mounted || !activeCollectionId || !isAdmin) {
    return null;
  }

  const allCount = resources.length;
  const inFolderCount = folderResourceIds.size;
  const availableCount = Math.max(0, allCount - inFolderCount);

  const handleToggle = (resourceId: string) => {
    if (!activeCollectionId) return;
    if (folderResourceIds.has(resourceId)) {
      removeResourcesFromCollection([resourceId], activeCollectionId);
    } else {
      addToCollection(resourceId, activeCollectionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setFolderAddOpen(false)}
        aria-hidden="true"
      />

      {/* Centered Bottom Sheet Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Add tools to ${folderName}`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className={cn(
          "relative z-10 flex w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex-col",
          "rounded-t-[28px] sm:rounded-t-[32px] border-t sm:border-x border-border/80 dark:border-white/12",
          "bg-background/95 dark:bg-[#121318]/95 backdrop-blur-2xl shadow-[0_-12px_44px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_44px_rgba(0,0,0,0.7)]",
          "h-[88dvh] max-h-[88dvh] will-change-transform",
          "transition-all duration-[320ms]",
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-90",
        )}
      >
        {/* Pull Handle */}
        <div className="mx-auto mt-2.5 -mb-0.5 h-1.5 w-10 rounded-full bg-muted-foreground/30 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-white/10 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Folder size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
                Add Tools to <span className="text-orange-500">{folderName}</span>
              </h2>
              <p className="text-[11.5px] text-muted-foreground truncate">
                Select from your uploaded tools to add or remove them
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFolderAddOpen(false)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-subtle-background hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="border-b border-border/80 bg-subtle-background/40 p-3 sm:px-5 space-y-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search uploaded tools by name, category, domain..."
              className="w-full h-9 pl-9 pr-16 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                tab === "all"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
              )}
            >
              All ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("available")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                tab === "available"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
              )}
            >
              Available ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("in_folder")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                tab === "in_folder"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
              )}
            >
              In Folder ({inFolderCount})
            </button>
          </div>
        </div>

        {/* List of Tools */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 divide-y divide-border/40 min-h-[220px]">
          {filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              {query ? (
                <>
                  <p className="text-[13.5px] font-medium text-foreground">No tools match &ldquo;{query}&rdquo;</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Try searching with another keyword or clear the search.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-3 text-[12px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    Clear search query
                  </button>
                </>
              ) : tab === "available" ? (
                <>
                  <p className="text-[13.5px] font-medium text-foreground">All tools are in this folder</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    All {allCount} uploaded tools have already been added to &ldquo;{folderName}&rdquo;.
                  </p>
                </>
              ) : tab === "in_folder" ? (
                <>
                  <p className="text-[13.5px] font-medium text-foreground">No tools in this folder yet</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Switch to &ldquo;Available&rdquo; or &ldquo;All&rdquo; tab above to add tools.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[13.5px] font-medium text-foreground">No uploaded tools found</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Upload some tools to the vault first to add them here.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredResources.map((resource) => {
              const inFolder = folderResourceIds.has(resource.id);
              const category = categoryById(resource.categoryId);
              const pricing = getResourcePricing(resource);
              const isHoveredRemove = hoveredRemoveId === resource.id;

              return (
                <div
                  key={resource.id}
                  className="flex items-center justify-between gap-3 py-2 px-2 sm:px-3 rounded-xl hover:bg-subtle-background/70 transition-colors group"
                >
                  {/* Tool info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ResourceIcon resource={resource} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground truncate">
                          {resource.name}
                        </span>
                        {pricing ? (
                          <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.2 rounded border border-border/70 text-muted-foreground">
                            {pricing}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground truncate mt-0.5">
                        <span className="truncate">{resource.domain}</span>
                        {category && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="truncate">{category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add / Added icon-only button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(resource.id)}
                    onMouseEnter={() => {
                      if (inFolder) setHoveredRemoveId(resource.id);
                    }}
                    onMouseLeave={() => {
                      if (isHoveredRemove) setHoveredRemoveId(null);
                    }}
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer active:scale-90 select-none shadow-xs",
                      inFolder
                        ? isHoveredRemove
                          ? "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400"
                          : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500",
                    )}
                    title={inFolder ? "Remove from folder" : `Add ${resource.name} to folder`}
                    aria-label={inFolder ? `Remove ${resource.name} from folder` : `Add ${resource.name} to folder`}
                  >
                    {inFolder ? (
                      isHoveredRemove ? (
                        <X size={14} strokeWidth={2.4} />
                      ) : (
                        <Check size={14} strokeWidth={2.4} />
                      )
                    ) : (
                      <Plus size={15} strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-subtle-background/30 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <span className="text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">{inFolderCount}</span> of {allCount} tools in this folder
          </span>
          <button
            type="button"
            onClick={() => setFolderAddOpen(false)}
            className="rounded-full border border-black/10 dark:border-white/12 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-orange-500 hover:text-white hover:border-orange-500 text-foreground px-4 py-1.5 text-[12px] font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
