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

export function resourceMatchesTag(resource: Resource, tagId: string): boolean {
  if (resource.tagIds?.includes(tagId)) return true;
  const tag = tagById(tagId);
  const term = (tag?.slug || tagId).toLowerCase().trim();
  if (!term) return false;

  const name = (resource.name || "").toLowerCase();
  const desc = (resource.description || "").toLowerCase();
  const type = (resource.type || "").toLowerCase();
  const cat = (resource.categoryId || "").toLowerCase();

  // Keyword / slug matching
  if (name.includes(term) || desc.includes(term) || type.includes(term) || cat.includes(term)) {
    return true;
  }

  // Synonym / derivative matching
  if (term === "react" && (name.includes("react") || desc.includes("react"))) return true;
  if (
    term === "components" &&
    (type === "component-library" || type === "ui-kit" || desc.includes("component") || name.includes("ui"))
  )
    return true;
  if (term === "icons" && (type === "icon-library" || desc.includes("icon"))) return true;
  if (term === "typography" && (type === "font" || desc.includes("font") || desc.includes("type")))
    return true;
  if (term === "3d" && (type === "3d" || desc.includes("3d") || desc.includes("three.js") || desc.includes("webgl")))
    return true;
  if (term === "animation" && (type === "animation" || desc.includes("animat") || desc.includes("motion")))
    return true;
  if (
    term === "ai" &&
    (type.startsWith("ai") || desc.includes(" ai ") || desc.includes("artificial intelligence") || desc.includes("gpt"))
  )
    return true;
  if (term === "figma" && (desc.includes("figma") || name.includes("figma"))) return true;
  if (term === "design-system" && (type === "design-system" || desc.includes("design system")))
    return true;
  if (term === "css" && (desc.includes("css") || desc.includes("tailwind") || desc.includes("style")))
    return true;
  if (term === "web" && (cat.includes("development") || cat.includes("design") || desc.includes("web") || desc.includes("site")))
    return true;

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

  if (filters.tagIds.length > 0) {
    list = list.filter((resource) =>
      filters.tagIds.some((tagId) => resourceMatchesTag(resource, tagId)),
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
