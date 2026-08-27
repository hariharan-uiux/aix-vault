import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  url: z.string().trim().min(1),
});

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "0.0.0.0" || host === "::1" || host === "127.0.0.1") return true;
  if (/^(10\.|192\.168\.|127\.|169\.254\.)/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function attr(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  let target: URL;
  try {
    const raw = parsed.data.url;
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  try {
    const response = await fetch(target.toString(), {
      headers: { "User-Agent": "DesignVaultBot/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title =
      attr(html, "og:title") || titleMatch?.[1]?.trim() || target.hostname;
    const description =
      attr(html, "og:description") || attr(html, "description") || "";
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
      response.url ||
      target.toString();
    const icon =
      html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
      null;
    const domain = new URL(canonical.startsWith("http") ? canonical : target.origin).hostname.replace(
      /^www\./,
      "",
    );

    return NextResponse.json({
      title: decode(title).slice(0, 120),
      description: description.slice(0, 280),
      domain,
      iconUrl: icon
        ? icon.startsWith("http")
          ? icon
          : new URL(icon, target.origin).toString()
        : null,
      canonicalUrl: canonical.startsWith("http") ? canonical : target.toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn't retrieve this site's details. You can enter them manually." },
      { status: 422 },
    );
  }
}
