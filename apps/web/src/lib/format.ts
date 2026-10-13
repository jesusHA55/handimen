import { routing } from "@/i18n/routing";

export type Locale = (typeof routing.locales)[number];

/** Locale-aware href for the "as-needed" prefix strategy (default locale has no prefix). */
export function localePath(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === routing.defaultLocale ? clean : `/${locale}${clean}`;
}

export function formatCurrency(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDistanceMeters(meters: number, locale: string): string {
  if (meters < 1000) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(meters) + " m";
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(meters / 1000) + " km";
}

export function formatRelativeTime(iso: string, locale: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return formatter.format(Math.round(diffMs / 1000), "second");
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}
