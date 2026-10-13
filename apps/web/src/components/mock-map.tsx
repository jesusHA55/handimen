"use client";

import { projectToPercent, type Listing } from "@handimen/core";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Stylized, dependency-free "mock map" of Poblenou.
 * No tiles or API keys — listings are projected into a unit square with
 * `projectToPercent`, drawn over an SVG street/sea backdrop.
 */
export function MockMap({ listings }: { listings: Listing[] }) {
  const t = useTranslations("map");
  const tListing = useTranslations("listing");
  const tCategories = useTranslations("categories");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = listings.find((listing) => listing.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <rect width="100" height="100" className="fill-muted" />

          <g className="stroke-border" strokeWidth="0.4">
            {[10, 22, 34, 46, 58, 70].map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} />
            ))}
            {[12, 26, 40, 54, 68, 82].map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} />
            ))}
          </g>

          {/* Av. Diagonal-ish */}
          <line
            x1={0}
            y1={28}
            x2={72}
            y2={54}
            className="stroke-muted-foreground/40"
            strokeWidth={1.6}
          />

          {/* Park */}
          <polygon points="56,60 72,58 77,74 59,79" className="fill-success/25" />

          {/* Sea (east / right) */}
          <polygon points="86,0 100,0 100,100 76,100" className="fill-primary/20" />
        </svg>

        {/* Decor labels */}
        <span className="absolute right-2 top-3 text-xs font-medium text-primary/80">
          {t("sea")}
        </span>
        <span className="absolute left-[60%] top-[66%] text-[10px] font-medium text-success">
          {t("park")}
        </span>

        {/* Pins */}
        {listings.map((listing) => {
          const { x, y } = projectToPercent({ lat: listing.lat, lng: listing.lng });
          const isRent = listing.terms === "rent";
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => setSelectedId(listing.id === selectedId ? null : listing.id)}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-full rounded-full border-2 border-background px-2 py-1 text-sm shadow-md transition-transform hover:scale-110",
                isRent ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
                listing.id === selectedId && "ring-2 ring-ring ring-offset-1",
              )}
              aria-label={listing.title}
              title={listing.title}
            >
              <span aria-hidden>{listing.photos[0] ?? "🔧"}</span>
            </button>
          );
        })}

        {/* Selected card */}
        {selected ? (
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden />
            </button>
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-xl" aria-hidden>
                {selected.photos[0] ?? "🔧"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{selected.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={selected.terms === "rent" ? "accent" : "default"}>
                    {selected.terms === "rent" ? tListing("rent") : tListing("free")}
                  </Badge>
                  <Badge variant="muted">{tCategories(selected.category)}</Badge>
                  {selected.terms === "rent" && selected.priceCents !== null ? (
                    <span className="text-xs font-medium">
                      {formatCurrency(selected.priceCents, locale)} /{" "}
                      {tListing(`units.${selected.priceUnit ?? "day"}`)}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/listings/${selected.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  {t("viewListing")}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-primary" aria-hidden /> {t("legendFree")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-accent" aria-hidden /> {t("legendRent")}
        </span>
        <span className="ml-auto">{t("count", { count: listings.length })}</span>
      </div>
    </div>
  );
}
