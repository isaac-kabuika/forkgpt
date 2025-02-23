import { z } from "zod";
import { messageSchema } from "../message";

export const messageUpdatedSchema = z.object({
  message: messageSchema,
  threadId: z.string(),
});

export type MessageUpdated = z.infer<typeof messageUpdatedSchema>;
