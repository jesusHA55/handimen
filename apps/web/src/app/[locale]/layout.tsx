import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";
import { getStores } from "@/lib/stores";

import "../globals.css";

type Params = { locale: string };

/**
 * Namespaces only ever read on the server. Everything else is shipped to the
 * client because a client component consumes it — trimming these four keeps the
 * HTML/RSC payload smaller on every single request.
 */
const SERVER_ONLY_NAMESPACES = new Set(["meta", "home", "profile", "footer"]);

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

/** Reads cookies, so it lives behind Suspense and streams into a static shell. */
async function HeaderWithUser() {
  const { owner, signedIn, email, messages, userId } = await getStores();
  const unreadCount = userId ? await messages.unreadCount(userId) : 0;

  return (
    <SiteHeader
      user={{
        displayName: owner?.displayName ?? "Tú",
        avatarEmoji: owner?.avatarEmoji ?? "🙋",
        trustTier: owner?.trustTier ?? 0,
      }}
      unreadCount={unreadCount}
      signedIn={signedIn}
      email={email}
    />
  );
}

function HeaderFallback() {
  return <div className="h-16 border-b border-border" aria-hidden />;
}

function ContentFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-48 animate-pulse rounded-xl bg-muted" aria-hidden />
    </div>
  );
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
  const allMessages = await getMessages();
  const clientMessages = Object.fromEntries(
    Object.entries(allMessages).filter(([namespace]) => !SERVER_ONLY_NAMESPACES.has(namespace)),
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={clientMessages}>
          <Suspense fallback={<HeaderFallback />}>
            <HeaderWithUser />
          </Suspense>
          <div className="mx-auto max-w-6xl px-4 py-8">
            <Suspense fallback={<ContentFallback />}>{children}</Suspense>
          </div>
          <footer className="mx-auto max-w-6xl border-t border-border px-4 py-6 text-sm text-muted-foreground">
            {t("note")}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
