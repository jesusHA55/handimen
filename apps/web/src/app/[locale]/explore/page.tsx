import type { ListingFilter, ListingTerms, ListingType } from "@handimen/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListingCard } from "@/components/listing-card";
import { ListingFilters } from "@/components/listing-filters";
import { getStores } from "@/lib/stores";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("explore");

  const q = first(sp.q);
  const category = first(sp.category);
  const terms = first(sp.terms) as ListingTerms | undefined;
  const type = first(sp.type) as ListingType | undefined;

  const filter: ListingFilter = {
    query: q,
    category,
    terms: terms === "free" || terms === "rent" ? terms : undefined,
    type,
  };

  const { listings } = await getStores();
  const results = await listings.list(filter);
  const owners = await listings.getOwners(results.map((listing) => listing.ownerId));
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ListingFilters locale={locale} defaults={{ q, category, terms, type }} />

      <p className="text-sm text-muted-foreground">
        {t("resultsCount", { count: results.length })}
      </p>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} owner={ownerMap.get(listing.ownerId) ?? null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
