import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";
import { renameTypeFolder } from "@/lib/collections/auto-file";

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ resourceTypes: [] });
  }

  try {
    const { data, error } = await supabase
      .from("resource_types")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("schema cache")) {
        console.warn("[api/resource-types GET] Table not yet created in Supabase (run migration 006):", error.message);
        return NextResponse.json({ resourceTypes: [] });
      }
      console.error("[api/resource-types GET] Error:", error);
      return NextResponse.json({ error: error.message, resourceTypes: [] }, { status: 500 });
    }

    return NextResponse.json({ resourceTypes: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, resourceTypes: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, name, slug } = body;

    if (!id || !name) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Remember the previous display name so the auto folder can follow a rename.
    const { data: previous } = await supabase
      .from("resource_types")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("resource_types").upsert({
      id,
      name,
      slug: slug || id,
    });

    if (error) {
      console.error("[api/resource-types POST] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    let folderRenamed = false;
    if (previous && previous.name && previous.name !== name) {
      try {
        folderRenamed = await renameTypeFolder(previous.name as string, name as string);
      } catch (folderErr) {
        console.error("[api/resource-types POST] Folder rename failed:", folderErr);
      }
    }

    return NextResponse.json({ ok: true, folderRenamed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
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
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const { data: byId, error } = await supabase
      .from("resource_types")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      console.error("[api/resource-types DELETE] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    // Fall back to slug when the caller passed a slug instead of an id.
    let deleted = byId?.length || 0;
    if (deleted === 0) {
      const { data: bySlug, error: slugErr } = await supabase
        .from("resource_types")
        .delete()
        .eq("slug", id)
        .select("id");
      if (slugErr) {
        console.error("[api/resource-types DELETE] Error:", slugErr);
        return NextResponse.json({ ok: false, error: slugErr.message }, { status: 400 });
      }
      deleted = bySlug?.length || 0;
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
