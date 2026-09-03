"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { categories, categoryById, resourceTypes, tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Meta = {
  title: string;
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
    deleteCategory,
    addResourceType,
    deleteResourceType,
  } = useVault();
  const defaultCategory = navigation.kind === "category" ? navigation.categoryId : "development";
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory);
  const [type, setType] = useState("tool");
  const [pricing, setPricing] = useState<"Free" | "Freemium">("Freemium");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState("");
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
        setName((current) => current || data.title);
        setDescription((current) => current || data.description);
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
    setCollectionId("");
    setError(null);
    setExistingId(null);
    setMetaNote(null);
    setSubmitting(false);
  }

  return (
    <Drawer
      open={addOpen}
      title="Add Resource"
      headerActions={
        <h3 className="text-[14px] font-medium text-foreground truncate">
          Add Resource
        </h3>
      }
      onClose={() => {
        setAddOpen(false);
        reset();
      }}
    >
      <form
        className="space-y-4 pt-4 sm:pt-5"
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
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">URL</span>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
            className="h-9 rounded-full bg-subtle-background/50 focus:bg-background text-[13px]"
            autoFocus
          />
        </label>
        {loadingMeta ? (
          <p className="text-[12px] text-subtle-foreground flex items-center gap-1.5 animate-pulse">
            <span>Detecting details…</span>
          </p>
        ) : null}
        {metaNote ? (
          <p className="text-[12px] text-muted-foreground bg-subtle-background/60 rounded-xl px-3 py-2 border border-border/60">
            {metaNote}
          </p>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Resource name"
            required
            className="h-9 rounded-full bg-subtle-background/50 focus:bg-background text-[13px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Brief summary of the tool or resource"
            rows={3}
            className="w-full rounded-2xl border border-border bg-subtle-background/50 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-subtle-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none transition-colors"
          />
        </label>

        {/* Category & Type in horizontal format */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
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
              triggerClassName="w-full justify-between h-9 rounded-full px-3 text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-3rem),260px)]"
              onAdd={(name) => {
                const newCat = addCategory(name);
                if (newCat) setCategoryId(newCat.id);
              }}
              addLabel="Category"
              onDelete={deleteCategory}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
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
              triggerClassName="w-full justify-between h-9 rounded-full px-3 text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-3rem),220px)]"
              onAdd={(name) => {
                const newType = addResourceType(name);
                if (newType) setType(newType.slug);
              }}
              addLabel="Type"
              onDelete={deleteResourceType}
            />
          </div>
        </div>

        {/* Pricing & Folder in horizontal format */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
              Pricing
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-subtle-background/50 p-1 border border-border h-9 items-center">
              {(["Free", "Freemium"] as const).map((p) => {
                const active = pricing === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPricing(p)}
                    className={cn(
                      "flex h-full items-center justify-center rounded-full text-[11.5px] font-medium text-center transition-all cursor-pointer select-none",
                      active
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

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
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
              triggerClassName="w-full justify-between h-9 rounded-full px-3 text-[13px] bg-subtle-background/50 border border-border hover:border-foreground/30 text-foreground font-normal"
              contentClassName="w-[min(calc(100vw-3rem),260px)]"
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 14).map((tag) => {
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
                    "rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors cursor-pointer",
                    active
                      ? "border-foreground bg-foreground text-background"
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
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12.5px] text-red-600 dark:text-red-400 leading-relaxed">
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

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setAddOpen(false);
              reset();
            }}
            className="h-9 px-4 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-9 px-4 text-[13px] inline-flex items-center gap-2"
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
