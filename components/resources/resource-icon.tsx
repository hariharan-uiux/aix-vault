"use client";

import { cn, faviconUrl, initials } from "@/lib/utils";
import type { Resource } from "@/types";
import { useState } from "react";

export function ResourceIcon({
  resource,
  size = 40,
}: {
  resource: Pick<Resource, "name" | "domain" | "iconUrl">;
  size?: 32 | 40 | 48;
}) {
  const src = resource.iconUrl || (resource.domain ? faviconUrl(resource.domain) : "");
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isLoaded = loadedSrc === src;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-subtle-background text-[12px] font-medium text-muted-foreground",
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src && !failed ? (
        <>
          {!isLoaded && (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground/60 select-none">
              {initials(resource.name)}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            className={cn(
              "size-full object-contain p-1 transition-opacity duration-200",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        initials(resource.name)
      )}
    </div>
  );
}
