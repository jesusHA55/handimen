import { CURRENT_USER_ID, getRequestsStoreReady } from "@handimen/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RequestRow } from "@/components/request-row";
import type { Locale } from "@/lib/format";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("request");
  const store = await getRequestsStoreReady();

  const [outgoing, incoming] = await Promise.all([
    store.list({ requesterId: CURRENT_USER_ID }),
    store.list({ ownerId: CURRENT_USER_ID }),
  ]);

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
                <li key={request.id}>
                  <RequestRow request={request} role={section.role} locale={locale as Locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
