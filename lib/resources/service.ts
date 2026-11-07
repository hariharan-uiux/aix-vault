import { canonicalKey } from "@/lib/utils";
import type { Filters, Navigation, Resource, SortMode } from "@/types";
import { matchesQuery, rankQuery } from "@/lib/search";
import { categoryById, getResourcePricing } from "@/lib/taxonomy";
import { PAGE_SIZE } from "@/lib/resources/schema";

export function isDuplicate(resources: Resource[], url: string, ignoreId?: string) {
  const key = canonicalKey(url);
  return resources.find(
    (resource) => resource.id !== ignoreId && canonicalKey(resource.url) === key,
  );
}

function isResourceInCategory(resource: Resource, targetCategoryId: string): boolean {
  const resCat = resource.categoryId || "";
  if (!resCat || !targetCategoryId) return false;
  if (resCat === targetCategoryId) return true;
  if (resCat.startsWith(`${targetCategoryId}-`)) return true;

  let cat = categoryById(resCat);
  while (cat && cat.parentId) {
    if (cat.parentId === targetCategoryId) return true;
    if (cat.parentId.startsWith(`${targetCategoryId}-`)) return true;
    cat = categoryById(cat.parentId);
  }
  return false;
}

export function filterResources(options: {
  resources: Resource[];
  navigation: Navigation;
  collectionResourceIds: string[];
  savedIds: string[];
  search: string;
  filters: Filters;
  sort: SortMode;
  page: number;
}) {
  const { resources, navigation, collectionResourceIds, savedIds, search, filters, sort, page } =
    options;

  let list = resources.filter((resource) => resource.isPublic);

  if (navigation.kind === "category") {
    list = list.filter((resource) => isResourceInCategory(resource, navigation.categoryId));
  }

  if (navigation.kind === "collection") {
    list = list.filter((resource) => collectionResourceIds.includes(resource.id));
    if (navigation.platform && navigation.platform !== "all") {
      list = list.filter((resource) => isResourceInCategory(resource, navigation.platform!));
    }
  }

  if (navigation.kind === "saved") {
    list = list.filter((resource) => savedIds.includes(resource.id));
    if (navigation.platform && navigation.platform !== "all") {
      list = list.filter((resource) => isResourceInCategory(resource, navigation.platform!));
    }
  }

  if (filters.type) {
    const targetType = filters.type.toLowerCase();
    list = list.filter((resource) => {
      const resType = (resource.type || "").toLowerCase();
      if (resType === targetType) return true;
      if (targetType === "mock-up" && resType === "mockup") return true;
      if (targetType === "mockup" && resType === "mock-up") return true;
      if (targetType === "web-dev-design" && (resType === "web-design" || resType === "website")) return true;
      return false;
    });
  }

  if (filters.free === "free") {
    list = list.filter((resource) => getResourcePricing(resource) === "Free");
  } else if (filters.free === "freemium") {
    list = list.filter((resource) =>
      getResourcePricing(resource) === "Freemium",
    );
  }

  if (filters.openSource) {
    list = list.filter((resource) => (resource.type || "").toLowerCase() === "open-source");
  }

  if (filters.hasUpvotes) {
    list = list.filter((resource) => (resource.upvotes ?? 0) > 0);
  }

  if (search.trim()) {
    list = list
      .filter((resource) => matchesQuery(resource, search))
      .sort((a, b) => rankQuery(b, search) - rankQuery(a, search));
  } else if (sort === "name") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "recent") {
    list = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else {
    // Default: sort by upvotes descending, then recently created
    list = [...list].sort((a, b) => {
      const diff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const total = list.length;
  const visible = list.slice(0, page * PAGE_SIZE);
  return { total, visible, hasMore: visible.length < total };
}
