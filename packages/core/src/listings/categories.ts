/** Shared listing taxonomy. Values are stable identifiers; labels are localized client-side. */

export const LISTING_TYPES = ["tool", "equipment", "skill", "service"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TERMS = ["free", "rent"] as const;

export interface Category {
  /** Stable key stored in the DB. */
  key: string;
  /** Default Spanish label (default locale). */
  label: string;
}

export const CATEGORIES: readonly Category[] = [
  { key: "power_tools", label: "Herramientas eléctricas" },
  { key: "garden_outdoors", label: "Jardín y exterior" },
  { key: "kitchen", label: "Cocina" },
  { key: "sports_camping", label: "Deporte y camping" },
  { key: "electronics", label: "Electrónica" },
  { key: "home_cleaning", label: "Hogar y limpieza" },
  { key: "automotive", label: "Automoción" },
  { key: "party_events", label: "Fiestas y eventos" },
  { key: "skills", label: "Habilidades" },
  { key: "help_time", label: "Ayuda y tiempo" },
] as const;

export function isCategoryKey(key: string): boolean {
  return CATEGORIES.some((category) => category.key === key);
}
