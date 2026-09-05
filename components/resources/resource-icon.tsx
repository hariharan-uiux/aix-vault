"use client";

import { cn, faviconUrl, initials } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import type { Resource } from "@/types";
import { useState } from "react";

export function ResourceIcon({
  resource,
  size = 48,
  grayscale,
  className,
}: {
  resource: Pick<Resource, "name" | "domain" | "iconUrl">;
  size?: number;
  grayscale?: boolean;
  className?: string;
}) {
  const { iconMode } = useVault();
  const effectiveGrayscale = grayscale !== undefined ? grayscale : iconMode === "mono";
  const src = resource.iconUrl || (resource.domain ? faviconUrl(resource.domain) : "");
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isLoaded = loadedSrc === src;

  const isLarge = size >= 44;
  const isExtraLarge = size >= 52;

  const outerRadiusClass = isExtraLarge
    ? "rounded-2xl"
    : isLarge
      ? "rounded-[14px]"
      : "rounded-xl";

  const innerRadiusClass = isExtraLarge
    ? "rounded-[10px]"
    : isLarge
      ? "rounded-[9px]"
      : "rounded-[7px]";

  const innerSizeClass = isExtraLarge
    ? "size-[calc(100%-12px)]"
    : isLarge
      ? "size-[calc(100%-10px)]"
      : "size-[calc(100%-8px)]";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-subtle-background text-muted-foreground transition-transform duration-200 shadow-2xs",
        outerRadiusClass,
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src && !failed ? (
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden",
            innerSizeClass,
            innerRadiusClass,
          )}
        >
          {!isLoaded && (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center font-medium text-muted-foreground/60 select-none",
                isLarge ? "text-[13px] font-semibold" : "text-[11px]",
              )}
            >
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
              "size-full object-contain transition-opacity duration-200",
              innerRadiusClass,
              effectiveGrayscale && "resource-icon-mono",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <span
          className={cn(
            "font-medium select-none text-muted-foreground/70",
            isLarge ? "text-[13px] font-semibold" : "text-[11px]",
          )}
        >
          {initials(resource.name)}
        </span>
      )}
    </div>
  );
}
