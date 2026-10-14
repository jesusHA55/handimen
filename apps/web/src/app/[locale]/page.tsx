import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FeedPostCard } from "@/components/feed-post-card";
import { ListingCard } from "@/components/listing-card";
import { PostComposer } from "@/components/post-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getStores } from "@/lib/stores";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tFeed = await getTranslations("feed");

  const { listings, social, userId } = await getStores();

  const [allListings, posts] = await Promise.all([listings.list(), social.listFeed()]);

  const owners = await listings.getOwners([
    ...allListings.map((listing) => listing.ownerId),
    ...posts.map((post) => post.authorId),
  ]);
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

  const liked = new Map(
    await Promise.all(
      posts.map(
        async (post) => [post.id, userId ? await social.hasLiked(post.id, userId) : false] as const,
      ),
    ),
  );

  const mine = userId ? allListings.filter((listing) => listing.ownerId === userId) : [];
  const featured = allListings.slice(0, 6);
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

          {userId ? (
            <PostComposer listings={mine.map((listing) => ({ id: listing.id, title: listing.title }))} />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {tFeed("signInToPost")}
            </p>
          )}

          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tFeed("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <FeedPostCard
                    post={post}
                    author={ownerMap.get(post.authorId) ?? null}
                    liked={liked.get(post.id) ?? false}
                    isMine={userId === post.authorId}
                  />
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
