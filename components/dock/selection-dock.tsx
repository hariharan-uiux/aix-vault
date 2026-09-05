"use client";

import { Popover, usePopover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import {
  Check,
  Folder,
  FolderMinus,
  FolderPlus,
  Plus,
  Search,
  SquareCheck,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

function FolderPickerMenu() {
  const { close } = usePopover();
  const {
    collections,
    selectedResourceIds,
    addResourcesToCollection,
    createCollection,
    collectionResourceIds,
    navigation,
    removeResourcesFromCollection,
    setToast,
  } = useVault();

  const [query, setQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const count = selectedResourceIds.length;
  const isCurrentFolder = navigation.kind === "collection";
  const currentFolder = isCurrentFolder
    ? collections.find((c) => c.id === navigation.collectionId)
    : null;

  const filteredCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, query]);

  const handleSelectFolder = (collectionId: string) => {
    if (count === 0) {
      setToast("Select at least 1 resource first.");
      return;
    }
    addResourcesToCollection(selectedResourceIds, collectionId);
    close();
  };

  const handleCreateAndAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const newCol = createCollection(trimmed);
    if (newCol) {
      if (count > 0) {
        addResourcesToCollection(selectedResourceIds, newCol.id);
      }
      setNewFolderName("");
      setIsCreating(false);
      close();
    }
  };

  return (
    <div
      className="w-[min(calc(100vw-2rem),320px)] p-1 text-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="px-3 py-2 border-b border-border/80">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            Put into Folder
          </span>
          <span className="text-[11px] font-medium font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-subtle-background border border-border">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          {count === 0
            ? "Select resources from the grid to add to a folder."
            : "Select destination folder or create a new one."}
        </p>
      </div>

      {/* Remove from current folder action if viewing a collection */}
      {isCurrentFolder && currentFolder && (
        <div className="p-1.5 border-b border-border/60">
          <button
            type="button"
            onClick={() => {
              if (count === 0) {
                setToast("Select resources first to remove.");
                return;
              }
              removeResourcesFromCollection(selectedResourceIds, navigation.collectionId);
              close();
            }}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderMinus size={14} className="shrink-0" />
              <span className="truncate">Remove from &quot;{currentFolder.name}&quot;</span>
            </div>
            {count > 0 && (
              <span className="text-[11px] font-mono shrink-0">({count})</span>
            )}
          </button>
        </div>
      )}

      {/* Search Filter Input */}
      {collections.length > 3 && (
        <div className="p-2 border-b border-border/60">
          <div className="relative flex items-center">
            <Search
              size={13}
              className="absolute left-2.5 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search folders..."
              className="w-full h-8 pl-8 pr-3 text-[12px] rounded-lg bg-subtle-background border border-border outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:border-foreground/40 text-foreground placeholder:text-muted-foreground transition-colors"
            />
          </div>
        </div>
      )}

      {/* Folders List */}
      <div className="max-h-[220px] overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((col) => {
            const folderItemIds = collectionResourceIds(col.id);
            const allAlreadyInFolder =
              count > 0 && selectedResourceIds.every((id) => folderItemIds.includes(id));
            const someAlreadyInFolder =
              count > 0 && selectedResourceIds.some((id) => folderItemIds.includes(id));

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => handleSelectFolder(col.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer group",
                  "hover:bg-subtle-background text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                    <Folder size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate text-foreground">
                      {col.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {folderItemIds.length} {folderItemIds.length === 1 ? "resource" : "resources"}
                    </div>
                  </div>
                </div>

                {allAlreadyInFolder ? (
                  <span className="shrink-0 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    In folder
                  </span>
                ) : someAlreadyInFolder ? (
                  <span className="shrink-0 text-[10.5px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    Partial
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="py-4 text-center text-[12px] text-muted-foreground">
            {collections.length === 0
              ? "No folders created yet"
              : `No folders matching "${query}"`}
          </div>
        )}
      </div>

      {/* Create New Folder Section */}
      <div className="p-2 border-t border-border/80 bg-subtle-background/40 rounded-b-xl">
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full h-8 px-2.5 text-[12px] rounded-lg bg-background border border-border outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:border-foreground text-foreground placeholder:text-muted-foreground transition-colors"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewFolderName("");
                }}
                className="h-7 px-2.5 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-subtle-background hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="h-7 px-3 rounded-md text-[11px] font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-border/80 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-subtle-background hover:border-foreground/30 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Create New Folder</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SelectionDock() {
  const {
    selectedResourceIds,
    clearSelection,
    result,
    selectResources,
    deselectResources,
    setToast,
  } = useVault();

  const selectedCount = selectedResourceIds.length;
  const visibleResources = result.visible;
  const visibleIds = visibleResources.map((r) => r.id);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedResourceIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      deselectResources(visibleIds);
    } else {
      selectResources(visibleIds);
    }
  };

  const handleSave = () => {
    if (selectedCount > 0) {
      setToast(`${selectedCount} resource${selectedCount === 1 ? "" : "s"} selected.`);
    }
    clearSelection();
  };

  return (
    <aside
      aria-label="Selection Toolbar"
      className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-40 flex items-center justify-center px-3 sm:px-4"
    >
      <div
        className={cn(
          "pointer-events-auto frosted-dock relative flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/15 dark:border-white/12 bg-neutral-950/95 dark:bg-[#121212]/95 p-1.5 sm:p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-200 animate-in fade-in zoom-in-95 select-none",
          "w-full max-w-[min(calc(100vw-1.5rem),24rem)] sm:w-auto sm:max-w-none justify-between sm:justify-center",
        )}
      >
        {/* 1. Toggle Select All / Checkbox Icon Button */}
        <Tooltip
          label={
            allVisibleSelected
              ? "Deselect all visible resources"
              : `Select all visible (${visibleResources.length})`
          }
        >
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex size-10 sm:size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.06] text-white transition-all cursor-pointer active:scale-95"
            aria-label={allVisibleSelected ? "Deselect all" : "Select all"}
          >
            <SquareCheck size={18} strokeWidth={1.8} className="text-white sm:size-[15px]" />
          </button>
        </Tooltip>

        {/* 2. Count Indicator (Orange Circle) */}
        <Tooltip
          label={`${selectedCount} resource${selectedCount === 1 ? "" : "s"} selected`}
        >
          <div
            className={cn(
              "flex size-10 sm:size-8 shrink-0 items-center justify-center rounded-full bg-[#ff5500] text-white font-bold leading-none shadow-xs select-none",
              selectedCount > 99 ? "text-[12px] sm:text-[11px] min-w-10 sm:min-w-8 w-auto px-1.5" : "text-[14px] sm:text-[13px]",
            )}
          >
            {selectedCount}
          </div>
        </Tooltip>

        {/* 3. Subtle Vertical Divider */}
        <div className="h-5 sm:h-4 w-px bg-white/15 dark:bg-white/15 shrink-0 mx-0.5" />

        {/* 4. Put into Folder Action (Popover) */}
        <Popover
          side="top"
          align="center"
          triggerClassName={({ open }) =>
            cn(
              "flex items-center gap-2 h-10 sm:h-8 px-3 sm:px-4 rounded-full border text-[13.5px] sm:text-[13px] font-medium transition-all cursor-pointer select-none active:scale-95",
              open
                ? "bg-white/[0.16] text-white border-white/25"
                : selectedCount > 0
                  ? "bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 hover:text-white border-white/[0.08]"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-300 border-white/[0.06]",
            )
          }
          label={() => (
            <span className="flex items-center gap-1.5 sm:gap-2">
              <FolderPlus
                size={17}
                strokeWidth={1.8}
                className={cn("sm:size-[15px]", selectedCount > 0 ? "text-neutral-200" : "text-neutral-400")}
              />
              <span className="hidden min-[360px]:inline">Put in Folder</span>
              <span className="min-[360px]:hidden">Folder</span>
            </span>
          )}
        >
          <FolderPickerMenu />
        </Popover>

        {/* 5. Save Button (White Pill) */}
        <Tooltip label="Save selection">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 h-10 sm:h-8 px-4 sm:px-4 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 text-[13.5px] sm:text-[13px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer select-none"
          >
            <Check size={16} strokeWidth={2.5} className="text-neutral-950 sm:size-[14px]" />
            <span>Save</span>
          </button>
        </Tooltip>

        {/* 6. Close Icon Button near Save Button */}
        <Tooltip label="Close selection (Escape)">
          <button
            type="button"
            onClick={clearSelection}
            className="flex size-10 sm:size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer select-none"
            aria-label="Close selection"
          >
            <X size={18} strokeWidth={2} className="sm:size-[15px]" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
