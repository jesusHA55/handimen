import { defineRouting } from "next-intl/routing";

/**
 * Locales shipped in the MVP: Spanish (default) + English.
 * A `ca` (Catalan) slot is reserved for later — add it here and to `messages/`.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
