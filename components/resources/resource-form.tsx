"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { categories, resourceTypes, tags } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Meta = {
  title: string;
  description: string;
  domain: string;
  iconUrl: string | null;
  canonicalUrl: string;
};

export function ResourceForm() {
  const { addOpen, setAddOpen, createResource, selectResource, collections } = useVault();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("design");
  const [type, setType] = useState("tool");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [metaNote, setMetaNote] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

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

  function reset() {
    setUrl("");
    setName("");
    setDescription("");
    setCategoryId("design");
    setType("tool");
    setSelectedTags([]);
    setCollectionId("");
    setError(null);
    setExistingId(null);
    setMetaNote(null);
  }

  return (
    <Dialog
      open={addOpen}
      title="Add Resource"
      onClose={() => {
        setAddOpen(false);
        reset();
      }}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const result = createResource({
            url,
            name,
            description,
            categoryId,
            type,
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
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">URL</span>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
          />
        </label>
        {loadingMeta ? (
          <p className="text-[12px] text-subtle-foreground">Detecting details…</p>
        ) : null}
        {metaNote ? <p className="text-[12px] text-muted-foreground">{metaNote}</p> : null}
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">Description</span>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">Category</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-9 w-full rounded-[6px] border border-border bg-background px-2 text-[13px]"
            >
              {categories
                .filter((category) => !category.parentId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-9 w-full rounded-[6px] border border-border bg-background px-2 text-[13px]"
            >
              {resourceTypes.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <p className="mb-1 text-[12px] text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 12).map((tag) => {
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
                    "rounded-full border border-border px-2 py-0.5 text-[12px]",
                    active && "border-foreground bg-foreground text-background",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">
            Collection
          </span>
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className="h-9 w-full rounded-[6px] border border-border bg-background px-2 text-[13px]"
          >
            <option value="">Optional</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p className="text-[13px] text-foreground">
            {error}{" "}
            {existingId ? (
              <button
                type="button"
                className="underline"
                onClick={() => {
                  selectResource(existingId);
                  setAddOpen(false);
                  reset();
                }}
              >
                Open existing resource
              </button>
            ) : null}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAddOpen(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit">Add Resource</Button>
        </div>
      </form>
    </Dialog>
  );
}
