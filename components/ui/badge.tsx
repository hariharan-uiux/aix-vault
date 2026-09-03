import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-full border border-border bg-subtle-background px-2.5 text-[12px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
