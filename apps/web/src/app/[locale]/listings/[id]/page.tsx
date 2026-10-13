import { CURRENT_USER_ID, getListingsRepository } from "@handimen/core";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { RequestForm } from "@/components/request-form";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const listings = getListingsRepository();
  const listing = await listings.get(id);
  if (!listing) notFound();

  const owner = await listings.getOwner(listing.ownerId);
  const t = await getTranslations("listing");
  const tRequest = await getTranslations("request");
  const tCategories = await getTranslations("categories");
  const isYours = listing.ownerId === CURRENT_USER_ID;
  const isRent = listing.terms === "rent";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToExplore")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="grid h-56 place-items-center rounded-2xl border border-border bg-muted text-7xl" aria-hidden>
            {listing.photos[0] ?? "🔧"}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isRent ? "accent" : "default"}>
                {isRent ? t("rent") : t("free")}
              </Badge>
              <Badge variant="muted">{tCategories(listing.category)}</Badge>
              <span className="text-xs text-muted-foreground">
                {t("posted", { time: formatRelativeTime(listing.createdAt, locale) })}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <p className="whitespace-pre-line text-muted-foreground">{listing.description}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {t("pickup")}: Poblenou
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-5">
              {isRent && listing.priceCents !== null ? (
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(listing.priceCents, locale)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {t(`units.${listing.priceUnit ?? "day"}`)}
                    </span>
                  </p>
                  {listing.depositCents ? (
                    <p className="text-sm text-muted-foreground">
                      {t("deposit")}: {formatCurrency(listing.depositCents, locale)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">{t("freeToBorrow")}</p>
              )}

              {owner ? (
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <span className="grid size-10 place-items-center rounded-full bg-muted text-xl" aria-hidden>
                    {owner.avatarEmoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{owner.displayName}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <TrustBadge tier={owner.trustTier} />
                      {owner.reviewCount > 0 ? (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="size-3 fill-accent text-accent" aria-hidden />
                          {owner.rating.toFixed(1)} ({owner.reviewCount})
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isYours ? (
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {t("yours")}
            </p>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-4 pt-5">
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold">{tRequest("title")}</h2>
                  <p className="text-sm text-muted-foreground">{tRequest("subtitle")}</p>
                </div>
                <RequestForm listingId={listing.id} />
                <p className="text-xs text-muted-foreground">{tRequest("escrowNote")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
