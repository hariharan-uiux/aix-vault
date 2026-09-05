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
import { cn } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

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

  const isGrid = view === "grid";
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingLockRef = useRef(false);

  useEffect(() => {
    if (!result.hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // 1. IntersectionObserver for viewport-aware loading
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingLockRef.current) {
          loadingLockRef.current = true;
          loadMore();
          setTimeout(() => {
            loadingLockRef.current = false;
          }, 250);
        }
      },
      {
        rootMargin: "450px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    // 2. Continuous scroll listener on scrollable <main> container for instant reactive response
    const mainEl = sentinel.closest("main");
    const handleScroll = () => {
      if (loadingLockRef.current || !result.hasMore) return;
      if (!mainEl) return;
      const { scrollTop, scrollHeight, clientHeight } = mainEl;
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadingLockRef.current = true;
        loadMore();
        setTimeout(() => {
          loadingLockRef.current = false;
        }, 250);
      }
    };

    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      observer.disconnect();
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [result.hasMore, loadMore]);

  return (
    <div className="w-full pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-28">
      <div
        className={cn(
          "mx-auto w-full max-w-[1800px]",
          isGrid
            ? "px-0 pt-0 xl:px-12 2xl:px-16"
            : "px-3 pt-4 sm:px-4 sm:pt-6 md:px-6 lg:px-8 xl:px-12 2xl:px-16",
        )}
      >
        {navigation.kind === "collection" ? (
          <div className="px-3 pt-4 pb-2 sm:px-4 sm:pt-6 md:px-6 xl:px-0">
            <h1 className="text-[20px] font-medium tracking-tight sm:text-[24px]">{title}</h1>
          </div>
        ) : null}

        {/* Main Content Area */}
        <ResourceList
          resources={result.visible}
          view={view}
          selectedId={selectedId}
          loading={isLoading && result.total === 0}
          onSelect={selectResource}
        />

        {/* Dynamic Viewport & Scroll Sentinel */}
        {result.hasMore ? (
          <div
            ref={sentinelRef}
            className="flex w-full items-center justify-center py-8"
          >
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-subtle-background/80 px-4 py-2 text-[12px] font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-subtle-background hover:text-foreground cursor-pointer"
            >
              <Loader2 size={13} className="animate-spin text-foreground" />
              <span>Loading more resources...</span>
            </button>
          </div>
        ) : result.total > 0 && result.visible.length >= result.total ? (
          <div className="flex w-full items-center justify-center py-8 text-center">
            <span className="text-[11.5px] font-mono text-muted-foreground/60">
              All {result.total} resources loaded
            </span>
          </div>
        ) : null}
      </div>
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
