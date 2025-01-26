import { z } from "zod";

// Base message schema
export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  parentId: z.string().nullable(),
  topicId: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Message = z.infer<typeof messageSchema>;

// Request schemas
export const createMessageRequestSchema = z.object({
  content: z.string(),
  threadId: z.string().nullable(),
});
export type CreateMessageRequest = z.infer<typeof createMessageRequestSchema>;

export const updateMessageRequestSchema = z.object({
  content: z.string(),
});
export type UpdateMessageRequest = z.infer<typeof updateMessageRequestSchema>;

// Response schemas
export const messageResponseSchema = z.object({
  message: messageSchema,
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const messageListResponseSchema = z.object({
  messages: z.array(messageSchema),
});
export type MessageListResponse = z.infer<typeof messageListResponseSchema>;
