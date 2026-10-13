"use client";

import type { Listing, ListingOwner } from "@handimen/core";
import { MapPin, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDistanceMeters } from "@/lib/format";

export function ListingCard({
  listing,
  owner,
  distanceMeters,
}: {
  listing: Listing;
  owner?: ListingOwner | null;
  distanceMeters?: number;
}) {
  const t = useTranslations("listing");
  const tCategories = useTranslations("categories");
  const locale = useLocale();

  const isRent = listing.terms === "rent";

  return (
    <Link href={`/listings/${listing.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-primary/50">
        <div className="grid h-32 place-items-center bg-muted text-5xl" aria-hidden>
          {listing.photos[0] ?? "🔧"}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Badge variant={isRent ? "accent" : "default"}>{isRent ? t("rent") : t("free")}</Badge>
            <Badge variant="muted">{tCategories(listing.category)}</Badge>
          </div>
          <h3 className="font-semibold leading-tight group-hover:underline">{listing.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div>
              {isRent && listing.priceCents !== null ? (
                <p className="font-semibold">
                  {formatCurrency(listing.priceCents, locale)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {t(`units.${listing.priceUnit ?? "day"}`)}
                  </span>
                </p>
              ) : (
                <p className="font-semibold text-primary">{t("freeToBorrow")}</p>
              )}
              {distanceMeters !== undefined ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden />
                  {formatDistanceMeters(distanceMeters, locale)}
                </p>
              ) : null}
            </div>

            {owner ? (
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span aria-hidden>{owner.avatarEmoji}</span>
                  {owner.displayName}
                </span>
                <span className="flex items-center gap-1.5">
                  <TrustBadge tier={owner.trustTier} />
                  {owner.reviewCount > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="size-3 fill-accent text-accent" aria-hidden />
                      {owner.rating.toFixed(1)}
                    </span>
                  ) : null}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
