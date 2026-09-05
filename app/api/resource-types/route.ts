import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

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

    const { error } = await supabase.from("resource_types").upsert({
      id,
      name,
      slug: slug || id,
    });

    if (error) {
      console.error("[api/resource-types POST] Error:", error);
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

    const { error } = await supabase.from("resource_types").delete().eq("id", id);
    if (error) {
      console.error("[api/resource-types DELETE] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
