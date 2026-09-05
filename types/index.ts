export type ResourceType = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  parentId: string | null;
  createdAt: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Resource = {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  domain: string;
  iconUrl: string | null;
  type: string;
  categoryId: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tagIds: string[];
  saveCount: number;
  pricing?: "Free" | "Freemium";
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionResource = {
  collectionId: string;
  resourceId: string;
  createdAt: string;
};

export type SavedResource = {
  userId: string;
  resourceId: string;
  createdAt: string;
};

export type ViewMode = "list" | "grid" | "compact";
export type SortMode = "recent" | "name";

export type Platform = "all" | "development" | "design";

export type Navigation =
  | { kind: "all" }
  | { kind: "category"; categoryId: string }
  | { kind: "collection"; collectionId: string; platform?: Platform }
  | { kind: "saved"; platform?: Platform };

export type Filters = {
  type: string | null;
  tagIds: string[];
  free: boolean;
  openSource: boolean;
};
