"use client";

import {
  seedResources,
} from "@/db/seed/resources";
import { resourceInputSchema, type ResourceInput } from "@/lib/resources/schema";
import { filterResources, isDuplicate } from "@/lib/resources/service";
import { slugify, domainFromUrl, normalizeUrl } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/auth/types";
import type {
  Category,
  Collection,
  CollectionResource,
  Filters,
  Navigation,
  Platform,
  Resource,
  ResourceType,
  SortMode,
  ViewMode,
} from "@/types";
import {
  getAllCategories,
  getAllResourceTypes,
  registerCategory,
  unregisterCategory,
  registerResourceType,
  unregisterResourceType,
  categoryById,
  typeBySlug,
} from "@/lib/taxonomy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

const STORAGE_KEY = "aix-vault:v2";
const REMOTE_CACHE_KEY = "aix-vault:remote-cache";

function readRemoteCache(): Resource[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type Persisted = {
  extras: Resource[];
  deletedIds: string[];
  deletedCollectionIds?: string[];
  savedIds: string[];
  collections: Collection[];
  collectionResources: CollectionResource[];
  saveCounts: Record<string, number>;
  theme: "light" | "dark";
  iconMode?: "mono" | "color";
  role?: UserRole;
  customCategories?: Category[];
  deletedCategoryIds?: string[];
  customResourceTypes?: ResourceType[];
  deletedResourceTypeIds?: string[];
  recommendedIds?: string[];
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readInitial(): Persisted {
  const fallbackTheme = getSystemTheme();
  const fallback: Persisted = {
    extras: [],
    deletedIds: [],
    deletedCollectionIds: [],
    savedIds: [],
    collections: [],
    collectionResources: [],
    saveCounts: {},
    theme: fallbackTheme,
    iconMode: "color",
    role: "user",
    customCategories: [],
    deletedCategoryIds: [],
    customResourceTypes: [],
    deletedResourceTypeIds: [],
    recommendedIds: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    // Read from v2, or check legacy v1 if needed
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("aix-vault:v1");
    const explicitTheme = window.localStorage.getItem("aix-vault:theme");
    if (!raw && !explicitTheme) return fallback;
    const parsed = raw ? JSON.parse(raw) : {};

    const deletedColls = new Set<string>(parsed.deletedCollectionIds || []);
    const storedCollections: Collection[] = Array.isArray(parsed.collections)
      ? parsed.collections.filter((c: Collection) => !deletedColls.has(c.id))
      : [];

    const storedCollRes: CollectionResource[] = Array.isArray(parsed.collectionResources)
      ? parsed.collectionResources
      : [];

    const storedExtras: Resource[] = Array.isArray(parsed.extras)
      ? parsed.extras
      : [];

    const storedRecommendedIds: string[] = Array.isArray(parsed.recommendedIds)
      ? parsed.recommendedIds
      : [];

    const isDemoAdmin = window.localStorage.getItem("aix-vault:demo-admin") === "true";
    const initialRole: UserRole = isDemoAdmin || parsed.role === "admin" ? "admin" : "user";

    const storedCustomCats: Category[] = Array.isArray(parsed.customCategories) ? parsed.customCategories : [];
    const storedDeletedCatIds: string[] = Array.isArray(parsed.deletedCategoryIds) ? parsed.deletedCategoryIds : [];
    const storedCustomTypes: ResourceType[] = Array.isArray(parsed.customResourceTypes) ? parsed.customResourceTypes : [];
    const storedDeletedTypeIds: string[] = Array.isArray(parsed.deletedResourceTypeIds) ? parsed.deletedResourceTypeIds : [];

    storedCustomCats.forEach(registerCategory);
    storedDeletedCatIds.forEach(unregisterCategory);
    storedCustomTypes.forEach(registerResourceType);
    storedDeletedTypeIds.forEach(unregisterResourceType);

    const resolvedTheme: "light" | "dark" =
      parsed.theme === "light" || parsed.theme === "dark"
        ? parsed.theme
        : explicitTheme === "light" || explicitTheme === "dark"
        ? explicitTheme
        : fallbackTheme;

    const resolvedIconMode: "mono" | "color" =
      parsed.iconMode === "mono" || parsed.iconMode === "color"
        ? parsed.iconMode
        : "color";

    return {
      ...fallback,
      ...parsed,
      extras: storedExtras,
      collections: storedCollections,
      collectionResources: storedCollRes,
      deletedCollectionIds: Array.from(deletedColls),
      customCategories: storedCustomCats,
      deletedCategoryIds: storedDeletedCatIds,
      customResourceTypes: storedCustomTypes,
      deletedResourceTypeIds: storedDeletedTypeIds,
      recommendedIds: storedRecommendedIds,
      theme: resolvedTheme,
      iconMode: resolvedIconMode,
      role: initialRole,
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
      navigation: { kind: "all" },
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
  const platformParam = params.get("platform");
  const platform: Platform | undefined =
    platformParam === "development" || platformParam === "design" || platformParam === "all"
      ? platformParam
      : undefined;

  let navigation: Navigation = { kind: "all" };
  if (saved === "1") navigation = { kind: "saved", ...(platform ? { platform } : {}) };
  else if (collection) navigation = { kind: "collection", collectionId: collection, ...(platform ? { platform } : {}) };
  else if (category === "all") navigation = { kind: "all" };
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
    sortParam === "name" || sortParam === "recent" ? sortParam : "recent";
  return { navigation, search: query, filters, view, sort };
}

type VaultContextValue = {
  resources: Resource[];
  isLoading: boolean;
  isSyncing: boolean;
  isDatabaseConnected: boolean;
  lastSyncedAt: Date | null;
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
  sidebarCollapsed: boolean;
  addOpen: boolean;
  folderAddOpen: boolean;
  commandOpen: boolean;
  authModalOpen: boolean;
  toast: string | null;
  setToast: (toast: string | null) => void;
  theme: "light" | "dark";
  iconMode: "mono" | "color";
  role: UserRole;
  isAdmin: boolean;
  currentUser: { id: string; email: string | null } | null;
  result: ReturnType<typeof filterResources>;
  selected: Resource | null;
  setNavigation: (navigation: Navigation) => void;
  goBack: () => void;
  setSearch: (value: string) => void;
  setFilters: (filters: Filters) => void;
  setSort: (sort: SortMode) => void;
  setView: (view: ViewMode) => void;
  loadMore: () => void;
  selectResource: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  setAddOpen: (open: boolean) => void;
  setFolderAddOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark", event?: React.MouseEvent | MouseEvent) => void;
  setIconMode: (mode: "mono" | "color") => void;
  loginAsAdmin: (email: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveResource: (id: string) => void;
  addToCollection: (resourceId: string, collectionId: string) => void;
  addResourcesToCollection: (resourceIds: string[], collectionId: string) => void;
  removeResourcesFromCollection: (resourceIds: string[], collectionId: string) => void;
  isSelectMode: boolean;
  selectedResourceIds: string[];
  setSelectMode: (active: boolean) => void;
  toggleSelectResource: (id: string) => void;
  selectResources: (ids: string[]) => void;
  deselectResources: (ids: string[]) => void;
  selectAllVisible: (ids?: string[]) => void;
  clearSelection: () => void;
  createCollection: (name: string) => Collection | null;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  createResource: (input: ResourceInput) => Promise<{ ok: true } | { ok: false; error: string; existingId?: string }>;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  toggleRecommendResource: (id: string, e?: React.MouseEvent) => void;
  deleteResource: (id: string) => void;
  collectionResourceIds: (id: string) => string[];
  categories: Category[];
  resourceTypes: ResourceType[];
  addCategory: (name: string, parentId?: string) => Category | null;
  editCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  addResourceType: (name: string) => ResourceType | null;
  editResourceType: (idOrSlug: string, newName: string) => void;
  deleteResourceType: (id: string) => void;
  syncLocalToCloud: () => Promise<{ ok: boolean; syncedCount?: number; error?: string }>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

function enrichResourceTags(resource: Resource): string[] {
  const tags = new Set<string>(resource.tagIds || []);
  const text = `${resource.name} ${resource.description || ""} ${resource.type || ""} ${resource.categoryId || ""}`.toLowerCase();

  if (text.includes("react")) tags.add("react");
  if (text.includes("figma")) tags.add("figma");
  if (resource.type === "3d" || text.includes("3d") || text.includes("three.js")) tags.add("3d");
  if (
    resource.type === "component-library" ||
    resource.type === "ui-kit" ||
    text.includes("component")
  )
    tags.add("components");
  if (resource.type === "icon-library" || text.includes("icon")) tags.add("icons");
  if (resource.type === "font" || text.includes("font") || text.includes("typeface"))
    tags.add("typography");
  if (resource.type === "animation" || text.includes("animat") || text.includes("motion"))
    tags.add("animation");
  if (
    resource.type?.startsWith("ai") ||
    text.includes(" ai ") ||
    text.includes("artificial intelligence") ||
    text.includes("gpt")
  )
    tags.add("ai");
  if (resource.type === "design-system" || text.includes("design system"))
    tags.add("design-system");
  if (text.includes("tailwind") || text.includes("css")) tags.add("css");
  if (text.includes("saas")) tags.add("saas");
  if (text.includes("mobile")) tags.add("mobile");
  if (text.includes("minimal")) tags.add("minimal");
  if (resource.type === "illustration" || text.includes("illustration"))
    tags.add("illustration");
  if (resource.type === "color" || text.includes("color") || text.includes("palette"))
    tags.add("color");
  if (text.includes("photo") || text.includes("unsplash")) tags.add("photos");
  if (text.includes("productivity") || text.includes("workflow")) tags.add("productivity");
  if (text.includes("collaboration") || text.includes("collaborative"))
    tags.add("collaboration");
  if (text.includes("prototype") || text.includes("prototyping")) tags.add("prototype");
  if (text.includes("research")) tags.add("research");

  return Array.from(tags);
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<Resource[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletedCollectionIds, setDeletedCollectionIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionResources, setCollectionResources] = useState<CollectionResource[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>(() => getAllCategories());
  const [resourceTypes, setResourceTypesState] = useState<ResourceType[]>(() => getAllResourceTypes());
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [navigation, setNavigation] = useState<Navigation>({ kind: "all" });
  const [navHistory, setNavHistory] = useState<Navigation[]>([]);
  const [lastCategoryNav, setLastCategoryNav] = useState<Navigation>({ kind: "all" });
  const [search, setSearch] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: null, tagIds: [], free: false, openSource: false });
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [folderAddOpen, setFolderAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("aix-vault:v1");
        const explicitTheme = window.localStorage.getItem("aix-vault:theme");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.theme === "light" || parsed.theme === "dark") return parsed.theme;
        }
        if (explicitTheme === "light" || explicitTheme === "dark") return explicitTheme;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch {
        return "dark";
      }
    }
    return "dark";
  });

  const [iconMode, setIconModeState] = useState<"mono" | "color">(() => {
    if (typeof window !== "undefined") {
      try {
        const explicit = window.localStorage.getItem("aix-vault:icon-mode");
        if (explicit === "mono" || explicit === "color") return explicit;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.iconMode === "mono" || parsed.iconMode === "color") return parsed.iconMode;
        }
      } catch {
        return "color";
      }
    }
    return "color";
  });

  const setIconMode = useCallback((next: "mono" | "color") => {
    setIconModeState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("aix-vault:icon-mode", next);
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const cur = raw ? JSON.parse(raw) : {};
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, iconMode: next }));
      } catch {}
    }
  }, []);

  // Role and Auth State
  const [role, setRole] = useState<UserRole>("user");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string | null } | null>(null);
  const [remoteResources, setRemoteResources] = useState<Resource[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(() => hasSupabaseConfig());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const isHydratedRef = useRef(false);

  const isAdmin = role === "admin";

  useEffect(() => {
    // 1. Read persisted state from localStorage on client mount
    const persisted = readInitial();
    if (persisted.extras.length > 0) setExtras(persisted.extras);
    if (persisted.deletedIds.length > 0) setDeletedIds(persisted.deletedIds);
    if (persisted.deletedCollectionIds && persisted.deletedCollectionIds.length > 0) {
      setDeletedCollectionIds(persisted.deletedCollectionIds);
    }
    if (persisted.savedIds.length > 0) setSavedIds(persisted.savedIds);
    if (persisted.recommendedIds && persisted.recommendedIds.length > 0) {
      setRecommendedIds(persisted.recommendedIds);
    }
    if (persisted.collections.length > 0) setCollections(persisted.collections);
    if (persisted.collectionResources.length > 0) setCollectionResources(persisted.collectionResources);
    if (
      (persisted.customCategories && persisted.customCategories.length > 0) ||
      (persisted.deletedCategoryIds && persisted.deletedCategoryIds.length > 0)
    ) {
      setCategoriesState(getAllCategories(persisted.customCategories, persisted.deletedCategoryIds));
    }
    if (
      (persisted.customResourceTypes && persisted.customResourceTypes.length > 0) ||
      (persisted.deletedResourceTypeIds && persisted.deletedResourceTypeIds.length > 0)
    ) {
      setResourceTypesState(getAllResourceTypes(persisted.customResourceTypes, persisted.deletedResourceTypeIds));
    }
    if (Object.keys(persisted.saveCounts).length > 0) setSaveCounts(persisted.saveCounts);
    if (persisted.theme) setThemeState(persisted.theme);
    if (persisted.iconMode) setIconModeState(persisted.iconMode);
    if (persisted.role) setRole(persisted.role);

    // Read cached remote resources so data & counts are instant
    const cachedRemote = readRemoteCache();
    if (cachedRemote && cachedRemote.length > 0) {
      setRemoteResources(cachedRemote);
    }

    // 2. Read URL params
    const url = readInitialUrl();
    setNavigation(url.navigation);
    if (url.navigation.kind === "category" || url.navigation.kind === "all") {
      setLastCategoryNav(url.navigation);
    }
    setSearch(url.search);
    setDeferredSearch(url.search);
    setFilters(url.filters);
    setView(url.view);
    setSort(url.sort);

    isHydratedRef.current = true;
  }, []);

  // Hydrate Supabase Session & Remote Data if configured
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? null });
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            const resolvedRole: UserRole =
              profile?.role === "admin" || session.user.app_metadata?.role === "admin"
                ? "admin"
                : "user";
            setRole(resolvedRole);
          });
      }
    });

    // Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? null });
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        const resolvedRole: UserRole =
          profile?.role === "admin" || session.user.app_metadata?.role === "admin"
            ? "admin"
            : "user";
        setRole(resolvedRole);
      } else {
        setCurrentUser(null);
        if (window.localStorage.getItem("aix-vault:demo-admin") !== "true") {
          setRole("user");
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshResources = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    try {
      let fetchedResources: Resource[] = [];
      const supabase = getSupabaseClient();
      if (supabase) {
        setIsDatabaseConnected(true);
        try {
          const { data: resData, error } = await supabase
            .from("resources")
            .select(`
              *,
              resource_tags ( tag_id )
            `)
            .order("created_at", { ascending: false });

          if (!error && resData) {
            type Row = {
              id: string;
              name: string;
              slug: string;
              description: string | null;
              url: string;
              domain: string;
              icon_url: string | null;
              type: Resource["type"];
              category_id: string;
              created_by: string | null;
              created_at: string;
              updated_at: string;
              is_public: boolean;
              resource_tags?: { tag_id: string }[];
            };
            fetchedResources = (resData as unknown as Row[]).map((r) => {
              const rawTags = Array.isArray(r.resource_tags) ? r.resource_tags.map((t) => t.tag_id) : [];
              const hasRecommendedTag = rawTags.includes("admin-recommended");
              const cleanTags = rawTags.filter((t) => t !== "admin-recommended");

              return {
                id: r.id,
                name: r.name,
                slug: r.slug,
                description: r.description ?? "",
                url: r.url,
                domain: r.domain,
                iconUrl: r.icon_url,
                type: r.type,
                categoryId: r.category_id || "",
                createdBy: r.created_by,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                isPublic: r.is_public,
                tagIds: cleanTags,
                saveCount: 0,
                pricing: (r as unknown as Record<string, unknown>).pricing === "Free" ? "Free" : "Freemium",
                isRecommended: Boolean((r as unknown as Record<string, unknown>).is_recommended) || hasRecommendedTag,
              };
            });
          }
        } catch {
          // Fall back to /api/resources
        }
      }

      if (fetchedResources.length === 0) {
        try {
          const res = await fetch("/api/resources");
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.resources)) {
              fetchedResources = json.resources;
            }
          }
        } catch {
          // Ignore network errors in offline/demo mode
        }
      }

      if (fetchedResources.length > 0) {
        setRemoteResources(fetchedResources);
        setLastSyncedAt(new Date());
        setIsDatabaseConnected(true);

        // Clean up extras that now exist in remoteResources to prevent duplicate/re-upload loops
        setExtras((prevExtras) => {
          if (prevExtras.length === 0) return prevExtras;
          const remoteIdSet = new Set(fetchedResources.map((r) => r.id));
          const remoteUrlSet = new Set(
            fetchedResources.map((r) => r.url.toLowerCase().replace(/\/$/, "")),
          );
          return prevExtras.filter(
            (e) => !remoteIdSet.has(e.id) && !remoteUrlSet.has(e.url.toLowerCase().replace(/\/$/, "")),
          );
        });

        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(fetchedResources));
          }
        } catch {
          // ignore
        }

        // Automatic background sync for any unsynced local extras
        if (typeof window !== "undefined") {
          try {
            const raw =
              window.localStorage.getItem(STORAGE_KEY) ||
              window.localStorage.getItem("aix-vault:v1");
            if (raw) {
              const parsed = JSON.parse(raw);
              const localExtras: Resource[] = Array.isArray(parsed.extras) ? parsed.extras : [];
              if (localExtras.length > 0) {
                const dbIds = new Set(fetchedResources.map((r) => r.id));
                const dbUrls = new Set(
                  fetchedResources.map((r) => r.url.toLowerCase().replace(/\/$/, "")),
                );
                const unsynced = localExtras.filter((item) => {
                  const normUrl = item.url.toLowerCase().replace(/\/$/, "");
                  return !dbIds.has(item.id) && !dbUrls.has(normUrl);
                });

                if (unsynced.length > 0) {
                  fetch("/api/resources/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resources: unsynced }),
                  })
                    .then((r) => r.json())
                    .then((syncRes) => {
                      if (syncRes.ok && syncRes.syncedCount > 0) {
                        void refreshResources();
                      }
                    })
                    .catch(() => {});
                }
              }
            }
          } catch {}
        }
      }
    } finally {
      if (showLoading) setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const refreshCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.collections)) {
          const dbCollections: Collection[] = json.collections.map(
            (c: { id: string; name: string; slug: string; description: string | null; icon: string | null; created_by: string | null; created_at: string; updated_at: string }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description ?? "",
              icon: c.icon,
              createdBy: c.created_by,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            }),
          );
          // Supabase is the canonical truth for collections and folder resources
          setCollections((localCols) => {
            const dbIdSet = new Set(dbCollections.map((c) => c.id));
            // Only keep local collections if they are very recent (in-flight optimistic updates < 10s old)
            const inFlightLocal = localCols.filter(
              (c) => !dbIdSet.has(c.id) && Date.now() - new Date(c.createdAt).getTime() < 10000,
            );
            return [...dbCollections, ...inFlightLocal];
          });
        }
        if (Array.isArray(json.collectionResources)) {
          const dbCollRes: CollectionResource[] = json.collectionResources.map(
            (cr: { collection_id: string; resource_id: string; created_at: string }) => ({
              collectionId: cr.collection_id,
              resourceId: cr.resource_id,
              createdAt: cr.created_at,
            }),
          );
          // Canonical database collection resources
          setCollectionResources((localCR) => {
            const dbKeySet = new Set(dbCollRes.map((cr) => `${cr.collectionId}::${cr.resourceId}`));
            const inFlightCR = localCR.filter(
              (cr) => !dbKeySet.has(`${cr.collectionId}::${cr.resourceId}`) && Date.now() - new Date(cr.createdAt).getTime() < 10000,
            );
            return [...dbCollRes, ...inFlightCR];
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.categories) && json.categories.length > 0) {
          const dbCats: Category[] = json.categories.map(
            (c: { id: string; name: string; slug: string; description: string | null; parent_id: string | null; icon: string | null; created_at: string }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description ?? c.name,
              icon: c.icon,
              parentId: c.parent_id,
              createdAt: c.created_at,
            }),
          );
          // Register DB categories so taxonomy helpers know about them
          for (const cat of dbCats) {
            registerCategory(cat);
          }
          // Merge: local taxonomy defaults + DB categories + localStorage custom categories
          setCategoriesState((prev) => {
            // Read deleted category IDs from localStorage
            let deletedCatIds: string[] = [];
            try {
              const raw = window.localStorage.getItem(STORAGE_KEY);
              if (raw) {
                const parsed = JSON.parse(raw);
                deletedCatIds = Array.isArray(parsed.deletedCategoryIds) ? parsed.deletedCategoryIds : [];
              }
            } catch {}
            const deletedSet = new Set(deletedCatIds);
            // Start with existing local categories
            const merged = new Map<string, Category>();
            for (const c of prev) {
              if (!deletedSet.has(c.id)) merged.set(c.id, c);
            }
            // Overlay DB categories (they take precedence)
            for (const c of dbCats) {
              if (!deletedSet.has(c.id)) merged.set(c.id, c);
            }
            return Array.from(merged.values());
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  const refreshResourceTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/resource-types");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.resourceTypes) && json.resourceTypes.length > 0) {
          const dbTypes: ResourceType[] = json.resourceTypes.map(
            (t: { id: string; name: string; slug: string }) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
            }),
          );
          for (const t of dbTypes) {
            registerResourceType(t);
          }
          setResourceTypesState((prev) => {
            let deletedTypeIds: string[] = [];
            try {
              const raw = window.localStorage.getItem(STORAGE_KEY);
              if (raw) {
                const parsed = JSON.parse(raw);
                deletedTypeIds = Array.isArray(parsed.deletedResourceTypeIds) ? parsed.deletedResourceTypeIds : [];
              }
            } catch {}
            const deletedSet = new Set(deletedTypeIds);
            const merged = new Map<string, ResourceType>();
            for (const t of prev) {
              if (!deletedSet.has(t.id) && !deletedSet.has(t.slug)) merged.set(t.slug, t);
            }
            for (const t of dbTypes) {
              if (!deletedSet.has(t.id) && !deletedSet.has(t.slug)) merged.set(t.slug, t);
            }
            return Array.from(merged.values());
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  const refreshSavedIds = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/saved?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.savedIds)) {
          setSavedIds((localSaved) => {
            const dbSet = new Set(json.savedIds as string[]);
            const localOnly = localSaved.filter((id) => !dbSet.has(id));
            if (localOnly.length > 0 && currentUser?.id) {
              for (const rid of localOnly) {
                fetch("/api/saved", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: currentUser.id, resourceId: rid, action: "save" }),
                }).catch(() => {});
              }
            }
            return [...json.savedIds, ...localOnly];
          });
        }
      }
    } catch {
      // Ignore network errors
    }
  }, [currentUser]);

  const broadcastSync = useCallback(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel("aix-vault-sync");
        bc.postMessage({ type: "SYNC_RESOURCES", timestamp: Date.now() });
        bc.close();
      } catch {
        // ignore
      }
    }
  }, []);

  // Hydrate all data & listen to cross-tab BroadcastChannel & Supabase Realtime
  useEffect(() => {
    const hasCache = Boolean(readRemoteCache()?.length);
    void refreshResources(!hasCache);
    void refreshCollections();
    void refreshCategories();
    void refreshResourceTypes();
    void refreshSavedIds();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("aix-vault-sync");
      bc.onmessage = (event) => {
        if (event.data?.type === "SYNC_RESOURCES") {
          void refreshResources(false);
          void refreshCollections();
          void refreshCategories();
          void refreshResourceTypes();
          void refreshSavedIds();
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed.extras)) setExtras(parsed.extras);
              if (Array.isArray(parsed.recommendedIds)) setRecommendedIds(parsed.recommendedIds);
            }
          } catch {
            // ignore
          }
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed.extras)) setExtras(parsed.extras);
          if (Array.isArray(parsed.recommendedIds)) setRecommendedIds(parsed.recommendedIds);
          void refreshResources(false);
          void refreshCollections();
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    const supabase = getSupabaseClient();
    let channel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>["channel"]> | null = null;
    if (supabase) {
      channel = supabase
        .channel("vault-all-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "resources" },
          () => {
            void refreshResources(false);
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "collections" },
          () => {
            void refreshCollections();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "collection_resources" },
          () => {
            void refreshCollections();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "categories" },
          () => {
            void refreshCategories();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "resource_types" },
          () => {
            void refreshResourceTypes();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "saved_resources" },
          () => {
            void refreshSavedIds();
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsDatabaseConnected(true);
          }
        });
    }

    return () => {
      bc?.close();
      window.removeEventListener("storage", handleStorage);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshResources, refreshCollections, refreshCategories, refreshResourceTypes, refreshSavedIds]);


  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [navigation, deferredSearch, filters, sort]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const legacy = window.localStorage.getItem("aix-vault:theme");
        let hasExplicit = !!legacy;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.theme === "light" || parsed.theme === "dark") hasExplicit = true;
        }
        if (!hasExplicit) {
          const next = e.matches ? "dark" : "light";
          setThemeState(next);
          document.documentElement.classList.toggle("dark", next === "dark");
        }
      } catch {}
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback(
    (next: "light" | "dark", event?: React.MouseEvent | MouseEvent) => {
      const isReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const applyTheme = () => {
        setThemeState(next);
        document.documentElement.classList.toggle("dark", next === "dark");
        persistTheme();
      };

      const persistTheme = () => {
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
      };

      // If View Transitions API is not supported or user prefers reduced motion
      if (
        typeof document === "undefined" ||
        !("startViewTransition" in document) ||
        isReducedMotion
      ) {
        document.documentElement.classList.add("theme-transitioning");
        applyTheme();
        persistTheme();
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
        }, 400);
        return;
      }

      // Calculate origin coordinates from the button center for a perfectly centered circular expansion
      let x = typeof window !== "undefined" ? window.innerWidth - 60 : 0;
      let y = 24;

      if (event) {
        const target = (event.currentTarget || event.target) as HTMLElement | null;
        const buttonEl = target?.closest("button") || target;
        if (buttonEl && typeof buttonEl.getBoundingClientRect === "function") {
          const rect = buttonEl.getBoundingClientRect();
          x = Math.round(rect.left + rect.width / 2);
          y = Math.round(rect.top + rect.height / 2);
        } else if (typeof event.clientX === "number" && event.clientX > 0) {
          x = Math.round(event.clientX);
          y = Math.round(event.clientY);
        }
      }

      const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
      const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      const endRadius =
        Math.ceil(
          Math.hypot(
            Math.max(x, winWidth - x),
            Math.max(y, winHeight - y),
          ),
        ) + 24;

      try {
        const transition = (document as any).startViewTransition(() => {
          flushSync(() => {
            applyTheme();
          });
        });

        transition.ready
          .then(() => {
            try {
              const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ];
              document.documentElement.animate(
                {
                  clipPath,
                },
                {
                  duration: 480,
                  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                  pseudoElement: "::view-transition-new(root)",
                },
              );
            } catch {
              // Fallback to default crossfade
            }
          })
          .catch(() => {
            // ignore
          });

        transition.finished
          .catch(() => {})
          .finally(() => {
            persistTheme();
          });
      } catch {
        applyTheme();
        persistTheme();
      }
    },
    [],
  );

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const cur = raw ? JSON.parse(raw) : {};
      const payload: Persisted = {
        ...cur,
        extras,
        deletedIds,
        deletedCollectionIds,
        savedIds,
        collections,
        collectionResources,
        saveCounts,
        theme,
        iconMode,
        role,
        recommendedIds,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    extras,
    deletedIds,
    deletedCollectionIds,
    savedIds,
    collections,
    collectionResources,
    saveCounts,
    theme,
    iconMode,
    role,
    recommendedIds,
  ]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDeferredSearch(search), 200);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const params = new URLSearchParams();
    if (navigation.kind === "collection") {
      params.set("collection", navigation.collectionId);
      if (navigation.platform && navigation.platform !== "all") {
        params.set("platform", navigation.platform);
      }
    }
    if (navigation.kind === "saved") {
      params.set("saved", "1");
      if (navigation.platform && navigation.platform !== "all") {
        params.set("platform", navigation.platform);
      }
    }
    if (navigation.kind === "category") {
      params.set("category", navigation.categoryId);
    }
    if (deferredSearch) params.set("search", deferredSearch);
    const next = params.toString();
    const url = next ? `${currentPath}?${next}` : currentPath;
    window.history.replaceState(null, "", url);
  }, [
    navigation,
    deferredSearch,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (isSelectMode || selectedResourceIds.length > 0)) {
        setIsSelectMode(false);
        setSelectedResourceIds([]);
        return;
      }

      const isCmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      const isSpace =
        (event.key === " " || event.code === "Space") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey;

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
            target.isContentEditable ||
            Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
        if (!isInput) {
          event.preventDefault();
          setCommandOpen(true);
        }
        return;
      }

      if (isSpace && isAdmin && !addOpen && !commandOpen && !selectedId && !authModalOpen) {
        const target = event.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable ||
            Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
        if (!isInput) {
          event.preventDefault();
          setAddOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin, addOpen, commandOpen, selectedId, authModalOpen, isSelectMode, selectedResourceIds]);

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const resources = useMemo(() => {
    const baseMap = new Map<string, Resource>();
    if (remoteResources && remoteResources.length > 0) {
      for (const item of remoteResources) {
        baseMap.set(item.id, item);
      }
    }
    const baseList = Array.from(baseMap.values());

    const extraMap = new Map(extras.map((item) => [item.id, item]));
    const fromBase = baseList
      .filter((item) => !deletedIds.includes(item.id))
      .map((item) => extraMap.get(item.id) ?? item);

    const baseIdSet = new Set(baseList.map((s) => s.id));
    const pureExtras = extras.filter(
      (item) => !baseIdSet.has(item.id) && !deletedIds.includes(item.id),
    );

    const merged = [...pureExtras, ...fromBase];
    return merged.map((resource) => ({
      ...resource,
      categoryId: resource.categoryId || "",
      isRecommended: Boolean(resource.isRecommended) || recommendedIds.includes(resource.id),
      tagIds: enrichResourceTags(resource),
      saveCount: saveCounts[resource.id] ?? resource.saveCount,
    }));
  }, [deletedIds, extras, remoteResources, saveCounts, recommendedIds]);

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

  // Auth Handlers
  const loginAsAdmin = useCallback(async (email: string, password?: string) => {
    const supabase = getSupabaseClient();
    if (supabase && password && hasSupabaseConfig()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const hasAdminRole = profile?.role === "admin" || data.user.app_metadata?.role === "admin";
      if (!hasAdminRole) {
        setRole("user");
        return { ok: false, error: "Access granted, but this user account lacks Admin privileges." };
      }
      setRole("admin");
      setToast("Logged in as Admin.");
      return { ok: true };
    }

    // Demo / Passcode fallback when Supabase is not configured
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = (password ?? "").trim().toLowerCase();
    if (cleanEmail === "admin" || cleanPass === "admin" || cleanPass === "admin123") {
      setRole("admin");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("aix-vault:demo-admin", "true");
      }
      setToast("Switched to Admin profile.");
      return { ok: true };
    }

    return { ok: false, error: "Invalid credentials. In demo mode, use password: admin" };
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("aix-vault:demo-admin");
    }
    setRole("user");
    setCurrentUser(null);
    setIsSelectMode(false);
    setSelectedResourceIds([]);
    setToast("Switched to Viewer profile.");
  }, []);

  // CRUD Methods (Guarded by Admin Role)
  const createResource = useCallback(
    async (input: ResourceInput) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return { ok: false as const, error: "Admin profile required to create resources." };
      }

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
      const finalTags =
        data.pricing === "Free"
          ? data.tags.includes("free")
            ? data.tags
            : [...data.tags, "free"]
          : data.tags.filter((t) => t !== "free");

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
        createdBy: currentUser?.id ?? null,
        createdAt: now,
        updatedAt: now,
        isPublic: true,
        tagIds: finalTags,
        saveCount: 0,
        pricing: data.pricing ?? "Freemium",
        isRecommended: Boolean(data.isRecommended),
      };

      // Persist to Supabase via server API route
      try {
        const res = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            name: data.name,
            description: data.description,
            url,
            categoryId: data.categoryId,
            type: data.type,
            pricing: data.pricing ?? "Freemium",
            tags: finalTags,
            collectionId: data.collectionId || undefined,
            createdBy: currentUser?.id || undefined,
            isRecommended: Boolean(data.isRecommended),
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.ok) {
          // Optimistically add to local state
          setExtras((current) => [resource, ...current]);
          if (data.isRecommended) {
            setRecommendedIds((current) => (current.includes(id) ? current : [...current, id]));
          }
          if (data.collectionId) {
            setCollectionResources((current) => [
              { collectionId: data.collectionId as string, resourceId: id, createdAt: now },
              ...current,
            ]);
          }
          setToast("Resource added & synced.");
          await refreshResources(false);
          broadcastSync();
          return { ok: true as const };
        } else {
          const errMsg = resData?.error || "Failed to save resource to database.";
          setToast(errMsg);
          return { ok: false as const, error: errMsg };
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Network error connecting to database";
        console.warn("Could not reach /api/resources:", e);
        setToast(errMsg);
        return { ok: false as const, error: errMsg };
      }
    },
    [currentUser, isAdmin, resources, refreshResources, broadcastSync],
  );

  const updateResource = useCallback(
    async (id: string, patch: Partial<Resource>) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
      }

      if (patch.isRecommended !== undefined) {
        setRecommendedIds((current) => {
          if (patch.isRecommended) {
            return current.includes(id) ? current : [...current, id];
          } else {
            return current.filter((item) => item !== id);
          }
        });
      }

      setExtras((current) => {
        const exists = current.some((item) => item.id === id);
        if (exists) {
          return current.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          );
        }
        const base = (remoteResources ?? seedResources).find((item) => item.id === id);
        if (!base) return current;
        return [...current, { ...base, ...patch, updatedAt: new Date().toISOString() }];
      });

      try {
        await fetch("/api/resources", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, patch }),
        });
        await refreshResources(false);
      } catch (e) {
        console.warn("Could not sync update to backend:", e);
      }

      broadcastSync();
      setToast("Resource updated.");
    },
    [isAdmin, remoteResources, refreshResources, broadcastSync],
  );

  const toggleRecommendResource = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (!isAdmin) {
        setToast("Admin profile required to recommend tools.");
        return;
      }
      const target = resources.find((r) => r.id === id);
      if (!target) return;
      const currentRecommended = Boolean(target.isRecommended) || recommendedIds.includes(id);
      const nextVal = !currentRecommended;

      setRecommendedIds((current) => {
        if (nextVal) {
          return current.includes(id) ? current : [...current, id];
        } else {
          return current.filter((item) => item !== id);
        }
      });

      setExtras((current) => {
        const exists = current.some((item) => item.id === id);
        if (exists) {
          return current.map((item) =>
            item.id === id ? { ...item, isRecommended: nextVal, updatedAt: new Date().toISOString() } : item,
          );
        }
        return [...current, { ...target, isRecommended: nextVal, updatedAt: new Date().toISOString() }];
      });

      setToast(nextVal ? "Marked as Admin Recommendation." : "Removed from Admin Recommendations.");

      try {
        await fetch("/api/resources", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, patch: { isRecommended: nextVal } }),
        });
        await refreshResources(false);
      } catch (err) {
        console.warn("Could not sync recommendation:", err);
      }

      broadcastSync();
    },
    [isAdmin, resources, recommendedIds, refreshResources, broadcastSync],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
      }

      setExtras((current) => current.filter((item) => item.id !== id));
      setRecommendedIds((current) => current.filter((item) => item !== id));
      setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
      setSelectedId(null);

      try {
        await fetch(`/api/resources?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        await refreshResources(false);
      } catch (e) {
        console.warn("Could not sync deletion to backend:", e);
      }

      broadcastSync();
      setToast("Resource deleted.");
    },
    [isAdmin, refreshResources, broadcastSync],
  );

  const createCollection = useCallback(
    (name: string) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return null;
      }

      const now = new Date().toISOString();
      const collection: Collection = {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        description: "",
        icon: null,
        createdBy: currentUser?.id ?? null,
        createdAt: now,
        updatedAt: now,
      };
      setCollections((current) => [...current, collection]);

      fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection }),
      })
        .then(() => {
          broadcastSync();
        })
        .catch((e) => console.warn("Could not sync collection:", e));

      broadcastSync();
      return collection;
    },
    [currentUser?.id, isAdmin, broadcastSync],
  );

  const renameCollection = useCallback(
    (id: string, name: string) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
      }

      const trimmed = name.trim();
      if (!trimmed) return;
      setCollections((current) =>
        current.map((c) =>
          c.id === id
            ? { ...c, name: trimmed, slug: slugify(trimmed), updatedAt: new Date().toISOString() }
            : c,
        ),
      );

      fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: { id, name: trimmed, slug: slugify(trimmed) },
        }),
      })
        .then(() => {
          broadcastSync();
        })
        .catch((e) => console.warn("Could not rename collection:", e));

      setToast("Folder renamed.");
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
      }

      setCollections((current) => current.filter((c) => c.id !== id));
      setCollectionResources((current) => current.filter((item) => item.collectionId !== id));
      setDeletedCollectionIds((current) => (current.includes(id) ? current : [...current, id]));
      setNavigation((current) => {
        if (current.kind === "collection" && current.collectionId === id) {
          return { kind: "category", categoryId: "development" };
        }
        return current;
      });

      fetch(`/api/collections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
        .then(() => {
          broadcastSync();
        })
        .catch((e) => console.warn("Could not delete collection:", e));

      setToast("Folder deleted.");
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const setSelectMode = useCallback((active: boolean) => {
    setIsSelectMode(active);
    if (!active) {
      setSelectedResourceIds([]);
    }
  }, []);

  const toggleSelectResource = useCallback((id: string) => {
    setSelectedResourceIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      if (!exists) {
        setIsSelectMode(true);
      }
      return next;
    });
  }, []);

  const selectResources = useCallback((ids: string[]) => {
    setSelectedResourceIds((prev) => Array.from(new Set([...prev, ...ids])));
    setIsSelectMode(true);
  }, []);

  const deselectResources = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setSelectedResourceIds((prev) => prev.filter((id) => !set.has(id)));
  }, []);

  const selectAllVisible = useCallback((ids?: string[]) => {
    if (ids && ids.length > 0) {
      setSelectedResourceIds(ids);
      setIsSelectMode(true);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedResourceIds([]);
    setIsSelectMode(false);
  }, []);

  const addResourcesToCollection = useCallback(
    (resourceIds: string[], collectionId: string) => {
      if (!isAdmin) {
        setToast("Admin permission required to manage folders.");
        return;
      }
      if (!resourceIds.length || !collectionId) return;

      const targetCol = collections.find((c) => c.id === collectionId);
      const colName = targetCol ? targetCol.name : "folder";

      setCollectionResources((current) => {
        const existingSet = new Set(
          current
            .filter((item) => item.collectionId === collectionId)
            .map((item) => item.resourceId),
        );
        const newItems: CollectionResource[] = [];
        for (const rId of resourceIds) {
          if (!existingSet.has(rId)) {
            newItems.push({
              collectionId,
              resourceId: rId,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (newItems.length === 0) {
          setToast(`Selected items are already in "${colName}".`);
          return current;
        }

        setToast(`Added ${newItems.length} resource${newItems.length === 1 ? "" : "s"} to "${colName}".`);

        fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_resources",
            resourceIds: newItems.map((item) => item.resourceId),
            collectionId,
          }),
        })
          .then(() => {
            broadcastSync();
          })
          .catch((e) => console.warn("Could not batch add resources to collection:", e));

        return [...newItems, ...current];
      });

      setSelectedResourceIds([]);
      setIsSelectMode(false);
      broadcastSync();
    },
    [isAdmin, collections, broadcastSync],
  );

  const removeResourcesFromCollection = useCallback(
    (resourceIds: string[], collectionId: string) => {
      if (!isAdmin) {
        setToast("Admin permission required to manage folders.");
        return;
      }
      if (!resourceIds.length || !collectionId) return;

      const targetCol = collections.find((c) => c.id === collectionId);
      const colName = targetCol ? targetCol.name : "folder";

      setCollectionResources((current) => {
        const set = new Set(resourceIds);
        const remaining = current.filter(
          (item) => !(item.collectionId === collectionId && set.has(item.resourceId)),
        );
        const removedCount = current.length - remaining.length;
        if (removedCount > 0) {
          setToast(`Removed ${removedCount} resource${removedCount === 1 ? "" : "s"} from "${colName}".`);
          fetch("/api/collections", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "remove_resources",
              resourceIds,
              collectionId,
            }),
          })
            .then(() => {
              broadcastSync();
            })
            .catch((e) => console.warn("Could not batch remove resources from collection:", e));
        }
        return remaining;
      });

      setSelectedResourceIds([]);
      setIsSelectMode(false);
      broadcastSync();
    },
    [isAdmin, collections, broadcastSync],
  );

  const addCategory = useCallback(
    (name: string, parentId?: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to add categories.");
        return null;
      }
      const trimmed = name.trim();
      if (!trimmed) return null;
      const slug = parentId ? `${parentId}-${slugify(trimmed)}` : slugify(trimmed);
      const newCat: Category = {
        id: slug,
        name: trimmed,
        slug,
        description: trimmed,
        icon: null,
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
      };

      registerCategory(newCat);
      setCategoriesState((prev) => {
        if (prev.some((c) => c.id === newCat.id)) return prev;
        return [...prev, newCat];
      });

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customCats = Array.isArray(cur.customCategories) ? cur.customCategories : [];
          const updatedCats = [...customCats.filter((c: Category) => c.id !== newCat.id), newCat];
          const deletedCatIds = Array.isArray(cur.deletedCategoryIds)
            ? cur.deletedCategoryIds.filter((id: string) => id !== newCat.id)
            : [];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customCategories: updatedCats, deletedCategoryIds: deletedCatIds }),
          );
        } catch {}
      }

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      }).catch((e) => console.warn("Could not sync category:", e));

      setToast(`Category "${trimmed}" added.`);
      broadcastSync();
      return newCat;
    },
    [isAdmin, broadcastSync],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to delete categories.");
        return;
      }
      unregisterCategory(id);
      setCategoriesState((prev) => prev.filter((c) => c.id !== id));

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customCats = Array.isArray(cur.customCategories)
            ? cur.customCategories.filter((c: Category) => c.id !== id)
            : [];
          const deletedCatIds = Array.isArray(cur.deletedCategoryIds)
            ? [...new Set([...cur.deletedCategoryIds, id])]
            : [id];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customCategories: customCats, deletedCategoryIds: deletedCatIds }),
          );
        } catch {}
      }

      fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Could not delete category:", e));

      setToast("Category deleted.");
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const editCategory = useCallback(
    (id: string, newName: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to edit categories.");
        return;
      }
      const trimmed = newName.trim();
      if (!trimmed) return;

      const existing = categoryById(id);
      const updatedCat: Category = {
        id,
        name: trimmed,
        slug: existing?.slug || id,
        description: existing?.description === existing?.name ? trimmed : existing?.description || trimmed,
        icon: existing?.icon || null,
        parentId: existing?.parentId || null,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      registerCategory(updatedCat);
      setCategoriesState((prev) =>
        prev.map((c) => (c.id === id ? updatedCat : c))
      );

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customCats = Array.isArray(cur.customCategories) ? cur.customCategories : [];
          const updatedCats = [
            ...customCats.filter((c: Category) => c.id !== id),
            updatedCat,
          ];
          const deletedCatIds = Array.isArray(cur.deletedCategoryIds)
            ? cur.deletedCategoryIds.filter((cid: string) => cid !== id)
            : [];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customCategories: updatedCats, deletedCategoryIds: deletedCatIds }),
          );
        } catch {}
      }

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCat),
      }).catch((e) => console.warn("Could not sync category edit:", e));

      setToast(`Category renamed to "${trimmed}".`);
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const addResourceType = useCallback(
    (name: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to add tool types.");
        return null;
      }
      const trimmed = name.trim();
      if (!trimmed) return null;
      const slug = slugify(trimmed);
      const newType: ResourceType = {
        id: slug,
        name: trimmed,
        slug,
      };

      registerResourceType(newType);
      setResourceTypesState((prev) => {
        if (prev.some((t) => t.slug === newType.slug)) return prev;
        return [...prev, newType];
      });

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customTypes = Array.isArray(cur.customResourceTypes) ? cur.customResourceTypes : [];
          const updatedTypes = [...customTypes.filter((t: ResourceType) => t.slug !== newType.slug), newType];
          const deletedTypeIds = Array.isArray(cur.deletedResourceTypeIds)
            ? cur.deletedResourceTypeIds.filter((tid: string) => tid !== newType.slug && tid !== newType.id)
            : [];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customResourceTypes: updatedTypes, deletedResourceTypeIds: deletedTypeIds }),
          );
        } catch {}
      }

      fetch("/api/resource-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newType),
      }).catch((e) => console.warn("Could not sync resource type:", e));

      setToast(`Type "${trimmed}" added.`);
      broadcastSync();
      return newType;
    },
    [isAdmin, broadcastSync],
  );

  const deleteResourceType = useCallback(
    (idOrSlug: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to delete tool types.");
        return;
      }
      unregisterResourceType(idOrSlug);
      setResourceTypesState((prev) => prev.filter((t) => t.id !== idOrSlug && t.slug !== idOrSlug));

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customTypes = Array.isArray(cur.customResourceTypes)
            ? cur.customResourceTypes.filter((t: ResourceType) => t.id !== idOrSlug && t.slug !== idOrSlug)
            : [];
          const deletedTypeIds = Array.isArray(cur.deletedResourceTypeIds)
            ? [...new Set([...cur.deletedResourceTypeIds, idOrSlug])]
            : [idOrSlug];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customResourceTypes: customTypes, deletedResourceTypeIds: deletedTypeIds }),
          );
        } catch {}
      }

      fetch(`/api/resource-types?id=${encodeURIComponent(idOrSlug)}`, {
        method: "DELETE",
      }).catch((e) => console.warn("Could not delete resource type:", e));

      setToast("Tool type deleted.");
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const editResourceType = useCallback(
    (idOrSlug: string, newName: string) => {
      if (!isAdmin) {
        setToast("Admin profile required to edit tool types.");
        return;
      }
      const trimmed = newName.trim();
      if (!trimmed) return;

      const existing = typeBySlug(idOrSlug);
      const slug = existing?.slug || idOrSlug;
      const updatedType: ResourceType = {
        id: existing?.id || slug,
        name: trimmed,
        slug,
      };

      registerResourceType(updatedType);
      setResourceTypesState((prev) =>
        prev.map((t) => (t.id === idOrSlug || t.slug === idOrSlug || t.slug === slug ? updatedType : t))
      );

      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          const cur = raw ? JSON.parse(raw) : {};
          const customTypes = Array.isArray(cur.customResourceTypes) ? cur.customResourceTypes : [];
          const updatedTypes = [
            ...customTypes.filter((t: ResourceType) => t.slug !== slug && t.id !== idOrSlug),
            updatedType,
          ];
          const deletedTypeIds = Array.isArray(cur.deletedResourceTypeIds)
            ? cur.deletedResourceTypeIds.filter((tid: string) => tid !== slug && tid !== idOrSlug)
            : [];
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...cur, customResourceTypes: updatedTypes, deletedResourceTypeIds: deletedTypeIds }),
          );
        } catch {}
      }

      fetch("/api/resource-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedType),
      }).catch((e) => console.warn("Could not sync resource type edit:", e));

      setToast(`Tool type renamed to "${trimmed}".`);
      broadcastSync();
    },
    [isAdmin, broadcastSync],
  );

  const syncLocalToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      let localExtras: Resource[] = extras;
      if (typeof window !== "undefined") {
        try {
          const raw =
            window.localStorage.getItem(STORAGE_KEY) ||
            window.localStorage.getItem("aix-vault:v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.extras) && parsed.extras.length > 0) {
              localExtras = parsed.extras;
            }
          }
        } catch {}
      }

      if (localExtras.length === 0) {
        await refreshResources();
        setToast("Database up to date.");
        return { ok: true as const, syncedCount: 0 };
      }

      const res = await fetch("/api/resources/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resources: localExtras }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await refreshResources();
        setToast(`Synced ${data.syncedCount} resources to Supabase!`);
        return { ok: true as const, syncedCount: data.syncedCount };
      } else {
        const error = data?.error ?? "Sync failed.";
        setToast(error);
        return { ok: false as const, error };
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Sync error";
      setToast(error);
      return { ok: false as const, error };
    } finally {
      setIsSyncing(false);
    }
  }, [extras, refreshResources]);

  const availableResourceTypes = useMemo(() => {
    const knownSlugs = new Set(resourceTypes.map((t) => t.slug));
    const dynamicExtraTypes: ResourceType[] = [];
    for (const r of resources) {
      if (r.type && !knownSlugs.has(r.type)) {
        knownSlugs.add(r.type);
        const formattedName = r.type
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        dynamicExtraTypes.push({
          id: r.type,
          name: formattedName,
          slug: r.type,
        });
      }
    }
    return [...resourceTypes, ...dynamicExtraTypes].sort((a, b) => a.name.localeCompare(b.name));
  }, [resourceTypes, resources]);

  const value: VaultContextValue = {
    resources,
    isLoading,
    isSyncing,
    isDatabaseConnected,
    lastSyncedAt,
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
    sidebarCollapsed,
    addOpen,
    folderAddOpen,
    commandOpen,
    authModalOpen,
    toast,
    setToast,
    theme,
    iconMode,
    role,
    isAdmin,
    currentUser,
    result,
    selected,
    setNavigation: (next) => {
      setSelectedResourceIds([]);
      setIsSelectMode(false);
      setNavigation((current) => {
        if (JSON.stringify(next) !== JSON.stringify(current)) {
          const isSameFolder =
            (current.kind === "collection" &&
              next.kind === "collection" &&
              current.collectionId === next.collectionId) ||
            (current.kind === "saved" && next.kind === "saved");

          if (!isSameFolder) {
            setNavHistory((prev) => [...prev.slice(-20), current]);
          }
        }
        return next;
      });
      if (next.kind === "category" || next.kind === "all") {
        setLastCategoryNav(next);
      }
      setSidebarOpen(false);
    },
    goBack: () => {
      setSelectedResourceIds([]);
      setIsSelectMode(false);
      if (navHistory.length > 0) {
        const nextHistory = [...navHistory];
        let prev = nextHistory.pop();
        while (
          prev &&
          JSON.stringify(prev) === JSON.stringify(navigation) &&
          nextHistory.length > 0
        ) {
          prev = nextHistory.pop();
        }
        if (prev && JSON.stringify(prev) !== JSON.stringify(navigation)) {
          setNavHistory(nextHistory);
          setNavigation(prev);
          setSidebarOpen(false);
          return;
        }
      }
      setNavigation(lastCategoryNav || { kind: "all" });
      setSidebarOpen(false);
    },
    setSearch,
    setFilters,
    setSort,
    setView,
    loadMore: () => setPage((current) => current + 1),
    selectResource: (id) => {
      setSelectedId(id);
      if (id) setAddOpen(false);
    },
    setSidebarOpen,
    setSidebarCollapsed,
    setAddOpen: (open) => {
      setAddOpen(open);
      if (open) setSelectedId(null);
    },
    setFolderAddOpen: (open) => {
      setFolderAddOpen(open);
    },
    setCommandOpen,
    setAuthModalOpen,
    setTheme,
    setIconMode,
    loginAsAdmin,
    logout,
    saveResource: (id) => {
      setSavedIds((current) => {
        const exists = current.includes(id);
        setSaveCounts((counts) => ({
          ...counts,
          [id]: Math.max(0, (counts[id] ?? 0) + (exists ? -1 : 1)),
        }));
        setToast(exists ? "Removed from Saved." : "Saved.");

        // Sync to Supabase if user is authenticated
        if (currentUser) {
          fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              resourceId: id,
              action: exists ? "unsave" : "save",
            }),
          }).catch(() => {});
        }

        return exists ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    addToCollection: (resourceId, collectionId) => {
      if (!isAdmin) {
        setToast("Admin permission required to manage folders.");
        return;
      }
      setCollectionResources((current) => {
        if (current.some((item) => item.collectionId === collectionId && item.resourceId === resourceId)) {
          return current;
        }
        setToast("Added to collection.");
        fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_resource", resourceId, collectionId }),
        })
          .then(() => {
            broadcastSync();
          })
          .catch(() => {});
        return [
          { collectionId, resourceId, createdAt: new Date().toISOString() },
          ...current,
        ];
      });
      broadcastSync();
    },
    addResourcesToCollection,
    removeResourcesFromCollection,
    isSelectMode,
    selectedResourceIds,
    setSelectMode,
    toggleSelectResource,
    selectResources,
    deselectResources,
    selectAllVisible,
    clearSelection,
    createCollection,
    renameCollection,
    deleteCollection,
    createResource,
    updateResource,
    toggleRecommendResource,
    deleteResource,
    collectionResourceIds,
    categories,
    resourceTypes: availableResourceTypes,
    addCategory,
    editCategory,
    deleteCategory,
    addResourceType,
    editResourceType,
    deleteResourceType,
    syncLocalToCloud,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const value = useContext(VaultContext);
  if (!value) throw new Error("useVault must be used within VaultProvider");
  return value;
}
