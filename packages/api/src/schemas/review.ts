import { z } from "zod";

import { uuidSchema } from "./common";

export const reviewSchema = z.object({
  id: uuidSchema,
  requestId: uuidSchema,
  reviewerId: uuidSchema,
  revieweeId: uuidSchema,
  /** 1–5 stars. */
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable(),
  createdAt: z.string().datetime(),
});

export const createReviewSchema = reviewSchema.omit({
  id: true,
  reviewerId: true,
  createdAt: true,
});

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
