"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const STYLES: Record<0 | 1 | 2, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-primary/15 text-primary",
  2: "bg-accent/25 text-accent-foreground",
};

export function TrustBadge({ tier, className }: { tier: 0 | 1 | 2; className?: string }) {
  const t = useTranslations("trustBadge");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[tier],
        className,
      )}
    >
      {t(`tier${tier}` as "tier0")}
    </span>
  );
}
