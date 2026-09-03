"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import {
  categories,
  categoryById,
  getResourcePricing,
  resourceTypes,
  tagById,
  tags,
  typeBySlug,
} from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ResourceDrawer() {
  const {
    selected,
    selectResource,
    collections,
    addToCollection,
    deleteResource,
    updateResource,
    isAdmin,
    categories,
    resourceTypes,
    addCategory,
    deleteCategory,
    addResourceType,
    deleteResourceType,
  } = useVault();

  const [collectionId, setCollectionId] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteContainerRef = useRef<HTMLDivElement>(null);

  // Close confirmation popover on click outside or Escape
  useEffect(() => {
    if (!confirmDeleteOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        deleteContainerRef.current &&
        !deleteContainerRef.current.contains(e.target as Node)
      ) {
        setConfirmDeleteOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setConfirmDeleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [confirmDeleteOpen]);

  const categoryOptions = useMemo(() => {
    return categories.map((c) => {
      let group: string | undefined;
      if (c.parentId) {
        const parent = categoryById(c.parentId);
        group = parent ? parent.name : undefined;
      }
      return {
        value: c.id,
        label: c.name,
        group,
      };
    });
  }, [categories]);

  const typeOptions = useMemo(() => {
    return resourceTypes.map((t) => ({
      value: t.slug,
      label: t.name,
    }));
  }, [resourceTypes]);

  const collectionOptions = useMemo(() => {
    return collections.map((col) => ({
      value: col.id,
      label: col.name,
    }));
  }, [collections]);

  if (!selected) {
    return (
      <Drawer open={false} title="Resource" onClose={() => selectResource(null)}>
        {null}
      </Drawer>
    );
  }

  const category = categoryById(selected.categoryId);
  const resourceType = typeBySlug(selected.type);
  const currentPricing = getResourcePricing(selected);

  const handleToggleTag = (tagId: string) => {
    if (!isAdmin) return;
    const currentTags = selected.tagIds || [];
    const nextTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    updateResource(selected.id, { tagIds: nextTags });
  };

  // Drawer top header: title on the left
  const headerTitle = (
    <h3 className="text-[14px] font-medium text-foreground truncate max-w-[180px] sm:max-w-[240px]">
      {selected.name}
    </h3>
  );

  // Delete button placed near the close button (icon with BG, popup positioned directly below without overlay)
  const headerRightActions = isAdmin ? (
    <div ref={deleteContainerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setConfirmDeleteOpen((prev) => !prev)}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 border border-border/80 transition-colors cursor-pointer",
          confirmDeleteOpen && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        )}
        aria-label="Delete resource"
        title="Delete resource"
        aria-expanded={confirmDeleteOpen}
      >
        <Trash2 size={15} />
      </button>

      {/* Delete Confirmation Popover positioned directly below the delete icon without overlay */}
      {confirmDeleteOpen && (
        <div
          role="dialog"
          aria-label="Confirm deletion"
          className="absolute right-0 sm:right-[-38px] top-full mt-2 z-50 w-[min(calc(100vw-2rem),260px)] rounded-xl border border-border bg-background p-3.5 shadow-xl shadow-black/10 dark:shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-100 text-left"
        >
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mt-0.5">
              <Trash2 size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-semibold text-foreground">
                Delete resource?
              </h4>
              <p className="mt-1 text-[12px] text-muted-foreground leading-normal">
                Are you sure you want to delete <span className="font-medium text-foreground">"{selected.name}"</span>?
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(false)}
              className="rounded-full px-3 py-1 text-[11.5px] font-medium text-muted-foreground hover:bg-subtle-background hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDeleteOpen(false);
                deleteResource(selected.id);
              }}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-[11.5px] font-medium transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <Drawer
      open
      title={selected.name}
      headerActions={headerTitle}
      headerRight={headerRightActions}
      onClose={() => selectResource(null)}
    >
      <div className="flex flex-col items-center text-center">
        {/* 1. Icon */}
        <div className="mt-4 sm:mt-6 flex justify-center">
          <ResourceIcon
            resource={{
              name: selected.name,
              domain: selected.domain,
              iconUrl: selected.iconUrl,
            }}
            size={48}
          />
        </div>

        {/* 2. Name */}
        <h2
          contentEditable={isAdmin}
          suppressContentEditableWarning
          onBlur={(e) => {
            const text = e.currentTarget.textContent?.trim();
            if (text && text !== selected.name) {
              updateResource(selected.id, { name: text });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={cn(
            "mt-4 text-[22px] font-semibold tracking-tight text-foreground outline-none select-text",
            isAdmin && "cursor-text hover:opacity-80 transition-opacity",
          )}
          title={isAdmin ? "Click to edit name" : undefined}
        >
          {selected.name}
        </h2>

        {/* 3. Website */}
        <p
          contentEditable={isAdmin}
          suppressContentEditableWarning
          onBlur={(e) => {
            const text = e.currentTarget.textContent?.trim();
            if (text && text !== selected.url && text !== selected.domain) {
              let domain = selected.domain;
              try {
                domain = new URL(text.startsWith("http") ? text : `https://${text}`).hostname.replace(
                  /^www\./,
                  "",
                );
              } catch {}
              updateResource(selected.id, { url: text, domain });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={cn(
            "mt-1 text-[13px] text-muted-foreground outline-none select-text transition-colors",
            isAdmin ? "cursor-text hover:text-orange-500" : "hover:text-foreground",
          )}
          title={isAdmin ? "Click to edit URL" : undefined}
        >
          {selected.domain || selected.url}
        </p>

        {/* 4. Description */}
        <p
          contentEditable={isAdmin}
          suppressContentEditableWarning
          onBlur={(e) => {
            const text = e.currentTarget.textContent?.trim() ?? "";
            if (text !== (selected.description || "")) {
              updateResource(selected.id, { description: text });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={cn(
            "mt-3.5 max-w-sm text-[13.5px] text-muted-foreground outline-none leading-relaxed select-text",
            isAdmin && "cursor-text hover:text-foreground transition-colors",
          )}
          title={isAdmin ? "Click to edit description" : undefined}
        >
          {selected.description || (isAdmin ? "Add description..." : "")}
        </p>

        {/* 5. Open Website Button */}
        <div className="mt-5 w-full">
          <a
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[13px] font-medium text-background hover:bg-orange-500 hover:text-white transition-all"
          >
            <span>Open Website</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Well-placed Divider Line */}
        <div className="w-full my-5 border-t border-border/70" />

        {/* Pricing, Category & Tools selection */}
        <div className="flex items-center justify-center gap-1 text-[12px] sm:text-[13px] text-muted-foreground flex-wrap">
          {isAdmin ? (
            <button
              type="button"
              onClick={() =>
                updateResource(selected.id, {
                  pricing: currentPricing === "Free" ? "Freemium" : "Free",
                })
              }
              title={`Pricing: ${currentPricing} (Click to switch to ${
                currentPricing === "Free" ? "Freemium" : "Free"
              })`}
              className="rounded px-1.5 py-0.5 text-[12px] sm:text-[13px] text-muted-foreground hover:text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
            >
              {currentPricing}
            </button>
          ) : (
            <span className="px-1.5 py-0.5 text-[12px] sm:text-[13px] text-muted-foreground">
              {currentPricing}
            </span>
          )}

          <span className="text-muted-foreground/50 select-none">·</span>

          {isAdmin ? (
            <SearchableDropdown
              value={selected.categoryId}
              onChange={(newCatId) => updateResource(selected.id, { categoryId: newCatId })}
              options={categoryOptions}
              searchPlaceholder="Search categories..."
              placeholder="Select category"
              title="Change category"
              align="center"
              triggerClassName="border-none bg-transparent hover:bg-subtle-background hover:text-foreground text-muted-foreground px-1.5 py-0.5 text-[12px] sm:text-[13px] font-normal shadow-none"
              contentClassName="w-[min(calc(100vw-2rem),15rem)]"
              onAdd={(name) => {
                const newCat = addCategory(name);
                if (newCat) updateResource(selected.id, { categoryId: newCat.id });
              }}
              addLabel="Category"
              onDelete={deleteCategory}
            />
          ) : (
            <span className="px-1.5 py-0.5 text-[12px] sm:text-[13px] text-muted-foreground">
              {category?.name ?? selected.categoryId}
            </span>
          )}

          <span className="text-muted-foreground/50 select-none">·</span>

          {isAdmin ? (
            <SearchableDropdown
              value={selected.type}
              onChange={(newType) => updateResource(selected.id, { type: newType })}
              options={typeOptions}
              searchPlaceholder="Search tools..."
              placeholder="Select tool type"
              title="Change tool type"
              align="center"
              triggerClassName="border-none bg-transparent hover:bg-subtle-background hover:text-foreground text-muted-foreground px-1.5 py-0.5 text-[12px] sm:text-[13px] font-normal shadow-none"
              contentClassName="w-[min(calc(100vw-2rem),15rem)]"
              onAdd={(name) => {
                const newType = addResourceType(name);
                if (newType) updateResource(selected.id, { type: newType.slug });
              }}
              addLabel="Type"
              onDelete={deleteResourceType}
            />
          ) : (
            <span className="px-1.5 py-0.5 text-[12px] sm:text-[13px] text-muted-foreground">
              {resourceType?.name ?? selected.type}
            </span>
          )}
        </div>

        {/* 8. Tags (Admin only) */}
        {isAdmin && (
          <div className="mt-6 w-full text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium text-muted-foreground">Tags</p>
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="text-[11px] font-medium text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:underline cursor-pointer transition-colors"
              >
                {showTagPicker ? "Done" : "+ Add Tag"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.tagIds && selected.tagIds.length > 0 ? (
                selected.tagIds.map((id) => (
                  <span
                    key={id}
                    onClick={() => handleToggleTag(id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-subtle-background px-2.5 py-0.5 text-[11px] font-medium text-foreground hover:border-orange-500/50 hover:text-orange-500 cursor-pointer group transition-colors"
                    title="Click to remove tag"
                  >
                    <span>{tagById(id)?.name ?? id}</span>
                    <X
                      size={10}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-subtle-foreground italic">No tags assigned</span>
              )}
            </div>

            {/* Quick Tag Palette for Admin */}
            {showTagPicker && (
              <div className="mt-3 rounded-xl border border-border/70 bg-subtle-background/50 p-2.5">
                <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                  {tags.map((tag) => {
                    const isAssigned = (selected.tagIds || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer select-none",
                          isAssigned
                            ? "bg-orange-500 font-semibold text-white"
                            : "border border-border/80 bg-background text-muted-foreground hover:border-orange-500/40 hover:text-orange-500",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collection assignment (Admin only - Searchable) */}
        {isAdmin && collections.length > 0 && (
          <div className="mt-6 w-full text-left">
            <p className="mb-2 text-[12px] font-medium text-muted-foreground">Collection</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 min-w-0">
                <SearchableDropdown
                  value={collectionId}
                  onChange={(val) => setCollectionId(val)}
                  options={collectionOptions}
                  searchPlaceholder="Search collections..."
                  placeholder="Choose collection..."
                  align="left"
                  triggerClassName="w-full justify-between h-9 rounded-full px-3 text-[13px] bg-background border border-border/80 hover:border-foreground/30"
                  contentClassName="w-[min(calc(100vw-3rem),280px)]"
                />
              </div>
              <Button
                variant="outline"
                disabled={!collectionId}
                className="hover:border-orange-500 hover:text-orange-500 transition-colors h-9 shrink-0 rounded-full"
                onClick={() => {
                  if (!collectionId) return;
                  addToCollection(selected.id, collectionId);
                  setCollectionId("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
