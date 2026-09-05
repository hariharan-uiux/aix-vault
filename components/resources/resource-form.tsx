"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { categoryById, tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn, cleanResourceName } from "@/lib/utils";
import { Loader2 } from "lucide-react";
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState(defaultCollectionId);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [metaNote, setMetaNote] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (addOpen) {
      if (navigation.kind === "category") {
        setCategoryId(navigation.categoryId);
      } else if (navigation.kind === "collection") {
        setCollectionId(navigation.collectionId);
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

  function reset() {
    setUrl("");
    setName("");
    setDescription("");
    setCategoryId(defaultCategory);
    setType("tool");
    setPricing("Freemium");
    setSelectedTags([]);
    setCollectionId(navigation.kind === "collection" ? navigation.collectionId : "");
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
      headerActions={
        <h3 className="text-[14px] font-medium text-foreground truncate max-w-[240px] sm:max-w-[280px]">
          {currentCollection ? (
            <span>
              Add Tool to <span className="font-semibold text-orange-600 dark:text-orange-400">{currentCollection.name}</span>
            </span>
          ) : (
            "Add Resource"
          )}
        </h3>
      }
      onClose={() => {
        setAddOpen(false);
        reset();
      }}
    >
      <form
        className="space-y-2 sm:space-y-3.5 pt-1.5 sm:pt-4"
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
      >
        <label className="block">
          <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">URL</span>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
            className="h-8 sm:h-9 rounded-full bg-subtle-background/50 focus:bg-background text-[12px] sm:text-[13px] px-3"
            autoFocus
          />
        </label>
        {loadingMeta ? (
          <p className="text-[11px] sm:text-[12px] text-subtle-foreground flex items-center gap-1.5 animate-pulse py-0.5">
            <span>Detecting details…</span>
          </p>
        ) : null}
        {metaNote ? (
          <p className="text-[11px] sm:text-[12px] text-muted-foreground bg-subtle-background/60 rounded-xl px-2.5 py-1.5 border border-border/60">
            {metaNote}
          </p>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">Name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Resource name"
            required
            className="h-8 sm:h-9 rounded-full bg-subtle-background/50 focus:bg-background text-[12px] sm:text-[13px] px-3"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">
            Description <span className="font-normal text-muted-foreground/60">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Brief summary of the tool or resource"
            rows={2}
            className="w-full rounded-xl sm:rounded-2xl border border-border bg-subtle-background/50 px-3 py-1.5 sm:py-2 text-[12px] sm:text-[13px] text-foreground placeholder:text-subtle-foreground focus:bg-background outline-none focus:outline-none focus:border-foreground/50 resize-none transition-colors min-h-[42px] sm:min-h-[58px]"
          />
        </label>

        {/* Category & Type in horizontal format */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div>
            <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">
              Category
            </span>
            <SearchableDropdown
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              options={categoryOptions}
              searchPlaceholder="Search categories..."
              placeholder="Select category"
              align="left"
              className="w-full"
              triggerClassName="w-full justify-between h-8 sm:h-9 rounded-full px-2.5 sm:px-3 text-[12px] sm:text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-2.5rem),260px)]"
              onAdd={(name) => {
                const newCat = addCategory(name);
                if (newCat) setCategoryId(newCat.id);
              }}
              addLabel="Category"
              onEdit={editCategory}
              onDelete={deleteCategory}
            />
          </div>

          <div>
            <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">
              Type
            </span>
            <SearchableDropdown
              value={type}
              onChange={(val) => setType(val)}
              options={typeOptions}
              searchPlaceholder="Search types..."
              placeholder="Select type"
              align="right"
              className="w-full"
              triggerClassName="w-full justify-between h-8 sm:h-9 rounded-full px-2.5 sm:px-3 text-[12px] sm:text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-2.5rem),220px)]"
              onAdd={(name) => {
                const newType = addResourceType(name);
                if (newType) setType(newType.slug);
              }}
              addLabel="Type"
              onEdit={editResourceType}
              onDelete={deleteResourceType}
            />
          </div>
        </div>

        {/* Pricing & Folder in horizontal format */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div>
            <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">
              Pricing
            </span>
            <div className="grid grid-cols-2 gap-0.5 sm:gap-1 rounded-full bg-subtle-background/50 p-0.5 sm:p-1 border border-border h-8 sm:h-9 items-center">
              {(["Free", "Freemium"] as const).map((p) => {
                const active = pricing === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPricing(p)}
                    className={cn(
                      "flex h-full items-center justify-center rounded-full text-[11px] sm:text-[11.5px] font-medium text-center transition-all cursor-pointer select-none",
                      active
                        ? "bg-background text-foreground font-semibold border border-border/80 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground border border-transparent",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[11px] sm:text-[12px] font-medium text-muted-foreground">
              Folder / Collection
            </span>
            <SearchableDropdown
              value={collectionId}
              onChange={(val) => setCollectionId(val)}
              options={collectionOptions}
              searchPlaceholder="Search collections..."
              placeholder="Choose folder..."
              align="right"
              className="w-full"
              triggerClassName="w-full justify-between h-8 sm:h-9 rounded-full px-2.5 sm:px-3 text-[12px] sm:text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-2.5rem),260px)]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">
              Tags {selectedTags.length > 0 && <span className="text-orange-600 dark:text-orange-400 font-semibold">({selectedTags.length})</span>}
            </span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-[10.5px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-nowrap sm:flex-wrap gap-1.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none -mx-0.5 px-0.5">
            {tags.slice(0, 18).map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTags((current) =>
                      active
                        ? current.filter((id) => id !== tag.id)
                        : [...current, tag.id],
                    )
                  }
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] sm:text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap select-none active:scale-95",
                    active
                      ? "border-orange-500/50 bg-orange-500/20 text-orange-700 dark:border-orange-400/50 dark:bg-orange-400/25 dark:text-orange-300 font-medium"
                      : "border-border bg-subtle-background/50 text-muted-foreground hover:bg-subtle-background hover:text-foreground",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-[12px] text-red-600 dark:text-red-400 leading-relaxed">
            <p>{error}</p>
            {existingId ? (
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
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setAddOpen(false);
              reset();
            }}
            className="h-8 sm:h-9 px-3.5 sm:px-4 text-[12px] sm:text-[13px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-8 sm:h-9 px-3.5 sm:px-4 text-[12px] sm:text-[13px] inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin shrink-0" />
                <span>Adding…</span>
              </>
            ) : (
              <span>Add Resource</span>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
