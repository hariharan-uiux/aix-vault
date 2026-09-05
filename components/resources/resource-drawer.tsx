"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import {
  categoryById,
  getResourcePricing,
  tagById,
  tags,
  typeBySlug,
} from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import { ExternalLink, Pencil, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ResourceDrawer() {
  const {
    selected: storeSelected,
    selectResource,
    collections,
    addToCollection,
    deleteResource,
    updateResource,
    toggleRecommendResource,
    isAdmin,
    categories,
    resourceTypes,
    addCategory,
    editCategory,
    deleteCategory,
    addResourceType,
    editResourceType,
    deleteResourceType,
  } = useVault();

  const [collectionId, setCollectionId] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPricing, setFormPricing] = useState<"Free" | "Freemium">("Freemium");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formType, setFormType] = useState("");
  const [formRecommended, setFormRecommended] = useState(false);

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

  // Close edit modal on Escape
  useEffect(() => {
    if (!editModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditModalOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editModalOpen]);

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

  const [lastSelected, setLastSelected] = useState<typeof storeSelected>(storeSelected);
  useEffect(() => {
    if (storeSelected) {
      setLastSelected(storeSelected);
    }
  }, [storeSelected]);
  const selected = storeSelected || lastSelected;

  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (storeSelected) setHasOpened(true);
  }, [storeSelected]);

  if (!hasOpened || !selected) {
    return null;
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

  const handleStartEdit = () => {
    if (!selected) return;
    setFormName(selected.name);
    setFormUrl(selected.url);
    setFormDescription(selected.description || "");
    setFormPricing(getResourcePricing(selected));
    setFormCategoryId(selected.categoryId);
    setFormType(selected.type);
    setFormRecommended(Boolean(selected.isRecommended));
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selected) return;
    const trimmedName = formName.trim();
    const trimmedUrl = formUrl.trim();
    let domain = selected.domain;
    try {
      if (trimmedUrl) {
        domain = new URL(
          trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`,
        ).hostname.replace(/^www\./, "");
      }
    } catch {}

    updateResource(selected.id, {
      name: trimmedName || selected.name,
      url: trimmedUrl || selected.url,
      domain,
      description: formDescription.trim(),
      pricing: formPricing,
      categoryId: formCategoryId || selected.categoryId,
      type: formType || selected.type,
      isRecommended: formRecommended,
    });
    setEditModalOpen(false);
  };

  // Drawer top header: title on the left
  const headerTitle = (
    <div className="flex items-center gap-2 min-w-0">
      <h3 className="text-[14px] font-medium text-foreground truncate max-w-[180px] sm:max-w-[240px]">
        {selected.name}
      </h3>
      {selected.isRecommended && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-subtle-background px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400 shrink-0 select-none"
          title="Admin Recommended"
        >
          <Star size={10} className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400" />
          <span>Recommended</span>
        </span>
      )}
    </div>
  );

  // Edit & Delete buttons placed near the close button
  const headerRightActions = isAdmin ? (
    <div className="flex items-center gap-1.5">
      {/* Star / Recommendation button (Admin) */}
      <button
        type="button"
        onClick={(e) => toggleRecommendResource(selected.id, e)}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-subtle-background transition-all cursor-pointer",
          selected.isRecommended
            ? "text-orange-500 dark:text-orange-400 hover:border-foreground/30 hover:bg-subtle-background/80"
            : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30",
        )}
        aria-label={selected.isRecommended ? "Remove recommendation" : "Recommend resource"}
        title={selected.isRecommended ? "Recommended by Admin (Click to remove)" : "Recommend tool (Admin)"}
      >
        <Star
          size={14}
          className={cn(
            "transition-transform active:scale-90",
            selected.isRecommended && "fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400",
          )}
        />
      </button>

      {/* Edit resource button */}
      <button
        type="button"
        onClick={handleStartEdit}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 border border-border/80 transition-colors cursor-pointer"
        aria-label="Edit resource"
        title="Edit resource"
      >
        <Pencil size={14} />
      </button>

      {/* Delete button placed near the close button (icon with BG, popup positioned directly below without overlay) */}
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
    </div>
  ) : selected.isRecommended ? (
    <div className="flex items-center">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-subtle-background text-orange-500 dark:text-orange-400"
        title="Admin Recommended"
      >
        <Star size={14} className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400" />
      </div>
    </div>
  ) : null;

  return (
    <>
      <Drawer
        open={Boolean(storeSelected)}
        title={selected.name}
        headerActions={headerTitle}
        headerRight={headerRightActions}
        onClose={() => selectResource(null)}
        contentClassName="p-0"
      >
      <div className="flex flex-col sm:flex-row w-full min-h-full">
        {/* Left Column: Identity & Primary CTA */}
        <div className="w-full sm:w-[240px] md:w-[260px] shrink-0 p-5 sm:p-6 flex flex-col justify-between text-center sm:text-left">
          <div>
            {/* Icon */}
            <div className="flex justify-center sm:justify-start mb-3.5">
              <ResourceIcon
                resource={{
                  name: selected.name,
                  domain: selected.domain,
                  iconUrl: selected.iconUrl,
                }}
                size={48}
                className="sm:hidden"
                grayscale={false}
              />
              <ResourceIcon
                resource={{
                  name: selected.name,
                  domain: selected.domain,
                  iconUrl: selected.iconUrl,
                }}
                size={56}
                className="hidden sm:flex"
                grayscale={false}
              />
            </div>

            {/* Admin Recommended Badge */}
            {selected.isRecommended && (
              <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[10.5px] font-medium text-orange-600 dark:text-orange-400 select-none">
                <Star size={10} className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400" />
                <span>Admin Recommended</span>
              </div>
            )}

            {/* Name */}
            <h2
              contentEditable={isAdmin}
              suppressContentEditableWarning
              spellCheck={false}
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
              style={{ outline: "none", border: "none", boxShadow: "none" }}
              className={cn(
                "text-[19px] sm:text-[21px] font-semibold tracking-tight text-foreground leading-snug outline-none focus:outline-none focus-visible:outline-none border-none select-text",
                isAdmin && "cursor-text hover:opacity-80 transition-opacity",
              )}
              title={isAdmin ? "Click to edit name" : undefined}
            >
              {selected.name}
            </h2>

            {/* Website */}
            <p
              contentEditable={isAdmin}
              suppressContentEditableWarning
              spellCheck={false}
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
              style={{ outline: "none", border: "none", boxShadow: "none" }}
              className={cn(
                "mt-0.5 sm:mt-1 text-[12.5px] text-muted-foreground outline-none focus:outline-none focus-visible:outline-none border-none select-text transition-colors truncate max-w-full",
                isAdmin ? "cursor-text hover:text-orange-500" : "hover:text-foreground",
              )}
              title={isAdmin ? "Click to edit URL" : undefined}
            >
              {selected.domain || selected.url}
            </p>
          </div>

          {/* Open Website Button */}
          <div className="mt-5 sm:mt-8 w-full">
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 sm:h-9.5 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[12.5px] sm:text-[13px] font-medium text-background hover:bg-orange-500 hover:text-white transition-all shadow-xs"
            >
              <span>Open Website</span>
              <ExternalLink size={13.5} />
            </a>
          </div>
        </div>

        {/* Distinct vertical line between left and right division (Desktop) */}
        <div className="hidden sm:block w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

        {/* Distinct horizontal line between top and bottom division (Mobile) */}
        <div className="sm:hidden h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

        {/* Right Column: Description & Details */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 1. Description Cell */}
          <div className="p-5 sm:p-6 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2 block select-none">
              Description
            </span>
            <p
              contentEditable={isAdmin}
              suppressContentEditableWarning
              spellCheck={false}
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
              style={{ outline: "none", border: "none", boxShadow: "none" }}
              className={cn(
                "text-[13px] sm:text-[13.5px] text-foreground/90 dark:text-foreground/85 leading-relaxed outline-none focus:outline-none focus-visible:outline-none border-none select-text",
                !selected.description && "italic text-muted-foreground/60",
                isAdmin && "cursor-text hover:text-foreground transition-colors",
              )}
              title={isAdmin ? "Click to edit description" : undefined}
            >
              {decodeHtmlEntities(selected.description) || (isAdmin ? "Click to add description..." : "No description provided.")}
            </p>
          </div>

          {/* Distinct divider line between description and details */}
          <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

          {/* 2. Details Cell */}
          <div className="p-5 sm:p-6 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2.5 block select-none">
              Details
            </span>
            <div className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] text-muted-foreground flex-wrap">
              {/* Pricing */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    updateResource(selected.id, {
                      pricing: currentPricing === "Free" ? "Freemium" : "Free",
                    })
                  }
                  title={`Pricing: ${currentPricing} (Click to switch)`}
                  className="rounded-full border border-black/10 dark:border-white/10 bg-subtle-background/80 px-2.5 py-0.5 text-[11.5px] font-medium text-foreground hover:border-foreground/30 hover:bg-subtle-background transition-colors cursor-pointer"
                >
                  {currentPricing}
                </button>
              ) : (
                <span className="rounded-full border border-black/10 dark:border-white/10 bg-subtle-background/80 px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                  {currentPricing}
                </span>
              )}

              <span className="text-muted-foreground/40 select-none">·</span>

              {/* Category */}
              {isAdmin ? (
                <SearchableDropdown
                  value={selected.categoryId}
                  onChange={(newCatId) => updateResource(selected.id, { categoryId: newCatId })}
                  options={categoryOptions}
                  searchPlaceholder="Search categories..."
                  placeholder="Select category"
                  title="Change category"
                  align="left"
                  triggerClassName="border border-black/10 dark:border-white/10 bg-subtle-background/80 hover:bg-subtle-background hover:text-foreground text-muted-foreground px-2.5 py-0.5 text-[11.5px] font-medium rounded-full shadow-none h-auto"
                  contentClassName="w-[min(calc(100vw-2rem),15rem)]"
                  onAdd={(name) => {
                    const newCat = addCategory(name);
                    if (newCat) updateResource(selected.id, { categoryId: newCat.id });
                  }}
                  addLabel="Category"
                  onEdit={editCategory}
                  onDelete={deleteCategory}
                />
              ) : (
                <span className="rounded-full border border-black/10 dark:border-white/10 bg-subtle-background/80 px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                  {category?.name ?? selected.categoryId}
                </span>
              )}

              <span className="text-muted-foreground/40 select-none">·</span>

              {/* Type */}
              {isAdmin ? (
                <SearchableDropdown
                  value={selected.type}
                  onChange={(newType) => updateResource(selected.id, { type: newType })}
                  options={typeOptions}
                  searchPlaceholder="Search tools..."
                  placeholder="Select tool type"
                  title="Change tool type"
                  align="left"
                  triggerClassName="border border-black/10 dark:border-white/10 bg-subtle-background/80 hover:bg-subtle-background hover:text-foreground text-muted-foreground px-2.5 py-0.5 text-[11.5px] font-medium rounded-full shadow-none h-auto"
                  contentClassName="w-[min(calc(100vw-2rem),15rem)]"
                  onAdd={(name) => {
                    const newType = addResourceType(name);
                    if (newType) updateResource(selected.id, { type: newType.slug });
                  }}
                  addLabel="Type"
                  onEdit={editResourceType}
                  onDelete={deleteResourceType}
                />
              ) : (
                <span className="rounded-full border border-black/10 dark:border-white/10 bg-subtle-background/80 px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                  {resourceType?.name ?? selected.type}
                </span>
              )}
            </div>
          </div>

          {/* 3. Tags Cell (Admin only) */}
          {isAdmin && (
            <>
              <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />
              <div className="p-5 sm:p-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Tags
                  </span>
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
                        className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-subtle-background px-2.5 py-0.5 text-[11px] font-medium text-foreground hover:border-orange-500/50 hover:text-orange-500 cursor-pointer group transition-colors"
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
                  <div className="mt-3 rounded-xl border border-black/10 dark:border-white/10 bg-subtle-background/50 p-2.5">
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
                                : "border border-black/10 dark:border-white/10 bg-background text-muted-foreground hover:border-orange-500/40 hover:text-orange-500",
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
            </>
          )}

          {/* 4. Collection Cell (Admin only) */}
          {isAdmin && collections.length > 0 && (
            <>
              <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />
              <div className="p-5 sm:p-6 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2 block">
                  Collection
                </span>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <SearchableDropdown
                      value={collectionId}
                      onChange={(val) => setCollectionId(val)}
                      options={collectionOptions}
                      searchPlaceholder="Search collections..."
                      placeholder="Choose collection..."
                      align="left"
                      triggerClassName="w-full justify-between h-9 rounded-full px-3 text-[12.5px] bg-background border border-black/10 dark:border-white/10 hover:border-foreground/30"
                      contentClassName="w-[min(calc(100vw-3rem),280px)]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={!collectionId}
                    className="hover:border-orange-500 hover:text-orange-500 transition-colors h-9 shrink-0 rounded-full text-[12px] px-4"
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
            </>
          )}
        </div>
      </div>
      </Drawer>

      {/* Edit Resource Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-[3px] transition-opacity"
            onClick={() => setEditModalOpen(false)}
          />

          {/* Dialog Card */}
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <ResourceIcon
                  resource={{
                    name: formName || selected.name,
                    domain: selected.domain,
                    iconUrl: selected.iconUrl,
                  }}
                  size={32}
                />
                <h3 className="text-[16px] font-semibold text-foreground">Edit Resource</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-subtle-background hover:text-foreground cursor-pointer transition-colors"
                aria-label="Close edit modal"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Resource Name
                </label>
                <input
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-subtle-background px-3 py-2 text-[13px] text-foreground outline-none focus:outline-none focus:border-foreground"
                  placeholder="e.g. Figma"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Website URL
                </label>
                <input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-subtle-background px-3 py-2 text-[13px] text-foreground outline-none focus:outline-none focus:border-foreground"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-subtle-background px-3 py-2 text-[13px] text-foreground outline-none focus:outline-none focus:border-foreground resize-none"
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                    Category
                  </label>
                  <SearchableDropdown
                    value={formCategoryId}
                    onChange={(val) => setFormCategoryId(val)}
                    options={categoryOptions}
                    searchPlaceholder="Search categories..."
                    placeholder="Select category"
                    className="w-full"
                    triggerClassName="w-full justify-between h-9 rounded-xl px-3 text-[12.5px] bg-subtle-background border border-border text-foreground font-normal"
                    contentClassName="w-[min(calc(100vw-3rem),240px)]"
                    onAdd={(name) => {
                      const newCat = addCategory(name);
                      if (newCat) setFormCategoryId(newCat.id);
                    }}
                    addLabel="Category"
                    onEdit={editCategory}
                    onDelete={deleteCategory}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                    Tool Type
                  </label>
                  <SearchableDropdown
                    value={formType}
                    onChange={(val) => setFormType(val)}
                    options={typeOptions}
                    searchPlaceholder="Search tools..."
                    placeholder="Select tool type"
                    className="w-full"
                    triggerClassName="w-full justify-between h-9 rounded-xl px-3 text-[12.5px] bg-subtle-background border border-border text-foreground font-normal"
                    contentClassName="w-[min(calc(100vw-3rem),220px)]"
                    onAdd={(name) => {
                      const newType = addResourceType(name);
                      if (newType) setFormType(newType.slug);
                    }}
                    addLabel="Type"
                    onEdit={editResourceType}
                    onDelete={deleteResourceType}
                  />
                </div>
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
                      onClick={() => setFormPricing(p)}
                      className={cn(
                        "rounded-full py-1.5 text-[12px] font-medium text-center transition-all cursor-pointer",
                        formPricing === p
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
                onClick={() => setFormRecommended((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer select-none",
                  formRecommended
                    ? "border-orange-500/40 bg-orange-500/10 shadow-2xs shadow-orange-500/10"
                    : "border-border/80 bg-subtle-background/40 hover:bg-subtle-background/80",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border transition-all",
                      formRecommended
                        ? "border-border/80 bg-subtle-background text-orange-500 dark:text-orange-400"
                        : "border-border/80 bg-background text-muted-foreground",
                    )}
                  >
                    <Star
                      size={14}
                      className={cn(
                        "transition-transform",
                        formRecommended
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
                    formRecommended ? "bg-orange-500" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      formRecommended ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-subtle-background hover:text-foreground cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background hover:opacity-90 cursor-pointer transition-opacity"
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
