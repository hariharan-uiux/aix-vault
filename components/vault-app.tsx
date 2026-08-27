"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import {
  CategoryFilter,
  FilterPopover,
  SortMenu,
  ViewToggle,
} from "@/components/filters/filters";
import { ResourceDrawer } from "@/components/resources/resource-drawer";
import { ResourceForm } from "@/components/resources/resource-form";
import { ResourceList } from "@/components/resources/resource-list";
import { SearchCommand } from "@/components/search/search-command";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { categoryById } from "@/lib/taxonomy";
import { useVault } from "@/lib/vault/store";

function MainPane() {
  const {
    result,
    view,
    selectedId,
    selectResource,
    loadMore,
    deferredSearch,
    navigation,
    collections,
  } = useVault();

  let title = "All Resources";
  if (navigation.kind === "saved") title = "Saved";
  if (navigation.kind === "collection") {
    title =
      collections.find((item) => item.id === navigation.collectionId)?.name ??
      "Collection";
  }
  if (navigation.kind === "category") {
    title = categoryById(navigation.categoryId)?.name ?? "Resources";
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 md:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <h1 className="text-[22px] font-medium tracking-tight sm:text-[28px]">{title}</h1>
          <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">
            {result.total} {result.total === 1 ? "resource" : "resources"}
            {deferredSearch ? ` for "${deferredSearch}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FilterPopover />
          <SortMenu />
          <div className="hidden sm:block">
            <ViewToggle />
          </div>
        </div>
      </div>
      <div className="mb-3 sm:mb-4">
        <CategoryFilter />
      </div>
      <div className="overflow-hidden rounded-[8px] border border-border">
        <ResourceList
          resources={result.visible}
          view={view}
          selectedId={selectedId}
          loading={false}
          onSelect={selectResource}
        />
      </div>
      {result.hasMore ? (
        <div className="flex justify-center py-4 sm:py-6">
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function VaultApp() {
  const { toast } = useVault();
  return (
    <AppShell>
      <MainPane />
      <ResourceDrawer />
      <ResourceForm />
      <SearchCommand />
      {toast ? <Toast message={toast} /> : null}
    </AppShell>
  );
}
