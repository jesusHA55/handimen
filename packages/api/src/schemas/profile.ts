import { z } from "zod";

import { coordinatesSchema, uuidSchema } from "./common";

export const profileSchema = z.object({
  id: uuidSchema,
  displayName: z.string().min(1).max(60),
  bio: z.string().max(500).nullable(),
  avatarUrl: z.string().url().nullable(),
  neighbourhood: z.string().max(120).nullable(),
  homeLocation: coordinatesSchema.nullable(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  idVerified: z.boolean(),
  completedHandoffs: z.number().int().nonnegative(),
  vouches: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).nullable().optional(),
  neighbourhood: z.string().max(120).nullable().optional(),
  homeLocation: coordinatesSchema.nullable().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
