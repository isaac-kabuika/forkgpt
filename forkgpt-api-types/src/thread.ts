import { z } from "zod";
import { messageSchema } from "./message";

// Base thread schema
export const threadSchema = z.object({
  id: z.string().uuid(),
  topicId: z.string().uuid(),
  name: z.string().min(1),
  leafMessageId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  rank: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Thread = z.infer<typeof threadSchema>;

// Request schemas
export const createThreadRequestSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  leafMessageId: z.string().uuid().nullable(),
  leftThreadId: z.string().uuid().nullable(),
  rightThreadId: z.string().uuid().nullable(),
  newMessageContent: z.string().min(1),
});
export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;

export const updateThreadRequestSchema = z.object({
  name: z.string().min(1).optional(),
  rank: z.number().optional(),
  leftThreadId: z.string().uuid().nullable().optional(),
  rightThreadId: z.string().uuid().nullable().optional(),
});
export type UpdateThreadRequest = z.infer<typeof updateThreadRequestSchema>;

// Response schemas
export const threadResponseSchema = z.object({
  thread: threadSchema,
});
export type ThreadResponse = z.infer<typeof threadResponseSchema>;

export const threadListResponseSchema = z.object({
  threads: z.array(threadSchema),
});
export type ThreadListResponse = z.infer<typeof threadListResponseSchema>;

// Thread with messages
export const threadWithMessagesSchema = z.object({
  thread: threadSchema,
  messages: z.array(messageSchema),
});
export type ThreadWithMessages = z.infer<typeof threadWithMessagesSchema>;
