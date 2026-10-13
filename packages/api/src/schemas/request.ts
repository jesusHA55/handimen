import { z } from "zod";

import { moneySchema, uuidSchema } from "./common";

export const requestStatusSchema = z.enum([
  "pending",
  "approved",
  "active",
  "returned",
  "declined",
  "cancelled",
]);

export const requestSchema = z.object({
  id: uuidSchema,
  listingId: uuidSchema,
  requesterId: uuidSchema,
  ownerId: uuidSchema,
  status: requestStatusSchema,
  message: z.string().max(1000).nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  /** Null for free listings. */
  agreedPrice: moneySchema.nullable(),
  agreedDeposit: moneySchema.nullable(),
  /** Mock (or, later, real) payment intent id. */
  paymentIntentId: z.string().nullable(),
  /** Both parties confirm pickup/return — anchors the trust loop. */
  pickedUpAt: z.string().datetime().nullable(),
  returnedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const createRequestSchema = z
  .object({
    listingId: uuidSchema,
    message: z.string().max(1000).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export type Request = z.infer<typeof requestSchema>;
export type RequestStatus = z.infer<typeof requestStatusSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
