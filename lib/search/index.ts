import type { Resource } from "@/types";
import { categoryById, tagById, typeBySlug } from "@/lib/taxonomy";

function haystack(resource: Resource) {
  const category = categoryById(resource.categoryId);
  const type = typeBySlug(resource.type);
  const tagNames = resource.tagIds
    .map((id) => tagById(id)?.name ?? id)
    .join(" ");
  return [
    resource.name,
    resource.description,
    resource.domain,
    resource.type,
    type?.name ?? "",
    category?.name ?? "",
    tagNames,
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesQuery(resource: Resource, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return haystack(resource).includes(normalized);
}

export function rankQuery(resource: Resource, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return 0;
  const name = resource.name.toLowerCase();
  if (name === normalized) return 100;
  if (name.startsWith(normalized)) return 80;
  if (name.includes(normalized)) return 60;
  if (resource.domain.includes(normalized)) return 40;
  return 10;
}
