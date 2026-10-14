import { getTranslations, setRequestLocale } from "next-intl/server";

import { RequestRow } from "@/components/request-row";
import { ReviewForm } from "@/components/review-form";
import type { Locale } from "@/lib/format";
import { getStores } from "@/lib/stores";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("request");
  const { requests: store, reviews, userId } = await getStores();

  const [outgoing, incoming] = await Promise.all([
    store.list({ requesterId: userId }),
    store.list({ ownerId: userId }),
  ]);

  // A completed borrow can still be reviewed by the requester until they do.
  const reviewable = new Set(
    (
      await Promise.all(
        outgoing
          .filter((request) => request.status === "returned")
          .map(async (request) =>
            (await reviews.hasReviewed(request.id, userId)) ? null : request.id,
          ),
      )
    ).filter((id): id is string => id !== null),
  );

  const sections = [
    { key: "incoming" as const, title: t("incoming"), items: incoming, role: "owner" as const },
    { key: "outgoing" as const, title: t("outgoing"), items: outgoing, role: "requester" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("listTitle")}</h1>

      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {section.items.map((request) => (
                <li key={request.id} className="flex flex-col gap-3">
                  <RequestRow request={request} role={section.role} locale={locale as Locale} />
                  {reviewable.has(request.id) ? <ReviewForm requestId={request.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
