import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  url.hash = "";
  if (url.pathname === "/") url.pathname = "";
  return url.toString().replace(/\/$/, "");
}

export function canonicalKey(url: string) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`.replace(
      /\/$/,
      "",
    );
  } catch {
    return url.trim().toLowerCase();
  }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function cleanResourceName(
  rawTitle: string,
  siteName?: string,
  domain?: string,
): { name: string; tagline: string } {
  const cleanSiteName = siteName ? siteName.trim() : "";
  const domainParts = (domain || "").toLowerCase().replace(/^www\./, "").split(".");
  const domainRoot =
    domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0] || "";

  if (!rawTitle || !rawTitle.trim()) {
    return { name: cleanSiteName || domainRoot, tagline: "" };
  }

  const cleanTitle = rawTitle.trim();
  // Common separators between brand name and tagline / description
  // e.g. " | ", " - ", " – ", " — ", " : ", " · ", " • "
  const separatorRegex = /\s*(?:\s+[|–—·•]\s+|\s+-\s+|:\s+)\s*/;
  const parts = cleanTitle.split(separatorRegex).map((p) => p.trim()).filter(Boolean);

  if (parts.length <= 1) {
    if (cleanSiteName && cleanSiteName.length < cleanTitle.length) {
      if (cleanTitle.toLowerCase().startsWith(cleanSiteName.toLowerCase())) {
        const rest = cleanTitle
          .slice(cleanSiteName.length)
          .replace(/^[\s:–—|·•-]+/, "")
          .trim();
        return { name: cleanSiteName, tagline: rest };
      }
    }
    return { name: cleanTitle, tagline: "" };
  }

  // 1. If one of the parts exactly matches cleanSiteName
  if (cleanSiteName) {
    const siteNameMatch = parts.find(
      (p) => p.toLowerCase() === cleanSiteName.toLowerCase(),
    );
    if (siteNameMatch) {
      const otherParts = parts.filter((p) => p !== siteNameMatch);
      return { name: siteNameMatch, tagline: otherParts.join(" - ") };
    }
  }

  // 2. If domain root matches a part (e.g. 'linear' in 'Linear' from 'linear.app')
  if (domainRoot && domainRoot.length >= 3) {
    const domainMatchIndex = parts.findIndex((p) => {
      const pNorm = p.toLowerCase().replace(/[^a-z0-9]/g, "");
      const dNorm = domainRoot.toLowerCase().replace(/[^a-z0-9]/g, "");
      return pNorm === dNorm || pNorm.startsWith(dNorm) || dNorm.startsWith(pNorm);
    });

    if (domainMatchIndex !== -1) {
      const matchedName = parts[domainMatchIndex];
      if (matchedName.length <= 35 && matchedName.split(/\s+/).length <= 4) {
        const otherParts = parts.filter((_, i) => i !== domainMatchIndex);
        return { name: matchedName, tagline: otherParts.join(" - ") };
      }
    }
  }

  // 3. Heuristic: if last part is very short (<25 chars, <=3 words) and first part is long
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (
    last.length <= 25 &&
    last.split(/\s+/).length <= 3 &&
    first.length > last.length * 1.5
  ) {
    return { name: last, tagline: parts.slice(0, -1).join(" - ") };
  }

  // 4. Default: first part is the name, remainder is tagline
  return { name: first, tagline: parts.slice(1).join(" - ") };
}
