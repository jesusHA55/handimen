import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LikeButton } from "@/components/like-button";
import { ListingCard } from "@/components/listing-card";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/format";
import { getStores } from "@/lib/stores";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  const { listings, social, userId } = await getStores();

  const allListings = await listings.list();
  const featured = allListings.slice(0, 6);
  const owners = await listings.getOwners(allListings.map((listing) => listing.ownerId));
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

  const posts = await social.listFeed();
  const postMeta = await Promise.all(
    posts.map(async (post) => ({
      post,
      author: ownerMap.get(post.authorId) ?? null,
      liked: await social.hasLiked(post.id, userId),
      count: await social.reactionCount(post.id),
    })),
  );

  const freeCount = allListings.filter((listing) => listing.terms === "free").length;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5">
        <Badge variant="accent" className="gap-1">
          <MapPin className="size-3" aria-hidden />
          {t("eyebrow")}
        </Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/explore">
              {t("ctaPrimary")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/map">{t("ctaSecondary")}</Link>
          </Button>
        </div>

        <dl className="mt-2 grid w-full grid-cols-3 gap-4 border-t border-border pt-5">
          {[
            { value: allListings.length, label: t("stats.listings") },
            { value: freeCount, label: t("stats.free") },
            { value: owners.length, label: t("stats.neighbours") },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-2xl font-bold tabular-nums">{stat.value}</dt>
              <dd className="text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Sparkles className="size-5 text-primary" aria-hidden />
              {t("feed.title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("feed.subtitle")}</p>
          </div>

          {postMeta.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("feed.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {postMeta.map(({ post, author, liked, count }) => (
                <li key={post.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-3 pt-5">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-full bg-muted" aria-hidden>
                          {author?.avatarEmoji ?? "🙂"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{author?.displayName ?? "?"}</span>
                          {author ? <TrustBadge tier={author.trustTier} /> : null}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatRelativeTime(post.createdAt, locale)}
                        </span>
                      </div>
                      <p className="text-sm">{post.body}</p>
                      <div className="flex items-center gap-2">
                        <LikeButton postId={post.id} count={count} liked={liked} />
                        {post.listingId ? (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/listings/${post.listingId}`}>
                              {t("featured.seeAll")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">{t("featured.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("featured.subtitle")}</p>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/explore">{t("featured.seeAll")}</Link>
            </Button>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featured.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} owner={ownerMap.get(listing.ownerId) ?? null} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
