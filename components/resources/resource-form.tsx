"use client";

import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { ResourceIcon } from "@/components/resources/resource-icon";
import { categoryById, tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn, cleanResourceName } from "@/lib/utils";
import { ChevronDown, Loader2, Plus, Star, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Meta = {
  name?: string;
  title: string;
  tagline?: string;
  description: string;
  domain: string;
  iconUrl: string | null;
  canonicalUrl: string;
};

export function ResourceForm() {
  const {
    addOpen,
    setAddOpen,
    createResource,
    selectResource,
    collections,
    navigation,
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
  const defaultCategory = navigation.kind === "category" ? navigation.categoryId : "development";
  const defaultCollectionId = navigation.kind === "collection" ? navigation.collectionId : "";
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory);
  const [type, setType] = useState("tool");
  const [pricing, setPricing] = useState<"Free" | "Freemium">("Freemium");
  const [isRecommended, setIsRecommended] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [collectionId, setCollectionId] = useState(defaultCollectionId);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [metaNote, setMetaNote] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 640) {
      setTagsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (addOpen) {
      if (navigation.kind === "category") {
        setCategoryId(navigation.categoryId);
      } else if (navigation.kind === "collection") {
        setCollectionId(navigation.collectionId);
      }
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setTagsOpen(false);
      }
    }
  }, [addOpen, navigation]);

  useEffect(() => {
    if (!addOpen) return;
    const handle = window.setTimeout(async () => {
      if (!url.trim()) return;
      setLoadingMeta(true);
      setMetaNote(null);
      try {
        const response = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = (await response.json()) as Meta & { error?: string };
        if (!response.ok) {
          setMetaNote(
            "We couldn't retrieve this site's details. You can enter them manually.",
          );
          return;
        }
        const fetchedName = data.name || data.title;
        const clean = cleanResourceName(fetchedName, "", data.domain);
        setName((current) => current || clean.name);
        const cleanDesc = data.description || clean.tagline || data.tagline || "";
        if (cleanDesc) {
          setDescription((current) => current || cleanDesc);
        }
        if (data.iconUrl) {
          setIconUrl(data.iconUrl);
        }
        if (data.canonicalUrl) setUrl(data.canonicalUrl);
      } catch {
        setMetaNote(
          "We couldn't retrieve this site's details. You can enter them manually.",
        );
      } finally {
        setLoadingMeta(false);
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [url, addOpen]);

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
    return [
      { value: "", label: "None (General)" },
      ...collections.map((col) => ({
        value: col.id,
        label: col.name,
      })),
    ];
  }, [collections]);

  const derivedDomain = useMemo(() => {
    if (!url) return "";
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return url.replace(/^https?:\/\//, "").split("/")[0];
    }
  }, [url]);

  function reset() {
    setUrl("");
    setName("");
    setDescription("");
    setCategoryId(defaultCategory);
    setType("tool");
    setPricing("Freemium");
    setIsRecommended(false);
    setSelectedTags([]);
    setCollectionId(defaultCollectionId);
    setIconUrl(null);
    setError(null);
    setExistingId(null);
    setMetaNote(null);
    setSubmitting(false);
  }

  const currentCollection =
    navigation.kind === "collection"
      ? collections.find((c) => c.id === navigation.collectionId)
      : null;

  return (
    <Drawer
      open={addOpen}
      title={currentCollection ? `Add Tool to ${currentCollection.name}` : "Add Resource"}
      showHeader={false}
      onClose={() => {
        setAddOpen(false);
        reset();
      }}
      contentClassName="p-0"
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          try {
            const result = await createResource({
              url,
              name,
              description,
              categoryId,
              type,
              pricing,
              tags: selectedTags,
              collectionId: collectionId || undefined,
              isRecommended,
            });
            if (!result.ok) {
              setError(result.error);
              setExistingId(result.existingId ?? null);
              return;
            }
            setAddOpen(false);
            reset();
          } finally {
            setSubmitting(false);
          }
        }}
        className="flex flex-col sm:flex-row w-full min-h-full"
      >
        {/* Main Content: Left Column (Identity Preview, URL, Name, Description) + Right Column (Details & Tags) */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row overflow-y-auto overscroll-contain">
          {/* Left Column: Identity Preview, URL, Name & Description */}
          <div className="w-full sm:w-[310px] md:w-[340px] shrink-0 p-4 sm:p-5 md:p-6 flex flex-col text-left">
            {/* Top row: Icon */}
            <div className="flex items-center mb-3">
              <ResourceIcon
                resource={{
                  name: name || "New Tool",
                  domain: derivedDomain || "example.com",
                  iconUrl: iconUrl,
                }}
                size={46}
                className="sm:hidden"
                grayscale={false}
              />
              <ResourceIcon
                resource={{
                  name: name || "New Tool",
                  domain: derivedDomain || "example.com",
                  iconUrl: iconUrl,
                }}
                size={54}
                className="hidden sm:flex"
                grayscale={false}
              />
            </div>

            {/* Admin Recommended Badge */}
            {isRecommended && (
              <div className="mb-2 self-start inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[10.5px] font-medium text-orange-600 dark:text-orange-400 select-none">
                <Star size={10} className="fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400" />
                <span>Admin Recommended</span>
              </div>
            )}

            {/* Heading */}
            <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-tight text-foreground leading-snug">
              {currentCollection ? (
                <span>
                  Add to <span className="text-orange-600 dark:text-orange-400">{currentCollection.name}</span>
                </span>
              ) : (
                "Add Resource"
              )}
            </h2>

            {/* URL Input */}
            <div className="mt-3 text-left">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block select-none">
                  URL
                </span>
                <Input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  required
                  autoFocus
                  className="h-8.5 rounded-full bg-subtle-background/60 focus:bg-background text-[12px] sm:text-[12.5px] px-3 border-black/10 dark:border-white/10"
                />
              </label>

              {loadingMeta && (
                <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={11} className="animate-spin text-orange-500 shrink-0" />
                  <span>Detecting details…</span>
                </p>
              )}

              {metaNote && (
                <p className="mt-1.5 text-[11px] text-muted-foreground bg-subtle-background/60 rounded-xl px-2.5 py-1.5 border border-black/10 dark:border-white/10">
                  {metaNote}
                </p>
              )}
            </div>

            {/* Name Input */}
            <div className="mt-2.5 text-left">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block select-none">
                  Name
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Resource name (e.g. Cursor)"
                  required
                  className="h-8.5 rounded-full bg-subtle-background/60 focus:bg-background text-[12px] sm:text-[12.5px] px-3 border-black/10 dark:border-white/10 font-medium"
                />
              </label>
            </div>

            {/* Description Input */}
            <div className="mt-2.5 text-left">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block select-none">
                  Description <span className="font-normal text-muted-foreground/50 lowercase">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Brief summary of what this tool does..."
                  rows={2}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-subtle-background/50 px-3 py-2 text-[12px] sm:text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:bg-background outline-none focus:outline-none focus:border-foreground/30 resize-none transition-colors min-h-[50px]"
                />
              </label>
            </div>
          </div>

          {/* Distinct vertical line between left and right division (Desktop) */}
          <div className="hidden sm:block w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

          {/* Distinct horizontal line between top and bottom division (Mobile) */}
          <div className="sm:hidden h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

          {/* Right Column: Details & Tags */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 1. Details Cell */}
            <div className="p-4 sm:p-5 md:p-6 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2.5 block select-none">
                Details
              </span>
              <div className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] text-muted-foreground flex-wrap">
                {/* Pricing segmented toggle */}
                <div className="inline-flex items-center rounded-full bg-subtle-background/80 p-0.5 sm:p-1 border border-black/10 dark:border-white/10">
                  {(["Free", "Freemium"] as const).map((p) => {
                    const active = pricing === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPricing(p)}
                        className={cn(
                          "rounded-full px-3.5 py-1 text-[12px] sm:text-[12.5px] font-medium transition-all cursor-pointer select-none",
                          active
                            ? "bg-white text-black font-semibold shadow-2xs"
                            : "text-muted-foreground hover:text-foreground border border-transparent",
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <span className="text-muted-foreground/40 select-none">·</span>

                {/* Category Dropdown */}
                <SearchableDropdown
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  options={categoryOptions}
                  searchPlaceholder="Search categories..."
                  placeholder="Select category"
                  title="Developer Tools / Category"
                  align="left"
                  triggerClassName="border border-black/10 dark:border-white/10 bg-subtle-background/80 hover:bg-subtle-background hover:text-foreground text-muted-foreground px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-full shadow-none h-auto"
                  contentClassName="w-[min(calc(100vw-2rem),15rem)]"
                  onAdd={(catName) => {
                    const newCat = addCategory(catName);
                    if (newCat) setCategoryId(newCat.id);
                  }}
                  addLabel="Category"
                  onEdit={editCategory}
                  onDelete={deleteCategory}
                />

                <span className="text-muted-foreground/40 select-none">·</span>

                {/* Type Dropdown */}
                <SearchableDropdown
                  value={type}
                  onChange={(val) => setType(val)}
                  options={typeOptions}
                  searchPlaceholder="Search tools..."
                  placeholder="Select tool type"
                  title="Select Tool Type"
                  align="left"
                  triggerClassName="border border-black/10 dark:border-white/10 bg-subtle-background/80 hover:bg-subtle-background hover:text-foreground text-muted-foreground px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-full shadow-none h-auto"
                  contentClassName="w-[min(calc(100vw-2rem),15rem)]"
                  onAdd={(typeName) => {
                    const newType = addResourceType(typeName);
                    if (newType) setType(newType.slug);
                  }}
                  addLabel="Type"
                  onEdit={editResourceType}
                  onDelete={deleteResourceType}
                />

                <span className="text-muted-foreground/40 select-none">·</span>

                {/* Folder / Collection */}
                <SearchableDropdown
                  value={collectionId}
                  onChange={(val) => setCollectionId(val)}
                  options={collectionOptions}
                  searchPlaceholder="Search collections..."
                  placeholder="Choose folder..."
                  title="Folders Selection"
                  align="left"
                  triggerClassName="border border-black/10 dark:border-white/10 bg-subtle-background/80 hover:bg-subtle-background hover:text-foreground text-muted-foreground px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-full shadow-none h-auto"
                  contentClassName="w-[min(calc(100vw-2rem),16rem)]"
                />
              </div>
            </div>

            {/* Distinct divider line */}
            <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />

            {/* 2. Tags Cell (Collapsible) */}
            <div className="p-4 sm:p-5 md:p-6 text-left pb-5 sm:pb-6">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setTagsOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer select-none group"
                  aria-expanded={tagsOpen}
                >
                  <Tag size={11} className="text-muted-foreground/80 group-hover:text-foreground" />
                  <span>Tags</span>
                  {selectedTags.length > 0 && (
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                      ({selectedTags.length})
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    className={cn(
                      "transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                      tagsOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
                <div className="flex items-center gap-2">
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTags([]);
                      }}
                      className="text-[10.5px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTagsOpen((prev) => !prev)}
                    className="text-[10.5px] font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 cursor-pointer select-none"
                  >
                    {tagsOpen ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Collapsed view preview: show selected tag pills */}
              {!tagsOpen && selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-[12px] sm:text-[12.5px] font-medium text-orange-700 dark:text-orange-300"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTags((current) => current.filter((id) => id !== tagId))
                          }
                          className="hover:text-red-500 cursor-pointer ml-0.5"
                          aria-label={`Remove ${tag.name}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Expanded view: full tags palette */}
              {tagsOpen && (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-0.5">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setSelectedTags((current) =>
                            active ? current.filter((id) => id !== tag.id) : [...current, tag.id],
                          )
                        }
                        className={cn(
                          "rounded-full px-3 py-1 text-[12px] sm:text-[12.5px] font-medium transition-all cursor-pointer select-none",
                          active
                            ? "bg-orange-500 font-semibold text-white"
                            : "border border-black/10 dark:border-white/10 bg-background text-muted-foreground hover:border-orange-500/40 hover:text-orange-500",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <>
                <div className="h-px w-full bg-black/10 dark:bg-white/[0.14] shrink-0" />
                <div className="p-4 bg-red-500/10 text-[12px] text-red-600 dark:text-red-400 leading-relaxed text-left">
                  <p>{error}</p>
                  {existingId && (
                    <button
                      type="button"
                      className="mt-1.5 font-medium underline hover:opacity-80 block cursor-pointer"
                      onClick={() => {
                        selectResource(existingId);
                        setAddOpen(false);
                        reset();
                      }}
                    >
                      Open existing resource →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Distinct vertical line before right action column (Desktop) */}
        <div className="hidden sm:block w-px bg-black/10 dark:bg-white/[0.14] shrink-0 self-stretch" />

        {/* Right Column: Close, Star & Submit Actions (Desktop: Last Column) */}
        <div className="hidden sm:flex w-14 md:w-16 shrink-0 bg-subtle-background/20 dark:bg-white/[0.015] self-stretch flex-col">
          <div className="flex-1 flex flex-col items-center gap-2.5 sm:gap-3 p-2 sm:p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                reset();
              }}
              className="flex size-9 sm:size-9.5 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 border border-border/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              aria-label="Close popup"
              title="Close"
            >
              <X size={15} />
            </button>

            {/* Star Icon / Recommend Button (Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsRecommended((prev) => !prev)}
                className={cn(
                  "flex size-9 sm:size-9.5 shrink-0 items-center justify-center rounded-full border border-border/80 bg-subtle-background transition-all cursor-pointer active:scale-95 shadow-2xs",
                  isRecommended
                    ? "text-orange-500 dark:text-orange-400 hover:border-foreground/30 hover:bg-subtle-background/80"
                    : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30",
                )}
                aria-label={isRecommended ? "Remove recommendation" : "Recommend resource"}
                title={isRecommended ? "Recommended by Admin (Click to remove)" : "Recommend tool (Admin)"}
              >
                <Star
                  size={14}
                  className={cn(
                    "transition-transform active:scale-90",
                    isRecommended && "fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400",
                  )}
                />
              </button>
            )}

            {/* Submit Button (Vertical Pill responsive to popup height) */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-9 sm:w-9.5 flex-1 min-h-12 items-center justify-center rounded-full bg-foreground text-background hover:bg-orange-500 hover:text-white transition-all shadow-xs active:scale-[0.96] cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
              title="Add Resource"
              aria-label="Add Resource"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin shrink-0" />
              ) : (
                <Plus size={18} className="shrink-0 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Bottom Action Bar: ADD on left, Star in middle, and Close on right */}
        <div className="sm:hidden shrink-0 border-t border-black/10 dark:border-white/[0.14] bg-background/95 dark:bg-[#121318]/95 backdrop-blur-md px-4 py-3 flex items-center gap-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {/* Add Button */}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-background hover:bg-orange-500 hover:text-white transition-all shadow-xs active:scale-[0.98] cursor-pointer select-none font-medium text-[13px] disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Add Resource"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin shrink-0" />
            ) : (
              <>
                <Plus size={16} className="shrink-0 stroke-[2.5]" />
                <span>Add Resource</span>
              </>
            )}
          </button>

          {/* Star / Admin Recommend Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsRecommended((prev) => !prev)}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-subtle-background transition-all cursor-pointer active:scale-95 shadow-2xs",
                isRecommended
                  ? "text-orange-500 dark:text-orange-400 border-orange-500/30 bg-orange-500/10"
                  : "text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30",
              )}
              aria-label={isRecommended ? "Remove recommendation" : "Recommend resource"}
              title={isRecommended ? "Recommended by Admin (Click to remove)" : "Recommend tool (Admin)"}
            >
              <Star
                size={16}
                className={cn(
                  "transition-transform active:scale-90",
                  isRecommended && "fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400",
                )}
              />
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              setAddOpen(false);
              reset();
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 border border-border/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Close popup"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </form>
    </Drawer>
  );
}
