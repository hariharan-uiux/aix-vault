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
  "API",
  "Library",
  "Plugin",
  "Design System",
  "Color",
  "Other",
].map((name) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

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

export function categoryById(id: string) {
  return categories.find((category) => category.id === id);
}

export function childCategories(parentId: string) {
  return categories.filter((category) => category.parentId === parentId);
}

export function typeBySlug(slug: string) {
  return resourceTypes.find((type) => type.slug === slug);
}

export function tagById(id: string) {
  return tags.find((tag) => tag.id === id);
}
