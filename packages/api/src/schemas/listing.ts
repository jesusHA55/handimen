import { LISTING_TERMS, LISTING_TYPES } from "@handimen/core";
import { z } from "zod";

import { coordinatesSchema, moneySchema, uuidSchema } from "./common";

export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingTermsSchema = z.enum(LISTING_TERMS);

export const listingStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "lent",
  "archived",
]);

export const listingSchema = z.object({
  id: uuidSchema,
  ownerId: uuidSchema,
  type: listingTypeSchema,
  terms: listingTermsSchema,
  category: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(2000),
  photos: z.array(z.string().url()).max(8).default([]),
  /** Present only for paid (`rent`) listings. */
  price: moneySchema.nullable(),
  deposit: moneySchema.nullable(),
  priceUnit: z.enum(["hour", "day", "week"]).nullable(),
  pickupLocation: coordinatesSchema.nullable(),
  searchRadiusMeters: z.number().int().positive().max(50_000).default(3_000),
  cityId: uuidSchema.nullable(),
  groupId: uuidSchema.nullable(),
  status: listingStatusSchema,
  createdAt: z.string().datetime(),
});

export const createListingSchema = listingSchema
  .omit({ id: true, ownerId: true, status: true, createdAt: true })
  .extend({
    title: z.string().min(3).max(120),
    description: z.string().min(1).max(2000),
  })
  .refine((value) => value.terms === "free" || value.price !== null, {
    message: "Paid listings require a price.",
    path: ["price"],
  });

export const listingSearchSchema = z.object({
  query: z.string().max(120).optional(),
  category: z.string().optional(),
  type: listingTypeSchema.optional(),
  terms: listingTermsSchema.optional(),
  near: coordinatesSchema.optional(),
  radiusMeters: z.number().int().positive().max(50_000).optional(),
  cityId: uuidSchema.optional(),
  groupId: uuidSchema.optional(),
});

export type Listing = z.infer<typeof listingSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListingSearch = z.infer<typeof listingSearchSchema>;
