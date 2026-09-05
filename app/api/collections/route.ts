import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ collections: [], collectionResources: [] });
  }

  try {
    const [collsRes, collResRes] = await Promise.all([
      supabase.from("collections").select("*").order("name", { ascending: true }),
      supabase.from("collection_resources").select("*"),
    ]);

    return NextResponse.json({
      collections: collsRes.data || [],
      collectionResources: collResRes.data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, collections: [], collectionResources: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { action, collection, resourceId, collectionId } = body;

    if (action === "add_resource") {
      if (!resourceId || !collectionId) {
        return NextResponse.json({ ok: false, error: "Missing resourceId or collectionId" }, { status: 400 });
      }
      const { error } = await supabase.from("collection_resources").upsert({
        collection_id: collectionId,
        resource_id: resourceId,
      });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "add_resources") {
      const { resourceIds } = body;
      const ids: string[] = Array.isArray(resourceIds) ? resourceIds : (resourceId ? [resourceId] : []);
      if (!ids.length || !collectionId) {
        return NextResponse.json({ ok: false, error: "Missing resourceIds or collectionId" }, { status: 400 });
      }
      const rows = ids.map((rId) => ({
        collection_id: collectionId,
        resource_id: rId,
      }));
      const { error } = await supabase.from("collection_resources").upsert(rows);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, count: ids.length });
    }

    if (!collection?.id || !collection?.name) {
      return NextResponse.json({ ok: false, error: "Missing collection details" }, { status: 400 });
    }

    // Check if collection already exists to avoid overwriting created_by, description, or icon
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collection.id)
      .limit(1);

    if (existing && existing.length > 0) {
      const updateData: Record<string, unknown> = {
        name: collection.name,
        slug: collection.slug || collection.id,
        updated_at: new Date().toISOString(),
      };
      if (collection.description !== undefined) updateData.description = collection.description;
      if (collection.icon !== undefined) updateData.icon = collection.icon;
      if (collection.createdBy !== undefined) updateData.created_by = collection.createdBy;

      const { error } = await supabase.from("collections").update(updateData).eq("id", collection.id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, updated: true });
    }

    const { error } = await supabase.from("collections").insert({
      id: collection.id,
      name: collection.name,
      slug: collection.slug || collection.id,
      description: collection.description || "",
      icon: collection.icon || null,
      created_by: collection.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, created: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    let bodyData: { action?: string; collectionId?: string; resourceId?: string; resourceIds?: string[] } | null = null;
    try {
      bodyData = await request.json();
    } catch {
      // Body may be empty if called via query params
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const collectionId = bodyData?.collectionId || searchParams.get("collectionId");
    const resourceId = bodyData?.resourceId || searchParams.get("resourceId");
    const resourceIds = bodyData?.resourceIds;
    const action = bodyData?.action;

    if (action === "remove_resources" || (Array.isArray(resourceIds) && resourceIds.length > 0 && collectionId)) {
      const ids: string[] = resourceIds || [];
      if (ids.length > 0 && collectionId) {
        const { error } = await supabase
          .from("collection_resources")
          .delete()
          .eq("collection_id", collectionId)
          .in("resource_id", ids);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        return NextResponse.json({ ok: true, count: ids.length });
      }
    }

    if (collectionId && resourceId) {
      const { error } = await supabase
        .from("collection_resources")
        .delete()
        .eq("collection_id", collectionId)
        .eq("resource_id", resourceId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (id) {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Missing id parameter" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
