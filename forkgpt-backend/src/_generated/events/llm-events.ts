// Generated code - do not edit
import { z } from "zod";

export const llmEvents = {
  "llm.response.requested": "llm:llm.response.requested",
  "llm.response.generated": "llm:llm.response.generated"
} as const;

export type llmEventTypes = typeof llmEvents[keyof typeof llmEvents];



const LlmResponseRequestedSchema = z.object({ "messages": z.array(z.object({ "role": z.enum(["user","assistant"]), "content": z.string() }).strict()), "model": z.enum(["gpt-4o-mini","gpt-4o"]).optional() }).strict();

export type LlmResponseRequestedEventPayload = z.infer<typeof LlmResponseRequestedSchema>;

export class LlmResponseRequestedEventData {
  private readonly data: LlmResponseRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = LlmResponseRequestedSchema.parse(payload);
  }

  get payload(): LlmResponseRequestedEventPayload {
    return this.data;
  }

  static from(data: LlmResponseRequestedEventPayload): LlmResponseRequestedEventData {
    return new LlmResponseRequestedEventData(data);
  }
}


const LlmResponseGeneratedSchema = z.object({ "content": z.string() }).strict();

export type LlmResponseGeneratedEventPayload = z.infer<typeof LlmResponseGeneratedSchema>;

export class LlmResponseGeneratedEventData {
  private readonly data: LlmResponseGeneratedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = LlmResponseGeneratedSchema.parse(payload);
  }

  get payload(): LlmResponseGeneratedEventPayload {
    return this.data;
  }

  static from(data: LlmResponseGeneratedEventPayload): LlmResponseGeneratedEventData {
    return new LlmResponseGeneratedEventData(data);
  }
}
