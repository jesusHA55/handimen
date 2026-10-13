import { z } from "zod";

import { coordinatesSchema, uuidSchema } from "./common";

export const citySchema = z.object({
  id: uuidSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  province: z.string().nullable(),
  countryCode: z.string().length(2),
  center: coordinatesSchema,
  createdAt: z.string().datetime(),
});

export const groupSchema = z.object({
  id: uuidSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().max(1000).nullable(),
  cityId: uuidSchema.nullable(),
  visibility: z.enum(["public", "private"]).default("private"),
  joinPolicy: z.enum(["invite", "request", "open"]).default("invite"),
  ownerId: uuidSchema,
  createdAt: z.string().datetime(),
});

export const groupMemberSchema = z.object({
  groupId: uuidSchema,
  userId: uuidSchema,
  role: z.enum(["owner", "admin", "member"]).default("member"),
  status: z.enum(["invited", "requested", "active", "banned"]).default("active"),
  joinedAt: z.string().datetime(),
});

export const createGroupSchema = groupSchema.omit({
  id: true,
  ownerId: true,
  createdAt: true,
});

export type City = z.infer<typeof citySchema>;
export type Group = z.infer<typeof groupSchema>;
export type GroupMember = z.infer<typeof groupMemberSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
