"use client";

import {
  seedCollectionResources,
  seedCollections,
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
} from "@/lib/taxonomy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "aix-vault:v2";

type Persisted = {
  extras: Resource[];
  deletedIds: string[];
  deletedCollectionIds?: string[];
  savedIds: string[];
  collections: Collection[];
  collectionResources: CollectionResource[];
  saveCounts: Record<string, number>;
  theme: "light" | "dark";
  role?: UserRole;
  customCategories?: Category[];
  deletedCategoryIds?: string[];
  customResourceTypes?: ResourceType[];
  deletedResourceTypeIds?: string[];
};

const LEGACY_DUMMY_IDS = new Set([
  "figma", "framer", "linear", "notion", "vercel", "github", "supabase",
  "shadcn-ui", "radix-ui", "lucide", "react", "react-aria", "tailwind",
  "webflow", "mobbin", "awwwards", "arena", "raindrop", "savee",
  "google-fonts", "fontshare", "unsplash", "coolors", "nextjs", "cursor",
  "claude", "chatgpt", "v0", "midjourney", "heroicons", "phosphor",
  "storybook", "relume", "untitled-ui", "inter", "geist", "raycast",
  "astro", "mdn", "css-tricks", "ui-tools", "ai-tools", "dev-tools", "design-tools", "typography", "productivity"
]);

function readInitial(): Persisted {
  const fallback: Persisted = {
    extras: [],
    deletedIds: [],
    deletedCollectionIds: [],
    savedIds: [],
    collections: [],
    collectionResources: [],
    saveCounts: {},
    theme: "light",
    role: "user",
    customCategories: [],
    deletedCategoryIds: [],
    customResourceTypes: [],
    deletedResourceTypeIds: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    // Read from v2, or check legacy v1 if needed
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("aix-vault:v1");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    const deletedColls = new Set<string>(parsed.deletedCollectionIds || []);
    const storedCollections: Collection[] = Array.isArray(parsed.collections)
      ? parsed.collections.filter((c: Collection) => !deletedColls.has(c.id) && !LEGACY_DUMMY_IDS.has(c.id))
      : [];

    const storedCollRes: CollectionResource[] = Array.isArray(parsed.collectionResources)
      ? parsed.collectionResources.filter((cr: CollectionResource) => !LEGACY_DUMMY_IDS.has(cr.collectionId) && !LEGACY_DUMMY_IDS.has(cr.resourceId))
      : [];

    const storedExtras: Resource[] = Array.isArray(parsed.extras)
      ? parsed.extras.filter((r: Resource) => !LEGACY_DUMMY_IDS.has(r.id))
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
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "light",
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
  sidebarCollapsed: boolean;
  addOpen: boolean;
  commandOpen: boolean;
  authModalOpen: boolean;
  toast: string | null;
  theme: "light" | "dark";
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
  setCommandOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark", event?: React.MouseEvent | MouseEvent) => void;
  loginAsAdmin: (email: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveResource: (id: string) => void;
  addToCollection: (resourceId: string, collectionId: string) => void;
  createCollection: (name: string) => Collection | null;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  createResource: (input: ResourceInput) => Promise<{ ok: true } | { ok: false; error: string; existingId?: string }>;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  collectionResourceIds: (id: string) => string[];
  categories: Category[];
  resourceTypes: ResourceType[];
  addCategory: (name: string, parentId?: string) => Category | null;
  deleteCategory: (id: string) => void;
  addResourceType: (name: string) => ResourceType | null;
  deleteResourceType: (id: string) => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readInitial(), []);
  const [extras, setExtras] = useState<Resource[]>(initial.extras);
  const [deletedIds, setDeletedIds] = useState<string[]>(initial.deletedIds);
  const [deletedCollectionIds, setDeletedCollectionIds] = useState<string[]>(
    initial.deletedCollectionIds || [],
  );
  const [savedIds, setSavedIds] = useState<string[]>(initial.savedIds);
  const [collections, setCollections] = useState<Collection[]>(initial.collections);
  const [collectionResources, setCollectionResources] =
    useState<CollectionResource[]>(initial.collectionResources);
  const [categories, setCategoriesState] = useState<Category[]>(() =>
    getAllCategories(initial.customCategories, initial.deletedCategoryIds),
  );
  const [resourceTypes, setResourceTypesState] = useState<ResourceType[]>(() =>
    getAllResourceTypes(initial.customResourceTypes, initial.deletedResourceTypeIds),
  );
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>(initial.saveCounts);
  const [navigation, setNavigation] = useState<Navigation>({ kind: "all" });
  const [navHistory, setNavHistory] = useState<Navigation[]>([]);
  const [lastCategoryNav, setLastCategoryNav] = useState<Navigation>({ kind: "all" });
  const [search, setSearch] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: null, tagIds: [], free: false, openSource: false });
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(initial.theme);

  // Role and Auth State
  const [role, setRole] = useState<UserRole>(initial.role ?? "user");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string | null } | null>(null);
  const [remoteResources, setRemoteResources] = useState<Resource[] | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
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

    // Fetch resources from Supabase
    async function fetchRemote() {
      try {
        const { data: resData, error } = await supabase!
          .from("resources")
          .select(`
            id, name, slug, description, url, domain, icon_url, type, category_id,
            created_by, created_at, updated_at, is_public,
            resource_tags ( tag_id )
          `)
          .order("created_at", { ascending: false });

        if (!error && resData && resData.length > 0) {
          const mapped: Resource[] = resData.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description ?? "",
            url: r.url,
            domain: r.domain,
            iconUrl: r.icon_url,
            type: r.type,
            categoryId: r.category_id,
            createdBy: r.created_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            isPublic: r.is_public,
            tagIds: Array.isArray(r.resource_tags) ? r.resource_tags.map((t: any) => t.tag_id) : [],
            saveCount: 0,
          }));
          setRemoteResources(mapped);
        }
      } catch {
        // Fall back to seed data
      }
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshResources = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: resData, error } = await supabase
          .from("resources")
          .select(`
            id, name, slug, description, url, domain, icon_url, type, category_id,
            created_by, created_at, updated_at, is_public,
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
          const mapped: Resource[] = (resData as unknown as Row[]).map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description ?? "",
            url: r.url,
            domain: r.domain,
            iconUrl: r.icon_url,
            type: r.type,
            categoryId: r.category_id,
            createdBy: r.created_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            isPublic: r.is_public,
            tagIds: Array.isArray(r.resource_tags) ? r.resource_tags.map((t) => t.tag_id) : [],
            saveCount: 0,
          }));
          setRemoteResources(mapped);
          return;
        }
      } catch {
        // Fall back to /api/resources
      }
    }

    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.resources)) {
          setRemoteResources(json.resources);
        }
      }
    } catch {
      // Ignore network errors in offline/demo mode
    }
  }, []);

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

  // Hydrate resources, listen to cross-tab BroadcastChannel & Supabase Realtime
  useEffect(() => {
    void refreshResources();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("aix-vault-sync");
      bc.onmessage = (event) => {
        if (event.data?.type === "SYNC_RESOURCES") {
          void refreshResources();
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed.extras)) setExtras(parsed.extras);
              if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
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
          if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
          void refreshResources();
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
        .channel("vault-resources-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "resources" },
          () => {
            void refreshResources();
          },
        )
        .subscribe();
    }

    return () => {
      bc?.close();
      window.removeEventListener("storage", handleStorage);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshResources]);


  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [navigation, deferredSearch, filters, sort]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback(
    (next: "light" | "dark", event?: React.MouseEvent | MouseEvent) => {
      const isReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const applyTheme = () => {
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
      };

      // If View Transitions API is not supported or user prefers reduced motion
      if (
        typeof document === "undefined" ||
        !("startViewTransition" in document) ||
        isReducedMotion
      ) {
        document.documentElement.classList.add("theme-transitioning");
        applyTheme();
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
        }, 400);
        return;
      }

      // Calculate origin coordinates for the circular expansion
      const x = event ? event.clientX : (typeof window !== "undefined" ? window.innerWidth - 60 : 0);
      const y = event ? event.clientY : 24;
      const endRadius = Math.hypot(
        Math.max(x, typeof window !== "undefined" ? window.innerWidth - x : 0),
        Math.max(y, typeof window !== "undefined" ? window.innerHeight - y : 0),
      );

      try {
        const transition = (document as any).startViewTransition(() => {
          applyTheme();
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
                  duration: 450,
                  easing: "cubic-bezier(0.2, 0, 0, 1)",
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
      } catch {
        applyTheme();
      }
    },
    [],
  );

  useEffect(() => {
    const payload: Persisted = {
      extras,
      deletedIds,
      deletedCollectionIds,
      savedIds,
      collections,
      collectionResources,
      saveCounts,
      theme,
      role,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    extras,
    deletedIds,
    deletedCollectionIds,
    savedIds,
    collections,
    collectionResources,
    saveCounts,
    theme,
    role,
  ]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDeferredSearch(search), 200);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const params = new URLSearchParams();
    if (navigation.kind === "all") params.set("category", "all");
    if (navigation.kind === "category" && navigation.categoryId !== "development") {
      params.set("category", navigation.categoryId);
    }
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
    if (deferredSearch) params.set("search", deferredSearch);
    if (filters.tagIds[0]) params.set("tag", filters.tagIds[0]);
    if (view !== "grid") params.set("view", view);
    if (sort !== "recent") params.set("sort", sort);
    const next = params.toString();
    const url = next ? `${currentPath}?${next}` : currentPath;
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
    const baseMap = new Map<string, Resource>();
    if (remoteResources && remoteResources.length > 0) {
      for (const item of remoteResources) {
        if (!LEGACY_DUMMY_IDS.has(item.id)) {
          baseMap.set(item.id, item);
        }
      }
    }
    const baseList = Array.from(baseMap.values());

    const extraMap = new Map(extras.map((item) => [item.id, item]));
    const fromBase = baseList
      .filter((item) => !deletedIds.includes(item.id))
      .map((item) => extraMap.get(item.id) ?? item);

    const baseIdSet = new Set(baseList.map((s) => s.id));
    const pureExtras = extras.filter(
      (item) => !baseIdSet.has(item.id) && !deletedIds.includes(item.id) && !LEGACY_DUMMY_IDS.has(item.id),
    );

    const merged = [...pureExtras, ...fromBase];
    return merged.map((resource) => ({
      ...resource,
      saveCount: saveCounts[resource.id] ?? resource.saveCount,
    }));
  }, [deletedIds, extras, remoteResources, saveCounts]);

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
      };

      // Optimistic local state update
      setExtras((current) => [resource, ...current]);
      if (data.collectionId) {
        setCollectionResources((current) => [
          { collectionId: data.collectionId as string, resourceId: id, createdAt: now },
          ...current,
        ]);
      }

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
            tags: finalTags,
            collectionId: data.collectionId || undefined,
            createdBy: currentUser?.id || undefined,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.ok) {
          setToast("Resource added & synced.");
          await refreshResources();
        } else {
          console.warn("Backend sync notice:", resData?.error);
          if (resData?.error?.includes("invalid input syntax for type uuid")) {
            setToast("Saved locally. Run migration 003_fix_schema.sql in Supabase.");
          } else {
            setToast(resData?.error ? `Synced locally (${resData.error})` : "Resource added.");
          }
        }
      } catch (e) {
        console.warn("Could not reach /api/resources, saved locally:", e);
        setToast("Resource saved locally.");
      }

      broadcastSync();
      return { ok: true as const };
    },
    [currentUser, isAdmin, resources, refreshResources, broadcastSync],
  );

  const updateResource = useCallback(
    async (id: string, patch: Partial<Resource>) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
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
        await refreshResources();
      } catch (e) {
        console.warn("Could not sync update to backend:", e);
      }

      broadcastSync();
      setToast("Resource updated.");
    },
    [isAdmin, remoteResources, refreshResources, broadcastSync],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      if (!isAdmin) {
        setToast("Permission denied: Admin profile required.");
        return;
      }

      setExtras((current) => current.filter((item) => item.id !== id));
      setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
      setSelectedId(null);

      try {
        await fetch(`/api/resources?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        await refreshResources();
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

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("collections").insert({
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
        }).then();
      }

      return collection;
    },
    [currentUser?.id, isAdmin],
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

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("collections").update({
          name: trimmed,
          slug: slugify(trimmed),
          updated_at: new Date().toISOString(),
        }).eq("id", id).then();
      }

      setToast("Folder renamed.");
    },
    [isAdmin],
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

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("collections").delete().eq("id", id).then();
      }

      setToast("Folder deleted.");
    },
    [isAdmin],
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

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("categories").insert({
          id: newCat.id,
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description,
          parent_id: newCat.parentId,
        }).then();
      }

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

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("categories").delete().eq("id", id).then();
      }

      setToast("Category deleted.");
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

      setToast("Tool type deleted.");
      broadcastSync();
    },
    [isAdmin, broadcastSync],
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
    sidebarCollapsed,
    addOpen,
    commandOpen,
    authModalOpen,
    toast,
    theme,
    role,
    isAdmin,
    currentUser,
    result,
    selected,
    setNavigation: (next) => {
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
    setCommandOpen,
    setAuthModalOpen,
    setTheme,
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
        return [
          { collectionId, resourceId, createdAt: new Date().toISOString() },
          ...current,
        ];
      });
    },
    createCollection,
    renameCollection,
    deleteCollection,
    createResource,
    updateResource,
    deleteResource,
    collectionResourceIds,
    categories,
    resourceTypes,
    addCategory,
    deleteCategory,
    addResourceType,
    deleteResourceType,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const value = useContext(VaultContext);
  if (!value) throw new Error("useVault must be used within VaultProvider");
  return value;
}
