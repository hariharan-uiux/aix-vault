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

    if (!collection?.id || !collection?.name) {
      return NextResponse.json({ ok: false, error: "Missing collection details" }, { status: 400 });
    }

    const { error } = await supabase.from("collections").upsert({
      id: collection.id,
      name: collection.name,
      slug: collection.slug || collection.id,
      description: collection.description || "",
      created_by: collection.createdBy || null,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const collectionId = searchParams.get("collectionId");
    const resourceId = searchParams.get("resourceId");

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
