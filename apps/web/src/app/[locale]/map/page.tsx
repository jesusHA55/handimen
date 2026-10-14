import { getTranslations, setRequestLocale } from "next-intl/server";

import { MockMap } from "@/components/mock-map";
import { getStores } from "@/lib/stores";

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("map");
  const { listings } = await getStores();
  const results = await listings.list();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <MockMap listings={results} />
    </div>
  );
}
