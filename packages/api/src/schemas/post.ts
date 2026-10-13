import { z } from "zod";

import { uuidSchema } from "./common";

export const postVisibilitySchema = z.enum(["public", "city", "group", "followers"]);

export const postSchema = z.object({
  id: uuidSchema,
  authorId: uuidSchema,
  body: z.string().max(2000),
  media: z.array(z.string().url()).max(4).default([]),
  listingId: uuidSchema.nullable(),
  groupId: uuidSchema.nullable(),
  cityId: uuidSchema.nullable(),
  visibility: postVisibilitySchema.default("city"),
  createdAt: z.string().datetime(),
});

export const createPostSchema = postSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const commentSchema = z.object({
  id: uuidSchema,
  postId: uuidSchema,
  authorId: uuidSchema,
  body: z.string().min(1).max(1000),
  createdAt: z.string().datetime(),
});

export const createCommentSchema = commentSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const reactionSchema = z.object({
  postId: uuidSchema,
  userId: uuidSchema,
  kind: z.enum(["like", "want", "have"]).default("like"),
});

export type Post = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Reaction = z.infer<typeof reactionSchema>;
