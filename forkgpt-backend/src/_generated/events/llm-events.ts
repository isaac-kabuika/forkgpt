// Generated code - do not edit
import { z } from "zod";

export const llmEvents = {
  "llm.response.requested": "llm:llm.response.requested",
  "llm.response.generated": "llm:llm.response.generated",
  "llm.chunk.generated": "llm:llm.chunk.generated"
} as const;

export type llmEventTypes = typeof llmEvents[keyof typeof llmEvents];



const LlmResponseRequestedSchema = z.object({ "messages": z.array(z.object({ "role": z.enum(["user","assistant","system"]), "content": z.string() }).strict()), "model": z.enum(["gpt-4o-mini","gpt-4o"]).optional() }).strict();

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


const LlmChunkGeneratedSchema = z.object({ "chunkContent": z.string(), "fullContent": z.string(), "isFinalChunk": z.boolean() }).strict();

export type LlmChunkGeneratedEventPayload = z.infer<typeof LlmChunkGeneratedSchema>;

export class LlmChunkGeneratedEventData {
  private readonly data: LlmChunkGeneratedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = LlmChunkGeneratedSchema.parse(payload);
  }

  get payload(): LlmChunkGeneratedEventPayload {
    return this.data;
  }

  static from(data: LlmChunkGeneratedEventPayload): LlmChunkGeneratedEventData {
    return new LlmChunkGeneratedEventData(data);
  }
}
