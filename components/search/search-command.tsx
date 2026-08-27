"use client";

import { ResourceIcon } from "@/components/resources/resource-icon";
import { useVault } from "@/lib/vault/store";
import { rankQuery } from "@/lib/search";
import { matchesQuery } from "@/lib/search";
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
      if (event.key === "Enter" && results[active]) {
        event.preventDefault();
        selectResource(results[active].id);
        setSearch(query);
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, results, active, query, selectResource, setCommandOpen, setSearch]);

  if (!commandOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-4 pt-[10vh] sm:items-start sm:px-4 sm:pt-[18vh] sm:pb-0">
      <button
        aria-label="Close search"
        className="absolute inset-0 bg-[var(--overlay)]"
        onClick={() => setCommandOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search resources"
        className="relative w-full max-w-[520px] overflow-hidden rounded-[10px] border border-border bg-background shadow-[var(--shadow)]"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={16} className="text-subtle-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Search resources..."
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-subtle-foreground"
          />
          <span className="hidden text-[11px] text-subtle-foreground sm:inline">⌘K</span>
          <button
            type="button"
            onClick={() => setCommandOpen(false)}
            className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No resources found.
            </li>
          ) : (
            results.map((resource, index) => (
              <li key={resource.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-left ${
                    index === active ? "bg-subtle-background" : ""
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    selectResource(resource.id);
                    setSearch(query);
                    setCommandOpen(false);
                  }}
                >
                  <ResourceIcon resource={resource} size={32} />
                  <span>
                    <span className="block text-[14px] font-medium">{resource.name}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {resource.domain}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
