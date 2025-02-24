import { z } from "zod";
import { threadSchema } from "../thread";

export const threadUpdatedSchema = z.object({
  thread: threadSchema,
});

export type ThreadUpdated = z.infer<typeof threadUpdatedSchema>;
