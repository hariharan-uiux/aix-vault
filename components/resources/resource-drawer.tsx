"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { categoryById, tagById, typeBySlug } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { useState } from "react";

export function ResourceDrawer() {
  const {
    selected,
    selectResource,
    savedIds,
    saveResource,
    collections,
    addToCollection,
    deleteResource,
  } = useVault();
  const [collectionId, setCollectionId] = useState("");

  if (!selected) {
    return (
      <Drawer open={false} title="Resource" onClose={() => selectResource(null)}>
        {null}
      </Drawer>
    );
  }

  const category = categoryById(selected.categoryId);
  const type = typeBySlug(selected.type);
  const saved = savedIds.includes(selected.id);

  return (
    <Drawer open title={selected.name} onClose={() => selectResource(null)}>
      <div className="flex flex-col items-center text-center">
        <ResourceIcon resource={selected} size={48} />
        <h2 className="mt-4 text-[24px] font-medium tracking-tight">{selected.name}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {category?.name}
          {type ? ` · ${type.name}` : ""}
        </p>
        <p className="mt-1 text-[13px] text-subtle-foreground">{selected.domain}</p>
        <p className="mt-4 max-w-sm text-[14px] text-muted-foreground">
          {selected.description}
        </p>
        <div className="mt-5 flex w-full gap-2">
          <a
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[6px] bg-foreground text-[13px] font-medium text-background"
          >
            Open Website
            <ExternalLink size={14} />
          </a>
          <Button
            variant={saved ? "subtle" : "outline"}
            className="flex-1"
            onClick={() => saveResource(selected.id)}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
        <div className="mt-5 w-full text-left">
          <p className="mb-2 text-[12px] text-muted-foreground">Collection</p>
          <div className="flex gap-2">
            <select
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
              className="h-9 flex-1 rounded-[6px] border border-border bg-background px-2 text-[13px]"
            >
              <option value="">Choose collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={!collectionId}
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
        <div className="mt-5 w-full text-left">
          <p className="mb-2 text-[12px] text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.tagIds.map((id) => (
              <Badge key={id}>{tagById(id)?.name ?? id}</Badge>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-8 text-muted-foreground"
          onClick={() => deleteResource(selected.id)}
        >
          Delete resource
        </Button>
      </div>
    </Drawer>
  );
}
