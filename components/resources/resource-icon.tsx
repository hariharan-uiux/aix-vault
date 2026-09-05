"use client";

import { cn, faviconUrl, initials } from "@/lib/utils";
import { useVault } from "@/lib/vault/store";
import type { Resource } from "@/types";
import { useEffect, useRef, useState } from "react";

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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

  const primarySrc = resource.iconUrl || (resource.domain ? faviconUrl(resource.domain) : "");
  const fallbackSrc = resource.domain ? `https://icons.duckduckgo.com/ip3/${resource.domain}.ico` : "";

  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [triedFallback, setTriedFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const nextSrc = resource.iconUrl || (resource.domain ? faviconUrl(resource.domain) : "");
    setCurrentSrc(nextSrc);
    setTriedFallback(false);
    setFailed(false);
    setIsLoaded(false);
  }, [resource.iconUrl, resource.domain]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const handleError = () => {
    if (!triedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
    } else {
      setFailed(true);
    }
  };

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
    ? "size-[calc(100%-10px)]"
    : isLarge
      ? "size-[calc(100%-8px)]"
      : "size-[calc(100%-6px)]";

  const isMono = effectiveGrayscale;
  const avatarColorClass = isMono
    ? "bg-subtle-background text-muted-foreground/70 border-black/[0.08] dark:border-white/[0.1]"
    : getAvatarColor(resource.name);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-neutral-900 text-muted-foreground transition-all duration-200 shadow-2xs",
        outerRadiusClass,
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {currentSrc && !failed ? (
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-transparent",
            innerSizeClass,
            innerRadiusClass,
          )}
        >
          {/* Fallback initials while image is loading or if semi-transparent */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-medium select-none transition-opacity duration-200",
              isLarge ? "text-[13px] font-semibold" : "text-[11px]",
              avatarColorClass,
              isLoaded ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            {initials(resource.name)}
          </span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              imgRef.current = el;
              if (el?.complete && el.naturalWidth > 0 && !isLoaded) {
                setIsLoaded(true);
              }
            }}
            src={currentSrc}
            alt=""
            width={size}
            height={size}
            decoding="async"
            className={cn(
              "size-full object-contain transition-all duration-200",
              innerRadiusClass,
              isMono && "resource-icon-mono grayscale",
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
            )}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
          />
        </div>
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center font-medium select-none border",
            outerRadiusClass,
            isLarge ? "text-[13px] font-semibold" : "text-[11px]",
            avatarColorClass,
          )}
        >
          {initials(resource.name)}
        </span>
      )}
    </div>
  );
}
