import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";
import { slugify, domainFromUrl, normalizeUrl } from "@/lib/utils";
import type { Resource } from "@/types";

type DbResourceRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  domain: string;
  icon_url: string | null;
  type: Resource["type"];
  pricing?: "Free" | "Freemium";
  is_recommended?: boolean;
  category_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  resource_tags?: { tag_id: string }[];
};

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ resources: [] });
  }

  try {
    const { data: resData, error } = await supabase
      .from("resources")
      .select(`
        *,
        resource_tags ( tag_id )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/resources GET] Supabase select error:", error);
      return NextResponse.json({ error: error.message, resources: [] }, { status: 500 });
    }

    const mapped: Resource[] = ((resData as unknown as DbResourceRow[]) || []).map((r) => {
      const rawTags = Array.isArray(r.resource_tags) ? r.resource_tags.map((t) => t.tag_id) : [];
      const hasRecommendedTag = rawTags.includes("admin-recommended");
      const cleanTags = rawTags.filter((t) => t !== "admin-recommended");

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description ?? "",
        url: r.url,
        domain: r.domain,
        iconUrl: r.icon_url,
        type: r.type,
        pricing: r.pricing === "Free" ? "Free" : "Freemium",
        isRecommended: Boolean(r.is_recommended) || hasRecommendedTag,
        categoryId: r.category_id || "",
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        isPublic: r.is_public,
        tagIds: cleanTags,
        saveCount: 0,
      };
    });

    return NextResponse.json({ resources: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources GET] Unexpected error:", err);
    return NextResponse.json({ error: message, resources: [] }, { status: 500 });
  }
}

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
    const { id, name, description, url, categoryId, type, tags, collectionId, createdBy, pricing, isRecommended } = body;

    if (!name || !url || !categoryId || !type) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);
    const domain = domainFromUrl(normalizedUrl);
    const slug = slugify(name);
    const resourceId = id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Ensure category exists to prevent FK violation
    await ensureCategory(supabase, categoryId);

    // Check if resource already exists by URL or ID (safely avoiding PostgREST .or() URL delimiter errors)
    let targetId: string | null = null;
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

    if (targetId) {
      // Upsert/update existing resource
      const updateData: Record<string, unknown> = {
        name,
        slug,
        description: description || "",
        url: normalizedUrl,
        domain,
        type,
        category_id: categoryId,
        is_public: true,
        updated_at: now,
      };
      if (pricing) updateData.pricing = pricing;
      if (isRecommended !== undefined) updateData.is_recommended = Boolean(isRecommended);

      let { error: updateErr } = await supabase
        .from("resources")
        .update(updateData)
        .eq("id", targetId);

      // If is_recommended column doesn't exist yet, retry without it
      if (updateErr && (updateErr.message.includes("is_recommended") || updateErr.code === "42703")) {
        delete updateData.is_recommended;
        const retry = await supabase.from("resources").update(updateData).eq("id", targetId);
        updateErr = retry.error;
      }

      // If pricing column doesn't exist yet, retry without pricing
      if (updateErr && (updateErr.message.includes("pricing") || updateErr.code === "42703")) {
        delete updateData.pricing;
        const retry = await supabase.from("resources").update(updateData).eq("id", targetId);
        updateErr = retry.error;
      }

      if (updateErr) {
        console.error("[api/resources POST -> update] Error:", updateErr);
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 400 });
      }

      if (Array.isArray(tags)) {
        const finalTagsToSync = tags.filter((t: string) => t !== "admin-recommended");
        if (isRecommended) {
          finalTagsToSync.push("admin-recommended");
        }
        await ensureTags(supabase, finalTagsToSync);
        await supabase.from("resource_tags").delete().eq("resource_id", targetId);
        if (finalTagsToSync.length > 0) {
          await supabase.from("resource_tags").insert(
            finalTagsToSync.map((tid: string) => ({ resource_id: targetId, tag_id: tid })),
          );
        }
      } else if (isRecommended !== undefined) {
        if (isRecommended) {
          await ensureTags(supabase, ["admin-recommended"]);
          await supabase.from("resource_tags").upsert({ resource_id: targetId, tag_id: "admin-recommended" });
        } else {
          await supabase.from("resource_tags").delete().eq("resource_id", targetId).eq("tag_id", "admin-recommended");
        }
      }

      const updatedResource: Resource = {
        id: targetId,
        name,
        slug,
        description: description || "",
        url: normalizedUrl,
        domain,
        iconUrl: null,
        type,
        categoryId,
        createdBy: createdBy || null,
        createdAt: now,
        updatedAt: now,
        isPublic: true,
        pricing: pricing === "Free" ? "Free" : "Freemium",
        isRecommended: Boolean(isRecommended),
        tagIds: Array.isArray(tags) ? tags.filter((t: string) => t !== "admin-recommended") : [],
        saveCount: 0,
      };

      return NextResponse.json({ ok: true, resource: updatedResource, updated: true });
    }

    // Insert Resource
    const insertData: Record<string, unknown> = {
      id: resourceId,
      name,
      slug,
      description: description || "",
      url: normalizedUrl,
      domain,
      type,
      category_id: categoryId,
      created_by: createdBy || null,
      is_public: true,
      pricing: pricing || "Freemium",
      created_at: now,
      updated_at: now,
    };
    if (isRecommended !== undefined) {
      insertData.is_recommended = Boolean(isRecommended);
    }

    let { error: insErr } = await supabase.from("resources").insert(insertData);

    // If is_recommended column doesn't exist yet, retry without is_recommended
    if (insErr && (insErr.message.includes("is_recommended") || insErr.code === "42703")) {
      delete insertData.is_recommended;
      const retry = await supabase.from("resources").insert(insertData);
      insErr = retry.error;
    }

    // If pricing column doesn't exist yet, retry without pricing
    if (insErr && (insErr.message.includes("pricing") || insErr.code === "42703")) {
      delete insertData.pricing;
      const retry = await supabase.from("resources").insert(insertData);
      insErr = retry.error;
    }

    if (insErr) {
      console.error("[api/resources POST] Insert resource error:", insErr);
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 400 });
    }

    // Insert Tags
    const tagsToInsert = Array.isArray(tags) ? tags.filter((t: string) => t !== "admin-recommended") : [];
    if (isRecommended) {
      tagsToInsert.push("admin-recommended");
    }
    if (tagsToInsert.length > 0) {
      await ensureTags(supabase, tagsToInsert);
      const tagRows = tagsToInsert.map((tid: string) => ({
        resource_id: resourceId,
        tag_id: tid,
      }));
      const { error: tagErr } = await supabase.from("resource_tags").insert(tagRows);
      if (tagErr) {
        console.warn("[api/resources POST] Tag insert error:", tagErr);
      }
    }

    // Insert into Collection if specified
    if (collectionId) {
      const { error: collErr } = await supabase.from("collection_resources").insert({
        collection_id: collectionId,
        resource_id: resourceId,
      });
      if (collErr) {
        console.warn("[api/resources POST] Collection resource insert error:", collErr);
      }
    }

    const createdResource: Resource = {
      id: resourceId,
      name,
      slug,
      description: description || "",
      url: normalizedUrl,
      domain,
      iconUrl: null,
      type,
      categoryId,
      createdBy: createdBy || null,
      createdAt: now,
      updatedAt: now,
      isPublic: true,
      pricing: pricing === "Free" ? "Free" : "Freemium",
      isRecommended: Boolean(isRecommended),
      tagIds: Array.isArray(tags) ? tags.filter((t: string) => t !== "admin-recommended") : [],
      saveCount: 0,
    };

    return NextResponse.json({ ok: true, resource: createdResource });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources POST] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, patch } = body;

    if (!id || !patch) {
      return NextResponse.json({ ok: false, error: "Missing id or patch" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.name) {
      updatePayload.name = patch.name;
      updatePayload.slug = slugify(patch.name);
    }
    if (patch.description !== undefined) updatePayload.description = patch.description;
    if (patch.url) {
      const normalizedUrl = normalizeUrl(patch.url);
      updatePayload.url = normalizedUrl;
      updatePayload.domain = domainFromUrl(normalizedUrl);
    }
    if (patch.type) updatePayload.type = patch.type;
    if (patch.pricing) updatePayload.pricing = patch.pricing;
    if (patch.categoryId) {
      await ensureCategory(supabase, patch.categoryId);
      updatePayload.category_id = patch.categoryId;
    }
    if (patch.isPublic !== undefined) updatePayload.is_public = patch.isPublic;
    if (patch.isRecommended !== undefined) updatePayload.is_recommended = patch.isRecommended;

    let { error: updateErr } = await supabase
      .from("resources")
      .update(updatePayload)
      .eq("id", id);

    // If pricing or is_recommended column doesn't exist yet, retry without them
    if (
      updateErr &&
      (updateErr.message.includes("pricing") ||
        updateErr.message.includes("is_recommended") ||
        updateErr.code === "42703")
    ) {
      delete updatePayload.pricing;
      delete updatePayload.is_recommended;
      const retry = await supabase.from("resources").update(updatePayload).eq("id", id);
      updateErr = retry.error;
    }

    if (updateErr) {
      console.error("[api/resources PATCH] Update error:", updateErr);
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 400 });
    }

    // Update tags if provided or recommendation tag
    if (Array.isArray(patch.tagIds)) {
      const { data: existingRecTag } = await supabase
        .from("resource_tags")
        .select("tag_id")
        .eq("resource_id", id)
        .eq("tag_id", "admin-recommended")
        .maybeSingle();

      const shouldBeRecommended =
        patch.isRecommended !== undefined ? Boolean(patch.isRecommended) : Boolean(existingRecTag);

      const finalTagsToSync = patch.tagIds.filter((t: string) => t !== "admin-recommended");
      if (shouldBeRecommended) {
        finalTagsToSync.push("admin-recommended");
      }

      await ensureTags(supabase, finalTagsToSync);
      await supabase.from("resource_tags").delete().eq("resource_id", id);
      if (finalTagsToSync.length > 0) {
        await supabase.from("resource_tags").insert(
          finalTagsToSync.map((tid: string) => ({ resource_id: id, tag_id: tid })),
        );
      }
    } else if (patch.isRecommended !== undefined) {
      if (patch.isRecommended) {
        await ensureTags(supabase, ["admin-recommended"]);
        await supabase.from("resource_tags").upsert({
          resource_id: id,
          tag_id: "admin-recommended",
        });
      } else {
        await supabase
          .from("resource_tags")
          .delete()
          .eq("resource_id", id)
          .eq("tag_id", "admin-recommended");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources PATCH] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id parameter" }, { status: 400 });
    }

    const { error: delErr } = await supabase.from("resources").delete().eq("id", id);
    if (delErr) {
      console.error("[api/resources DELETE] Delete error:", delErr);
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources DELETE] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
