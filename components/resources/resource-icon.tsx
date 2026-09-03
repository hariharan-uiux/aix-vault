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

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-subtle-background text-[12px] font-medium text-muted-foreground",
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="size-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(resource.name)
      )}
    </div>
  );
}
