"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="inline-flex rounded-full border border-border bg-card p-0.5"
      aria-label="Language"
    >
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => router.replace(pathname, { locale }))
          }
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors",
            locale === activeLocale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
