"use client";

import {
  seedCollectionResources,
  seedCollections,
  seedResources,
} from "@/db/seed/resources";
import { resourceInputSchema, type ResourceInput } from "@/lib/resources/schema";
import { filterResources, isDuplicate } from "@/lib/resources/service";
import { slugify, domainFromUrl, normalizeUrl } from "@/lib/utils";
import type {
  Collection,
  CollectionResource,
  Filters,
  Navigation,
  Resource,
  SortMode,
  ViewMode,
} from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "aix-vault:v1";

type Persisted = {
  extras: Resource[];
  deletedIds: string[];
  savedIds: string[];
  collections: Collection[];
  collectionResources: CollectionResource[];
  saveCounts: Record<string, number>;
  theme: "light" | "dark";
};

function readInitial(): Persisted {
  const fallback: Persisted = {
    extras: [],
    deletedIds: [],
    savedIds: [],
    collections: seedCollections,
    collectionResources: seedCollectionResources,
    saveCounts: {},
    theme: "dark",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "dark",
    };
  } catch {
    return fallback;
  }
}

function readInitialUrl(): {
  navigation: Navigation;
  search: string;
  filters: Filters;
  view: ViewMode;
  sort: SortMode;
} {
  if (typeof window === "undefined") {
    return {
      navigation: { kind: "category", categoryId: "development" },
      search: "",
      filters: { type: null, tagIds: [], free: false, openSource: false },
      view: "grid",
      sort: "recent",
    };
  }
  const params = new URLSearchParams(window.location.search);
  const saved = params.get("saved");
  const collection = params.get("collection");
  const category = params.get("category");
  const query = params.get("search") ?? params.get("q") ?? "";
  const tag = params.get("tag");
  const viewParam = params.get("view");
  const sortParam = params.get("sort");
  let navigation: Navigation = { kind: "category", categoryId: "development" };
  if (saved === "1") navigation = { kind: "saved" };
  else if (collection) navigation = { kind: "collection", collectionId: collection };
  else if (category) navigation = { kind: "category", categoryId: category };
  const filters: Filters = {
    type: null,
    tagIds: tag ? [tag] : [],
    free: false,
    openSource: false,
  };
  const view: ViewMode =
    viewParam === "grid" || viewParam === "compact" || viewParam === "list" ? viewParam : "grid";
  const sort: SortMode =
    sortParam === "name" || sortParam === "saved" || sortParam === "recent" ? sortParam : "recent";
  return { navigation, search: query, filters, view, sort };
}

type VaultContextValue = {
  resources: Resource[];
  collections: Collection[];
  savedIds: string[];
  navigation: Navigation;
  search: string;
  deferredSearch: string;
  filters: Filters;
  sort: SortMode;
  view: ViewMode;
  page: number;
  selectedId: string | null;
  sidebarOpen: boolean;
  addOpen: boolean;
  commandOpen: boolean;
  toast: string | null;
  theme: "light" | "dark";
  result: ReturnType<typeof filterResources>;
  selected: Resource | null;
  setNavigation: (navigation: Navigation) => void;
  setSearch: (value: string) => void;
  setFilters: (filters: Filters) => void;
  setSort: (sort: SortMode) => void;
  setView: (view: ViewMode) => void;
  loadMore: () => void;
  selectResource: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setAddOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  saveResource: (id: string) => void;
  addToCollection: (resourceId: string, collectionId: string) => void;
  createCollection: (name: string) => Collection;
  createResource: (input: ResourceInput) => { ok: true } | { ok: false; error: string; existingId?: string };
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  collectionResourceIds: (id: string) => string[];
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readInitial(), []);
  const [extras, setExtras] = useState<Resource[]>(initial.extras);
  const [deletedIds, setDeletedIds] = useState<string[]>(initial.deletedIds);
  const [savedIds, setSavedIds] = useState<string[]>(initial.savedIds);
  const [collections, setCollections] = useState<Collection[]>(initial.collections);
  const [collectionResources, setCollectionResources] =
    useState<CollectionResource[]>(initial.collectionResources);
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>(initial.saveCounts);
  const [navigation, setNavigation] = useState<Navigation>({ kind: "category", categoryId: "development" });
  const [search, setSearch] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: null, tagIds: [], free: false, openSource: false });
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(initial.theme);

  useEffect(() => {
    const url = readInitialUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavigation(url.navigation);
    setSearch(url.search);
    setDeferredSearch(url.search);
    setFilters(url.filters);
    setView(url.view);
    setSort(url.sort);
  }, []);

  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [navigation, deferredSearch, filters, sort]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((next: "light" | "dark") => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      const current = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...current, theme: next }),
      );
      window.localStorage.setItem("aix-vault:theme", next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload: Persisted = {
      extras,
      deletedIds,
      savedIds,
      collections,
      collectionResources,
      saveCounts,
      theme,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    extras,
    deletedIds,
    savedIds,
    collections,
    collectionResources,
    saveCounts,
    theme,
  ]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDeferredSearch(search), 200);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (navigation.kind === "category") params.set("category", navigation.categoryId);
    if (navigation.kind === "collection") params.set("collection", navigation.collectionId);
    if (navigation.kind === "saved") params.set("saved", "1");
    if (deferredSearch) params.set("search", deferredSearch);
    if (filters.tagIds[0]) params.set("tag", filters.tagIds[0]);
    if (view !== "grid") params.set("view", view);
    if (sort !== "recent") params.set("sort", sort);
    const next = params.toString();
    const url = next ? `/?${next}` : "/";
    window.history.replaceState(null, "", url);
  }, [navigation, deferredSearch, filters.tagIds, view, sort]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isCmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;

      if (isCmdK) {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (isSlash) {
        const target = event.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable);
        if (!isInput) {
          event.preventDefault();
          setCommandOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const resources = useMemo(() => {
    const extraIds = new Set(extras.map((item) => item.id));
    const merged = [
      ...seedResources.filter(
        (item) => !deletedIds.includes(item.id) && !extraIds.has(item.id),
      ),
      ...extras.filter((item) => !deletedIds.includes(item.id)),
    ];
    return merged.map((resource) => ({
      ...resource,
      saveCount: saveCounts[resource.id] ?? resource.saveCount,
    }));
  }, [deletedIds, extras, saveCounts]);

  const collectionResourceIds = useCallback(
    (id: string) =>
      collectionResources
        .filter((item) => item.collectionId === id)
        .map((item) => item.resourceId),
    [collectionResources],
  );

  const activeCollectionIds = useMemo(
    () =>
      navigation.kind === "collection" ? collectionResourceIds(navigation.collectionId) : [],
    [navigation, collectionResourceIds],
  );

  const result = useMemo(
    () =>
      filterResources({
        resources,
        navigation,
        collectionResourceIds: activeCollectionIds,
        savedIds,
        search: deferredSearch,
        filters,
        sort,
        page,
      }),
    [
      resources,
      navigation,
      activeCollectionIds,
      savedIds,
      deferredSearch,
      filters,
      sort,
      page,
    ],
  );

  const selected = resources.find((resource) => resource.id === selectedId) ?? null;

  const createResource = useCallback(
    (input: ResourceInput) => {
      const parsed = resourceInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }
      const data = parsed.data;
      let url: string;
      try {
        url = normalizeUrl(data.url);
      } catch {
        return { ok: false as const, error: "Enter a valid URL." };
      }
      const existing = isDuplicate(resources, url);
      if (existing) {
        return {
          ok: false as const,
          error: "This resource already exists.",
          existingId: existing.id,
        };
      }
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const resource: Resource = {
        id,
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
        url,
        domain: domainFromUrl(url),
        iconUrl: null,
        type: data.type,
        categoryId: data.categoryId,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
        isPublic: true,
        tagIds: data.tags,
        saveCount: 0,
      };
      setExtras((current) => [resource, ...current]);
      if (data.collectionId) {
        setCollectionResources((current) => [
          { collectionId: data.collectionId as string, resourceId: id, createdAt: now },
          ...current,
        ]);
      }
      setToast("Resource added.");
      setSelectedId(id);
      return { ok: true as const };
    },
    [resources],
  );

  const value: VaultContextValue = {
    resources,
    collections,
    savedIds,
    navigation,
    search,
    deferredSearch,
    filters,
    sort,
    view,
    page,
    selectedId,
    sidebarOpen,
    addOpen,
    commandOpen,
    toast,
    theme,
    result,
    selected,
    setNavigation: (next) => {
      setNavigation(next);
      setSidebarOpen(false);
    },
    setSearch,
    setFilters,
    setSort,
    setView,
    loadMore: () => setPage((current) => current + 1),
    selectResource: setSelectedId,
    setSidebarOpen,
    setAddOpen,
    setCommandOpen,
    setTheme,
    saveResource: (id) => {
      setSavedIds((current) => {
        const exists = current.includes(id);
        setSaveCounts((counts) => ({
          ...counts,
          [id]: Math.max(0, (counts[id] ?? 0) + (exists ? -1 : 1)),
        }));
        setToast(exists ? "Removed from Saved." : "Saved.");
        return exists ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    addToCollection: (resourceId, collectionId) => {
      setCollectionResources((current) => {
        if (current.some((item) => item.collectionId === collectionId && item.resourceId === resourceId)) {
          return current;
        }
        setToast("Added to collection.");
        return [
          { collectionId, resourceId, createdAt: new Date().toISOString() },
          ...current,
        ];
      });
    },
    createCollection: (name) => {
      const now = new Date().toISOString();
      const collection: Collection = {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        description: "",
        icon: null,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
      };
      setCollections((current) => [...current, collection]);
      return collection;
    },
    createResource,
    updateResource: (id, patch) => {
      setExtras((current) => {
        const exists = current.some((item) => item.id === id);
        if (exists) {
          return current.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          );
        }
        const seeded = seedResources.find((item) => item.id === id);
        if (!seeded) return current;
        return [{ ...seeded, ...patch, updatedAt: new Date().toISOString() }, ...current];
      });
    },
    deleteResource: (id) => {
      setExtras((current) => current.filter((item) => item.id !== id));
      setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
      setSelectedId(null);
      setToast("Resource deleted.");
    },
    collectionResourceIds,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const value = useContext(VaultContext);
  if (!value) throw new Error("useVault must be used within VaultProvider");
  return value;
}
