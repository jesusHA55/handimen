import { z } from "zod";

/** ISO 4217 currency, using the plan's launch currency by default. */
export const currencySchema = z.string().length(3).default("EUR");

/** Money in minor units (cents). */
export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: currencySchema,
});

export const uuidSchema = z.string().uuid();

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const localeSchema = z.enum(["es", "en"]);

export type Money = z.infer<typeof moneySchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Locale = z.infer<typeof localeSchema>;

/** Uniform result envelope for server actions / route handlers. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
