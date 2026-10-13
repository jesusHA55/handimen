import { z } from "zod";

import { uuidSchema } from "./common";

export const messageSchema = z.object({
  id: uuidSchema,
  threadId: uuidSchema,
  senderId: uuidSchema,
  body: z.string().min(1).max(2000),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const sendMessageSchema = z.object({
  threadId: uuidSchema,
  body: z.string().min(1).max(2000),
});

export type Message = z.infer<typeof messageSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
