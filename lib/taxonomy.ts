import type { Category, ResourceType, Tag } from "@/types";

const now = "2026-01-01T00:00:00.000Z";

export const resourceTypes: ResourceType[] = [
  "Website",
  "Tool",
  "UI Kit",
  "Component Library",
  "Icon Library",
  "Font",
  "Illustration",
  "3D",
  "Template",
  "Article",
  "Video",
  "Course",
  "Community",
  "Open Source",
  "AI Tool",
  "AI Image",
  "API",
  "Library",
  "Plugin",
  "Design System",
  "Color",
  "Inspiration",
  "Shaders",
  "Mockup",
  "Image",
  "Animation",
  "Web Design",
  "Widgets",
  "Hosting",
  "Organization",
  "Other",
].map((name) => {
  let slug = name.toLowerCase().replace(/\s+/g, "-");
  if (name === "Mockup") slug = "mock-up";
  if (name === "Web Design") slug = "web-dev-design";
  return {
    id: slug,
    name,
    slug,
  };
});

const top = (
  id: string,
  name: string,
  description: string,
): Category => ({
  id,
  name,
  slug: id,
  description,
  icon: null,
  parentId: null,
  createdAt: now,
});

const child = (parentId: string, name: string): Category => {
  const slug = `${parentId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return {
    id: slug,
    name,
    slug,
    description: name,
    icon: null,
    parentId,
    createdAt: now,
  };
};

export const categories: Category[] = [
  top("development", "Developer Tools", "Libraries, APIs, frameworks, and developer tools"),
  top("design", "Design Tools", "UI/UX, design systems, typography, icons, and visual craft"),
  ...[
    "Developer Tools",
    "React",
    "Vue",
    "CSS",
    "JavaScript",
    "Components",
    "Libraries",
    "APIs",
    "Open Source",
    "AI Tools",
    "Documentation",
  ].map((name) => child("development", name)),
  ...[
    "UI/UX",
    "Design Systems",
    "Typography",
    "Icons",
    "Colors",
    "Illustration",
    "3D",
    "Motion",
    "Branding",
    "AI Design",
    "Inspiration",
    "Assets",
  ].map((name) => child("design", name)),
];

const tagNames = [
  "minimal",
  "free",
  "open-source",
  "figma",
  "react",
  "saas",
  "mobile",
  "web",
  "productivity",
  "typography",
  "icons",
  "animation",
  "3d",
  "ai",
  "design-system",
  "components",
  "css",
  "collaboration",
  "prototype",
  "photos",
  "color",
  "research",
  "illustration",
];

export const tags: Tag[] = tagNames.map((name) => ({
  id: name,
  name,
  slug: name,
  createdAt: now,
}));

export const topCategories = categories.filter((category) => !category.parentId);

const dynamicCategories = new Map<string, Category>();
const deletedCategories = new Set<string>();

export function registerCategory(c: Category) {
  dynamicCategories.set(c.id, c);
  deletedCategories.delete(c.id);
}

export function unregisterCategory(id: string) {
  dynamicCategories.delete(id);
  deletedCategories.add(id);
}

export function getAllCategories(customCats: Category[] = [], deletedIds: string[] = []): Category[] {
  const deletedSet = new Set([...deletedCategories, ...deletedIds]);
  const base = categories.filter((c) => !deletedSet.has(c.id));
  const custom = customCats.filter((c) => !deletedSet.has(c.id) && !base.some((b) => b.id === c.id));
  return [...base, ...custom];
}

export function categoryById(id: string) {
  if (deletedCategories.has(id)) return undefined;
  return dynamicCategories.get(id) ?? categories.find((category) => category.id === id);
}

export function childCategories(parentId: string) {
  return getAllCategories().filter((category) => category.parentId === parentId);
}

const dynamicTypes = new Map<string, ResourceType>();
const deletedTypes = new Set<string>();

export function registerResourceType(t: ResourceType) {
  dynamicTypes.set(t.slug, t);
  dynamicTypes.set(t.id, t);
  deletedTypes.delete(t.slug);
  deletedTypes.delete(t.id);
}

export function unregisterResourceType(idOrSlug: string) {
  dynamicTypes.delete(idOrSlug);
  deletedTypes.add(idOrSlug);
}

export function getAllResourceTypes(customTypes: ResourceType[] = [], deletedIds: string[] = []): ResourceType[] {
  const deletedSet = new Set([...deletedTypes, ...deletedIds]);
  const base = resourceTypes.filter((t) => !deletedSet.has(t.id) && !deletedSet.has(t.slug));
  const custom = customTypes.filter((t) => !deletedSet.has(t.id) && !deletedSet.has(t.slug) && !base.some((b) => b.slug === t.slug));
  return [...base, ...custom];
}

export function typeBySlug(slug: string) {
  if (deletedTypes.has(slug)) return undefined;
  return dynamicTypes.get(slug) ?? resourceTypes.find((type) => type.slug === slug);
}

export function tagById(id: string) {
  return tags.find((tag) => tag.id === id);
}

const FREE_RESOURCE_IDS = new Set([
  "shadcn-ui",
  "radix-ui",
  "lucide",
  "react",
  "react-aria",
  "tailwind",
  "google-fonts",
  "fontshare",
  "unsplash",
  "nextjs",
  "heroicons",
  "phosphor",
  "storybook",
  "inter",
  "geist",
  "astro",
  "mdn",
  "css-tricks",
  "awwwards",
]);


export function getResourcePricing(resource: { id?: string; tagIds?: string[]; type?: string; pricing?: "Free" | "Freemium" }): "Free" | "Freemium" {
  if (resource.pricing === "Free" || resource.pricing === "Freemium") return resource.pricing;
  if (resource.id && FREE_RESOURCE_IDS.has(resource.id)) return "Free";
  if (resource.tagIds?.includes("free") && !resource.tagIds?.includes("saas")) return "Free";
  if (resource.type === "font" || resource.type === "article" || resource.type === "icon-library") return "Free";
  return "Freemium";
}

