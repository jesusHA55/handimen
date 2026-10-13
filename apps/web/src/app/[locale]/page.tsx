import { CATEGORIES } from "@handimen/core";
import { ArrowRight, CalendarCheck, HandHeart, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const FEATURE_ICONS = [Sparkles, HandHeart, ShieldCheck, MapPin] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tFooter = await getTranslations("footer");

  const featureKeys = ["feed", "lending", "trust", "local"] as const;
  const trustKeys = ["tier0", "tier1", "tier2"] as const;
  const releaseKeys = ["monorepo", "db", "payments", "i18n", "ci"] as const;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-20 px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HandHeart className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">Handimen</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button size="sm" variant="outline" asChild>
            <Link href="/">{t("cta.secondary")}</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col items-start gap-6">
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
            <Link href="/">
              {t("cta.primary")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">{t("cta.secondary")}</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t("features.title")}</h2>
          <p className="text-muted-foreground">{t("features.subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featureKeys.map((key, index) => {
            const Icon = FEATURE_ICONS[index] ?? Sparkles;
            return (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-muted text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-semibold">{t(`features.items.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`features.items.${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t("trust.title")}</h2>
          <p className="text-muted-foreground">{t("trust.subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {trustKeys.map((key) => (
            <div key={key} className="flex flex-col gap-2 rounded-xl border border-border p-5">
              <h3 className="font-semibold">{t(`trust.items.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`trust.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t("categories.title")}</h2>
          <p className="text-muted-foreground">{t("categories.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Badge key={category.key} variant="muted" className="text-sm">
              {category.label}
            </Badge>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-border bg-muted/40 p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <CalendarCheck className="size-5 text-primary" aria-hidden />
          {t("release.title")}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {releaseKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{t(`release.items.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
        {tFooter("note")}
      </footer>
    </main>
  );
}
