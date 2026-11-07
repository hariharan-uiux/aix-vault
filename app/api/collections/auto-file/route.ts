import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";
import { autoFileAll, autoFileResource, folderNameForType } from "@/lib/collections/auto-file";

/**
 * POST /api/collections/auto-file
 * Body (optional): { resourceId: string }
 * With resourceId it files that one resource into its type folder. Without it,
 * every resource is (re)filed into the folder named after its type, creating any
 * missing folder along the way.
 */
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const resourceId: string | undefined = body?.resourceId;

    if (resourceId) {
      const { data } = await supabase
        .from("resources")
        .select("id, type, category_id, url")
        .eq("id", resourceId)
        .maybeSingle();

      if (!data) {
        return NextResponse.json({ ok: false, error: "Resource not found" }, { status: 404 });
      }

      const folder = await autoFileResource({
        id: data.id,
        type: data.type,
        categoryId: data.category_id,
        url: data.url,
      });

      return NextResponse.json({ ok: Boolean(folder), folder });
    }

    const result = await autoFileAll();
    return NextResponse.json({ ok: result.errors.length === 0, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/collections/auto-file POST] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** GET /api/collections/auto-file?type=... previews the folder a resource type maps to. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = await folderNameForType(searchParams.get("type"));
  return NextResponse.json({ folder });
}
