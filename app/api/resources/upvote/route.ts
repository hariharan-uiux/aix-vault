import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, delta = 1 } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Missing or invalid resource id" }, { status: 400 });
    }

    const step = typeof delta === "number" ? delta : 1;
    const supabase = getSupabaseAdminClient() || getSupabaseClient();

    if (!supabase) {
      // Database not connected, client maintains optimistic offline count
      return NextResponse.json({ ok: true, offline: true });
    }

    // 1. Try atomic RPC increment
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("increment_upvote", {
        row_id: id,
        delta: step,
      });

      if (!rpcError && typeof rpcData === "number") {
        return NextResponse.json({ ok: true, upvotes: rpcData });
      }
    } catch (rpcErr) {
      console.warn("[api/resources/upvote] RPC error, falling back to direct update:", rpcErr);
    }

    // 2. Fallback: Select and update
    try {
      const { data: row, error: selectErr } = await supabase
        .from("resources")
        .select("upvotes")
        .eq("id", id)
        .single();

      if (selectErr) {
        // If column upvotes doesn't exist yet, return gracefully
        if (selectErr.message.includes("upvotes") || selectErr.code === "42703") {
          return NextResponse.json({ ok: true, warning: "upvotes column not yet added to database" });
        }
        return NextResponse.json({ ok: false, error: selectErr.message }, { status: 400 });
      }

      const currentUpvotes = Number(row?.upvotes || 0);
      const nextUpvotes = Math.max(0, currentUpvotes + step);

      const { error: updateErr } = await supabase
        .from("resources")
        .update({ upvotes: nextUpvotes })
        .eq("id", id);

      if (updateErr) {
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, upvotes: nextUpvotes });
    } catch (dbErr) {
      console.warn("[api/resources/upvote] Direct update failed:", dbErr);
      return NextResponse.json({ ok: true, offline: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/resources/upvote] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
