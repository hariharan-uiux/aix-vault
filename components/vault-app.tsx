"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import { FloatingDock } from "@/components/dock/floating-dock";
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
    navigation,
    collections,
    isLoading,
  } = useVault();

  let title = "All Resources";
  if (navigation.kind === "collection") {
    title =
      collections.find((item) => item.id === navigation.collectionId)?.name ??
      "Collection";
  }
  if (navigation.kind === "category") {
    title = categoryById(navigation.categoryId)?.name ?? "Resources";
  }

  return (
    <div className="w-full px-3 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:pt-6 sm:pb-28 md:px-6 lg:px-8">
      {navigation.kind === "collection" ? (
        <div className="mb-4 sm:mb-6">
          <h1 className="text-[20px] font-medium tracking-tight sm:text-[24px]">{title}</h1>
        </div>
      ) : null}

      {/* Main Content Area (Cards) */}
      <ResourceList
        resources={result.visible}
        view={view}
        selectedId={selectedId}
        loading={isLoading && result.total === 0}
        onSelect={selectResource}
      />
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
      <FloatingDock />
      <ResourceDrawer />
      <ResourceForm />
      <SearchCommand />
      {toast ? <Toast message={toast} /> : null}
    </AppShell>
  );
}
