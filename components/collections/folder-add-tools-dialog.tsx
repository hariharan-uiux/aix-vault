"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { useVault } from "@/lib/vault/store";
import { matchesQuery } from "@/lib/search";
import { categoryById, getResourcePricing } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { Check, Plus, Search, X } from "lucide-react";
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
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (folderAddOpen) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [folderAddOpen, mounted]);

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
          "absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]",
          isClosing ? "animate-drawer-backdrop-out" : "animate-drawer-backdrop-in",
        )}
        onClick={() => setFolderAddOpen(false)}
        aria-hidden="true"
      />

      {/* Centered Bottom Sheet Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Add tools to folder"
        className={cn(
          "relative z-10 flex w-full max-w-full sm:max-w-2xl md:max-w-3xl flex-col",
          "rounded-t-xl border-t border-x border-black/10 dark:border-white/[0.14]",
          "bg-background dark:bg-[#121318] shadow-[0_-12px_44px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_44px_rgba(0,0,0,0.7)]",
          "h-[88dvh] max-h-[88dvh] overflow-hidden",
          isClosing ? "animate-drawer-out" : "animate-drawer-in",
        )}
      >
        <div className="flex w-full min-h-full">
          {/* Main Content: Left Column (Folder Identity & Tabs) + Middle Column (Search & Tool List) */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row">
            {/* Left Column: Identity & Filters */}
            <div className="w-full sm:w-[230px] md:w-[250px] shrink-0 p-5 sm:p-6 flex flex-col text-center sm:text-left">
              {/* Segmented Filter Tabs */}
              <div className="flex sm:flex-col gap-1 text-[12px] font-medium justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full transition-colors cursor-pointer text-left flex items-center justify-between",
                    tab === "all"
                      ? "bg-foreground text-background font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
                  )}
                >
                  <span>All</span>
                  <span className="text-[11px] opacity-75">{allCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("available")}
                  className={cn(
                    "px-3 py-1.5 rounded-full transition-colors cursor-pointer text-left flex items-center justify-between",
                    tab === "available"
                      ? "bg-foreground text-background font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
                  )}
                >
                  <span>Available</span>
                  <span className="text-[11px] opacity-75">{availableCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("in_folder")}
                  className={cn(
                    "px-3 py-1.5 rounded-full transition-colors cursor-pointer text-left flex items-center justify-between",
                    tab === "in_folder"
                      ? "bg-foreground text-background font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-subtle-background",
                  )}
                >
                  <span>In Folder</span>
                  <span className="text-[11px] opacity-75">{inFolderCount}</span>
                </button>
              </div>
            </div>

            {/* Distinct vertical line between left and right division (Desktop) */}
            <div className="hidden sm:block w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

            {/* Distinct horizontal line between top and bottom division (Mobile) */}
            <div className="sm:hidden h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

            {/* Middle Column: Search Cell & Tool List */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Search Bar Cell */}
              <div className="p-3.5 sm:p-4 text-left">
                <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tools by name, domain..."
                    className="w-full h-8.5 pl-9 pr-16 rounded-full border border-black/10 dark:border-white/10 bg-subtle-background/60 text-[12.5px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 transition-colors"
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
              </div>

              {/* Tool List */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 divide-y divide-black/5 dark:divide-white/[0.06] min-h-[220px]">
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
                          All {allCount} uploaded tools have already been added to this folder.
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
                                <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.2 rounded border border-black/10 dark:border-white/10 text-muted-foreground">
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
            </div>
          </div>

          {/* Distinct vertical line before right action column */}
          <div className="w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

          {/* Right Column: Close & Done Actions (Last Column) */}
          <div className="w-[52px] sm:w-14 md:w-16 shrink-0 bg-subtle-background/20 dark:bg-white/[0.015] self-stretch flex flex-col">
            <div className="flex-1 flex flex-col items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
              {/* Close Button */}
              {/* Done Button (Vertical Pill matching ResourceDrawer Open button) */}
              <button
                type="button"
                onClick={() => setFolderAddOpen(false)}
                className="flex w-9 sm:w-9.5 flex-1 min-h-12 items-center justify-center rounded-full bg-foreground text-background hover:bg-orange-500 hover:text-white transition-all shadow-xs active:scale-[0.96] cursor-pointer select-none"
                title="Done"
                aria-label="Done"
              >
                <Check size={16} className="shrink-0 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
