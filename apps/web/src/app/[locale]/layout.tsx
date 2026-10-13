import { CURRENT_USER_ID, getListingsRepository, getMessagesStore } from "@handimen/core";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";

import "../globals.css";

type Params = { locale: string };

// The Phase 1 demo reads mutable in-memory stores, so pages render on demand
// rather than being frozen at build time. Swap for caching once Supabase is live.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("footer");
  const owner = await getListingsRepository().getOwner(CURRENT_USER_ID);
  const unreadCount = await getMessagesStore().unreadCount(CURRENT_USER_ID);
  const user = {
    displayName: owner?.displayName ?? "Tú",
    avatarEmoji: owner?.avatarEmoji ?? "🙋",
    trustTier: owner?.trustTier ?? 0,
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <SiteHeader user={user} unreadCount={unreadCount} />
          <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
          <footer className="mx-auto max-w-6xl border-t border-border px-4 py-6 text-sm text-muted-foreground">
            {t("note")}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
