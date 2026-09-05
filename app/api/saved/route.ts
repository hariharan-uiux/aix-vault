import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ savedIds: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ savedIds: [] });
    }

    const { data, error } = await supabase
      .from("saved_resources")
      .select("resource_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[api/saved GET] Error:", error);
      return NextResponse.json({ error: error.message, savedIds: [] }, { status: 500 });
    }

    const savedIds = (data || []).map((row) => row.resource_id);
    return NextResponse.json({ savedIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, savedIds: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { userId, resourceId, action } = body;

    if (!userId || !resourceId) {
      return NextResponse.json({ ok: false, error: "Missing userId or resourceId" }, { status: 400 });
    }

    if (action === "unsave") {
      const { error } = await supabase
        .from("saved_resources")
        .delete()
        .eq("user_id", userId)
        .eq("resource_id", resourceId);

      if (error) {
        console.error("[api/saved POST unsave] Error:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, saved: false });
    }

    // Default: save
    const { error } = await supabase.from("saved_resources").upsert({
      user_id: userId,
      resource_id: resourceId,
    });

    if (error) {
      console.error("[api/saved POST save] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
