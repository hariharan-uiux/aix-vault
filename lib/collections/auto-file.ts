import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

/**
 * Every resource lives in a folder named after its type ("AI Tool", "Component Library",
 * "Git Repo", ...). Folders are created automatically the first time a type is used, so a
 * brand new type gets a brand new folder without any manual step.
 */

const FALLBACK_FOLDER = "Other";
const CACHE_TTL_MS = 60_000;

let folderNameCache = new Map<string, { name: string; at: number }>();
let typeNamesCache: { names: Set<string>; at: number } = { names: new Set(), at: 0 };

function prettifyType(type: string): string {
  const cleaned = type.replace(/[-_]+/g, " ").trim();
  if (!cleaned) return FALLBACK_FOLDER;
  const upperWords = new Set(["ai", "ui", "ux", "api", "3d", "2d", "md", "css", "seo"]);
  return cleaned
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (upperWords.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

async function knownTypeNames(supabase: SupabaseClient): Promise<Set<string>> {
  if (Date.now() - typeNamesCache.at < CACHE_TTL_MS && typeNamesCache.names.size > 0) {
    return typeNamesCache.names;
  }
  const { data } = await supabase.from("resource_types").select("name");
  const names = new Set((data || []).map((row: { name: string }) => row.name));
  typeNamesCache = { names, at: Date.now() };
  return names;
}

/** Folder name for a resource type slug, using the display name from resource_types. */
export async function folderNameForType(
  type: string | null | undefined,
  supabase: SupabaseClient = getSupabaseAdminClient() || (getSupabaseClient() as SupabaseClient),
): Promise<string> {
  const key = typeof type === "string" ? type.trim().toLowerCase() : "";
  if (!key) return FALLBACK_FOLDER;
  if (!supabase) return prettifyType(key);

  const cached = folderNameCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.name;

  // Look up by id first, then by slug — avoids building an interpolated PostgREST filter.
  const byId = await supabase.from("resource_types").select("name").eq("id", key).limit(1);
  let name = (byId.data && byId.data[0] && (byId.data[0].name as string)) || null;
  if (!name) {
    const bySlug = await supabase.from("resource_types").select("name").eq("slug", key).limit(1);
    name = (bySlug.data && bySlug.data[0] && (bySlug.data[0].name as string)) || null;
  }

  if (!name) return prettifyType(key); // don't cache misses: a new type may be added any moment
  folderNameCache.set(key, { name, at: Date.now() });
  return name;
}

/** Keeps the auto folder's name in step with a renamed type. */
export async function renameTypeFolder(oldName: string, newName: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase || !oldName || !newName || oldName === newName) return false;

  const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { error } = await supabase
    .from("collections")
    .update({ name: newName, slug, updated_at: new Date().toISOString() })
    .eq("name", oldName);

  for (const [key, value] of folderNameCache) {
    if (value.name === oldName) folderNameCache.delete(key);
  }
  typeNamesCache = { names: new Set(), at: 0 };

  if (error) {
    console.error(`[auto-file] Could not rename folder "${oldName}" to "${newName}":`, error.message);
    return false;
  }
  return true;
}

async function ensureFolder(supabase: SupabaseClient, name: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .ilike("name", name)
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id as string;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase.from("collections").insert({
    id,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: `Auto-filed ${name} resources`,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    const { data: retry } = await supabase
      .from("collections")
      .select("id")
      .ilike("name", name)
      .limit(1);
    if (retry && retry.length > 0) return retry[0].id as string;
    console.error(`[auto-file] Could not create folder "${name}":`, error.message);
    return null;
  }

  return id;
}

/**
 * Files a resource into the folder for its type, creating that folder if needed, and removes
 * it from any other type folder (so a type change moves the resource instead of duplicating it).
 */
export async function autoFileResource(resource: {
  id: string;
  type?: string | null;
  categoryId?: string | null;
  url?: string | null;
}): Promise<string | null> {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) return null;

  const folderName = await folderNameForType(resource.type, supabase);
  const folderId = await ensureFolder(supabase, folderName);
  if (!folderId) return null;

  // Remove stale memberships in other auto folders (type folders are the ones created by
  // this module, marked with the "Auto-filed" description).
  const typeNames = await knownTypeNames(supabase);
  typeNames.add(folderName);
  const { data: folders } = await supabase.from("collections").select("id, name, description");
  const staleIds = (folders || [])
    .filter((f: { id: string; name: string; description: string | null }) => {
      if (f.id === folderId) return false;
      const isAutoFolder = (f.description || "").startsWith("Auto-filed ");
      return isAutoFolder || typeNames.has(f.name);
    })
    .map((f: { id: string }) => f.id);

  if (staleIds.length > 0) {
    await supabase
      .from("collection_resources")
      .delete()
      .eq("resource_id", resource.id)
      .in("collection_id", staleIds);
  }

  const { error } = await supabase
    .from("collection_resources")
    .upsert({ collection_id: folderId, resource_id: resource.id });

  if (error) {
    console.error(`[auto-file] Could not add ${resource.id} to "${folderName}":`, error.message);
    return folderName;
  }

  return folderName;
}

/** Files every resource into its type folder. Safe to run repeatedly. */
export async function autoFileAll(): Promise<{
  filed: number;
  byFolder: Record<string, number>;
  foldersCreated: number;
  errors: string[];
}> {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) return { filed: 0, byFolder: {}, foldersCreated: 0, errors: ["Database not configured"] };

  const { data: existingFolders } = await supabase.from("collections").select("id");
  const before = new Set((existingFolders || []).map((f: { id: string }) => f.id));

  const { data: resources } = await supabase.from("resources").select("id, type, category_id, url");

  const byFolder: Record<string, number> = {};
  const errors: string[] = [];
  let filed = 0;

  for (const item of resources || []) {
    const folder = await autoFileResource({
      id: item.id,
      type: item.type,
      categoryId: item.category_id,
      url: item.url,
    });
    if (folder) {
      filed++;
      byFolder[folder] = (byFolder[folder] || 0) + 1;
    } else {
      errors.push(item.id);
    }
  }

  const { data: afterFolders } = await supabase.from("collections").select("id");
  const foldersCreated = (afterFolders || []).filter((f: { id: string }) => !before.has(f.id)).length;

  return { filed, byFolder, foldersCreated, errors };
}
