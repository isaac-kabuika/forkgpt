import { z } from "zod";
import { messageSchema } from "./message";

// Base topic schema
export const topicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Topic = z.infer<typeof topicSchema>;

// Request/Response types
export const createTopicRequestSchema = z.object({
  title: z.string().min(1),
});
export type CreateTopicRequest = z.infer<typeof createTopicRequestSchema>;

export const updateTopicRequestSchema = z.object({
  title: z.string().min(1),
});
export type UpdateTopicRequest = z.infer<typeof updateTopicRequestSchema>;

export const topicResponseSchema = z.object({
  topic: topicSchema,
});
export type TopicResponse = z.infer<typeof topicResponseSchema>;

export const topicListResponseSchema = z.object({
  topics: z.array(topicSchema),
});
export type TopicListResponse = z.infer<typeof topicListResponseSchema>;

// Topic with messages
export const topicTreeSchema = z.object({
  topic: topicSchema,
  messages: z.array(messageSchema),
});
export type TopicTree = z.infer<typeof topicTreeSchema>;
