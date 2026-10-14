import { Check, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListingCard } from "@/components/listing-card";
import { ReviewList } from "@/components/review-list";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { seedDemoContentAction, verifyIdentityAction, verifyPhoneAction } from "@/lib/actions";
import { getStores } from "@/lib/stores";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("profile");
  const tReview = await getTranslations("review");

  const { listings, reviews, userId, owner, email } = await getStores();

  if (!userId || !owner) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-10">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-5">
            <h1 className="text-xl font-semibold tracking-tight">{t("signInTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("signInBody")}</p>
            <Button asChild>
              <Link href="/sign-in">{t("signInCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mine = await listings.list({ ownerId: userId });
  const received = await reviews.listForUser(userId);
  const reviewers = await listings.getOwners(received.map((review) => review.reviewerId));
  const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer]));

  const checks = [
    { key: "email", label: t("email"), ok: owner.emailVerified },
    { key: "phone", label: t("phone"), ok: owner.phoneVerified },
    { key: "identity", label: t("identity"), ok: owner.trustTier === 2 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-muted text-3xl" aria-hidden>
          {owner.avatarEmoji}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{owner.displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TrustBadge tier={owner.trustTier} />
            <span className="text-sm text-muted-foreground">{owner.neighbourhood}</span>
            {email ? (
              <span className="max-w-[16rem] truncate text-sm text-muted-foreground" title={email}>
                · {email}
              </span>
            ) : null}
            {owner.reviewCount > 0 ? (
              <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                {owner.rating.toFixed(1)} ({owner.reviewCount})
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">{t("trustTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("trustSubtitle")}</p>
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {checks.map((check) => (
              <li key={check.key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{check.label}</span>
                <Badge variant={check.ok ? "default" : "muted"} className="gap-1">
                  {check.ok ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <X className="size-3" aria-hidden />
                  )}
                  {check.ok ? t("verified") : t("notVerified")}
                </Badge>
              </li>
            ))}
          </ul>

          {!owner.phoneVerified ? (
            <form action={verifyPhoneAction} className="flex flex-col gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="redirectTo" value="/profile" />
              <Button type="submit" variant="accent" size="sm" className="self-start">
                {t("verifyPhone")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("verifyPhoneNote")}</p>
            </form>
          ) : null}

          {owner.trustTier < 2 ? (
            <form action={verifyIdentityAction} className="flex flex-col gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="redirectTo" value="/profile" />
              <Button type="submit" variant="outline" size="sm" className="self-start">
                {t("verifyIdentity")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("verifyIdentityNote")}</p>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <dl className="grid grid-cols-3 gap-4 rounded-xl border border-border p-5">
        {[
          { label: t("stats.handoffs"), value: owner.completedHandoffs },
          { label: t("stats.vouches"), value: owner.vouches },
          { label: t("stats.listings"), value: mine.length },
        ].map((stat) => (
          <div key={stat.label}>
            <dt className="text-2xl font-bold tabular-nums">{stat.value}</dt>
            <dd className="text-sm text-muted-foreground">{stat.label}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{tReview("recent")}</h2>
        <ReviewList
          items={received.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewerName: reviewerMap.get(review.reviewerId)?.displayName ?? "?",
            reviewerEmoji: reviewerMap.get(review.reviewerId)?.avatarEmoji ?? "🙂",
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("myListings")}</h2>
        {mine.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6">
            <p className="text-sm text-muted-foreground">{t("noListings")}</p>
            <form action={seedDemoContentAction} className="flex flex-col gap-2">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                <Sparkles className="size-4" aria-hidden />
                {t("seedCta")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("seedNote")}</p>
            </form>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} owner={owner} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
