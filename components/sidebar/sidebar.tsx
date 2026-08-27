"use client";

import { useVault } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { Bookmark, Code2, Folder, Palette } from "lucide-react";

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-muted-foreground transition-colors duration-[120ms] hover:bg-subtle-background hover:text-foreground",
        active && "bg-subtle-background font-medium text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Sidebar() {
  const { navigation, setNavigation, collections, createCollection } = useVault();

  const isDev =
    navigation.kind === "category" &&
    (navigation.categoryId === "development" ||
      navigation.categoryId.startsWith("development-"));

  const isDesign =
    navigation.kind === "category" &&
    (navigation.categoryId === "design" ||
      navigation.categoryId.startsWith("design-"));

  return (
    <nav aria-label="Vault" className="flex h-full flex-col gap-6 px-3 py-4">
      {/* Dev / Design Toggle */}
      <div>
        <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
          Platform
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-[8px] border border-border bg-subtle-background p-1">
          <button
            type="button"
            onClick={() => setNavigation({ kind: "category", categoryId: "development" })}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[6px] py-1.5 text-[13px] font-medium transition-all duration-[120ms]",
              isDev
                ? "border border-border/50 bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Code2 size={14} />
            <span>Dev</span>
          </button>
          <button
            type="button"
            onClick={() => setNavigation({ kind: "category", categoryId: "design" })}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[6px] py-1.5 text-[13px] font-medium transition-all duration-[120ms]",
              isDesign
                ? "border border-border/50 bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Palette size={14} />
            <span>Design</span>
          </button>
        </div>
      </div>

      {/* Collections */}
      <div className="flex flex-1 flex-col">
        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
          Collections
        </p>
        <div className="flex flex-col gap-0.5">
          {collections.map((collection) => (
            <NavButton
              key={collection.id}
              active={
                navigation.kind === "collection" &&
                navigation.collectionId === collection.id
              }
              onClick={() =>
                setNavigation({ kind: "collection", collectionId: collection.id })
              }
            >
              <Folder size={14} />
              <span className="truncate">{collection.name}</span>
            </NavButton>
          ))}
        </div>
        <form
          className="mt-1.5 px-1"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("name") as HTMLInputElement;
            const name = input.value.trim();
            if (!name) return;
            const created = createCollection(name);
            input.value = "";
            setNavigation({ kind: "collection", collectionId: created.id });
          }}
        >
          <input
            name="name"
            placeholder="+ New collection"
            aria-label="New collection"
            className="h-8 w-full rounded-[6px] border border-transparent bg-transparent px-2 text-[13px] text-foreground placeholder:text-subtle-foreground hover:border-border focus:border-border"
          />
        </form>
      </div>

      {/* Saved */}
      <div>
        <NavButton
          active={navigation.kind === "saved"}
          onClick={() => setNavigation({ kind: "saved" })}
        >
          <Bookmark size={14} />
          Saved
        </NavButton>
      </div>
    </nav>
  );
}
