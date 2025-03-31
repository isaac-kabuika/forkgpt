import { z } from "zod";
import { topicSchema } from "../topic";

export const topicUpdatedSchema = z.object({
  topic: topicSchema,
});

export type TopicUpdated = z.infer<typeof topicUpdatedSchema>;
