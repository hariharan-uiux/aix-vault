import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, parent_id, icon, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("[api/categories GET] Error:", error);
      return NextResponse.json({ error: error.message, categories: [] }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, categories: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, name, slug, description, parentId } = body;

    if (!id || !name) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase.from("categories").upsert({
      id,
      name,
      slug: slug || id,
      description: description || name,
      parent_id: parentId || null,
    });

    if (error) {
      console.error("[api/categories POST] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

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

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("[api/categories DELETE] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
