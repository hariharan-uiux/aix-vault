import { canonicalKey } from "@/lib/utils";
import type { Filters, Navigation, Resource, SortMode } from "@/types";
import { matchesQuery, rankQuery } from "@/lib/search";
import { getResourcePricing, tagById } from "@/lib/taxonomy";
import { PAGE_SIZE } from "@/lib/resources/schema";

export function isDuplicate(resources: Resource[], url: string, ignoreId?: string) {
  const key = canonicalKey(url);
  return resources.find(
    (resource) => resource.id !== ignoreId && canonicalKey(resource.url) === key,
  );
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
    list = list.filter(
      (resource) =>
        resource.categoryId === navigation.categoryId ||
        resource.categoryId.startsWith(`${navigation.categoryId}-`),
    );
  }

  if (navigation.kind === "collection") {
    list = list.filter((resource) => collectionResourceIds.includes(resource.id));
    if (navigation.platform && navigation.platform !== "all") {
      list = list.filter(
        (resource) =>
          resource.categoryId === navigation.platform ||
          resource.categoryId.startsWith(`${navigation.platform}-`),
      );
    }
  }

  if (navigation.kind === "saved") {
    list = list.filter((resource) => savedIds.includes(resource.id));
    if (navigation.platform && navigation.platform !== "all") {
      list = list.filter(
        (resource) =>
          resource.categoryId === navigation.platform ||
          resource.categoryId.startsWith(`${navigation.platform}-`),
      );
    }
  }

  if (filters.type) {
    list = list.filter((resource) => resource.type === filters.type);
  }

  if (filters.tagIds.length > 0) {
    list = list.filter((resource) =>
      filters.tagIds.every((tagId) => resource.tagIds.includes(tagId)),
    );
  }

  if (filters.free) {
    list = list.filter((resource) =>
      resource.tagIds.some((id) => tagById(id)?.slug === "free") ||
      getResourcePricing(resource) === "Free",
    );
  }

  if (filters.openSource) {
    list = list.filter((resource) =>
      resource.tagIds.some((id) => tagById(id)?.slug === "open-source"),
    );
  }

  if (search.trim()) {
    list = list
      .filter((resource) => matchesQuery(resource, search))
      .sort((a, b) => rankQuery(b, search) - rankQuery(a, search));
  } else if (sort === "name") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "saved") {
    list = [...list].sort((a, b) => b.saveCount - a.saveCount || a.name.localeCompare(b.name));
  } else {
    list = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const total = list.length;
  const visible = list.slice(0, page * PAGE_SIZE);
  return { total, visible, hasMore: visible.length < total };
}

export function getResource(resources: Resource[], id: string) {
  return resources.find((resource) => resource.id === id) ?? null;
}
