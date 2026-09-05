"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { useVault } from "@/lib/vault/store";
import { rankQuery, matchesQuery } from "@/lib/search";
import { categoryById, getResourcePricing } from "@/lib/taxonomy";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function SearchCommand() {
  const { commandOpen, setCommandOpen, resources, search, setSearch, selectResource } =
    useVault();
  const [query, setQuery] = useState(search);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (commandOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(search);
      setActive(0);
    }
  }, [commandOpen, search]);

  const results = useMemo(() => {
    return resources
      .filter((resource) => matchesQuery(resource, query))
      .sort((a, b) => rankQuery(b, query) - rankQuery(a, query))
      .slice(0, 8);
  }, [resources, query]);

  useEffect(() => {
    if (!commandOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCommandOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((value) => Math.max(value - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (results[active]) {
          selectResource(results[active].id);
        }
        setSearch(query);
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, results, active, query, selectResource, setCommandOpen, setSearch]);

  if (!commandOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[active]) {
      selectResource(results[active].id);
    }
    setSearch(query);
    setCommandOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[8vh] sm:items-start sm:px-4 sm:pt-[18vh] sm:pb-0">
      <button
        aria-label="Close search"
        className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-all"
        onClick={() => setCommandOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search resources"
        className="relative w-full max-w-[540px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/15 dark:shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-150"
      >
        {/* Header Search Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2.5 border-b border-border/70 px-3.5 py-2.5"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle-background border border-border/80 text-muted-foreground shadow-2xs">
            <Search size={13} />
          </div>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Search resources..."
            style={{ outline: "none", boxShadow: "none", border: "none" }}
            className="h-9 w-full bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border-none shadow-none p-0 m-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive(0);
                setSearch("");
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-border bg-subtle-background px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground shadow-2xs">
            ESC
          </kbd>
          <button
            type="button"
            onClick={() => setCommandOpen(false)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle-background text-muted-foreground hover:bg-subtle-background/80 hover:text-foreground border border-border/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </form>

        {/* Results list */}
        <ul className="max-h-[min(340px,50vh)] overflow-y-auto overscroll-contain p-1.5 space-y-0.5" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center">
              <p className="text-[13px] font-medium text-foreground">No resources found</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Try searching for a different keyword or domain
              </p>
            </li>
          ) : (
            results.map((resource, index) => {
              const isSelected = index === active;
              const category = categoryById(resource.categoryId);
              const pricing = getResourcePricing(resource);

              return (
                <li key={resource.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-orange-500/10 dark:bg-orange-400/15" : "hover:bg-subtle-background/60"
                    }`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      selectResource(resource.id);
                      setSearch(query);
                      setCommandOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ResourceIcon resource={resource} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-foreground">
                            {resource.name}
                          </span>
                          {pricing && (
                            <span className="shrink-0 rounded-full border border-border/70 bg-subtle-background px-2 py-0.2 text-[10px] font-medium text-muted-foreground">
                              {pricing}
                            </span>
                          )}
                        </div>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {resource.domain || resource.url}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {category && (
                        <span className="hidden sm:inline text-[11px] text-muted-foreground/80">
                          {category.name}
                        </span>
                      )}
                      {isSelected && (
                        <kbd className="hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border border-border/80 shadow-2xs">
                          ↵
                        </kbd>
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          )}
          {query.trim() && results.length > 0 && (
            <li className="pt-1 border-t border-border/50">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] text-muted-foreground hover:text-foreground hover:bg-subtle-background/60 transition-colors cursor-pointer"
                onClick={() => {
                  setSearch(query.trim());
                  setCommandOpen(false);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Search size={13} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    Filter vault for <strong className="font-semibold text-foreground">&quot;{query.trim()}&quot;</strong>
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                  View all
                </span>
              </button>
            </li>
          )}
        </ul>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-border/60 bg-subtle-background/40 px-3.5 py-2 text-[11px] text-muted-foreground">
          <span>
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.2 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-background px-1 py-0.2 font-mono text-[10px]">
                ↓
              </kbd>{" "}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.2 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.2 font-mono text-[10px]">
                esc
              </kbd>{" "}
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
