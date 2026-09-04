import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";
import { slugify, domainFromUrl, normalizeUrl } from "@/lib/utils";
import type { Resource } from "@/types";

async function ensureCategory(supabase: ReturnType<typeof getSupabaseAdminClient>, categoryId: string) {
  if (!supabase || !categoryId) return;
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .limit(1);

  if (!existing || existing.length === 0) {
    const name = categoryId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    let parentId: string | null = null;
    if (categoryId.startsWith("development-")) parentId = "development";
    else if (categoryId.startsWith("design-")) parentId = "design";

    await supabase.from("categories").insert({
      id: categoryId,
      name,
      slug: categoryId,
      description: name,
      parent_id: parentId,
    });
  }
}

async function ensureTags(supabase: ReturnType<typeof getSupabaseAdminClient>, tagIds: string[]) {
  if (!supabase || !Array.isArray(tagIds) || tagIds.length === 0) return;
  const { data: existingTags } = await supabase
    .from("tags")
    .select("id")
    .in("id", tagIds);

  const existingIds = new Set((existingTags || []).map((t) => t.id));
  const missing = tagIds.filter((t) => !existingIds.has(t));

  if (missing.length > 0) {
    const rows = missing.map((t) => ({
      id: t,
      name: t,
      slug: slugify(t) || t,
    }));
    await supabase.from("tags").insert(rows);
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const resources: Resource[] = Array.isArray(body.resources) ? body.resources : [];

    if (resources.length === 0) {
      return NextResponse.json({ ok: true, syncedCount: 0, message: "No resources to sync." });
    }

    let syncedCount = 0;
    const errors: Array<{ id: string; name: string; error: string }> = [];
    const now = new Date().toISOString();

    for (const item of resources) {
      try {
        if (!item.name || !item.url) continue;

        let normalizedUrl: string;
        try {
          normalizedUrl = normalizeUrl(item.url);
        } catch {
          normalizedUrl = item.url;
        }

        const categoryId = item.categoryId || "development";
        await ensureCategory(supabase, categoryId);

        if (Array.isArray(item.tagIds) && item.tagIds.length > 0) {
          await ensureTags(supabase, item.tagIds);
        }

        const resourceId = item.id || crypto.randomUUID();
        const domain = item.domain || domainFromUrl(normalizedUrl);
        const slug = item.slug || slugify(item.name);

        // Safely check existing resource by URL or ID
        let targetId = resourceId;
        const { data: byUrl } = await supabase
          .from("resources")
          .select("id")
          .eq("url", normalizedUrl)
          .limit(1);

        if (byUrl && byUrl.length > 0) {
          targetId = byUrl[0].id;
        } else if (resourceId) {
          const { data: byId } = await supabase
            .from("resources")
            .select("id")
            .eq("id", resourceId)
            .limit(1);
          if (byId && byId.length > 0) {
            targetId = byId[0].id;
          }
        }

        const row = {
          id: targetId,
          name: item.name,
          slug,
          description: item.description || "",
          url: normalizedUrl,
          domain,
          icon_url: item.iconUrl || null,
          type: item.type || "tool",
          category_id: categoryId,
          created_by: item.createdBy || null,
          is_public: item.isPublic ?? true,
          updated_at: now,
        };

        const { error: upsertErr } = await supabase
          .from("resources")
          .upsert(row, { onConflict: "id" });

        if (upsertErr) {
          console.error(`[api/resources/sync] Failed for ${item.name}:`, upsertErr);
          errors.push({ id: item.id, name: item.name, error: upsertErr.message });
          continue;
        }

        if (Array.isArray(item.tagIds) && item.tagIds.length > 0) {
          await supabase.from("resource_tags").delete().eq("resource_id", targetId);
          await supabase.from("resource_tags").insert(
            item.tagIds.map((tid: string) => ({ resource_id: targetId, tag_id: tid })),
          );
        }

        syncedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sync error";
        errors.push({ id: item.id, name: item.name, error: msg });
      }
    }

    return NextResponse.json({
      ok: true,
      syncedCount,
      totalSubmitted: resources.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources/sync POST] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
