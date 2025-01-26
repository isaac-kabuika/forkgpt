// Generated code - do not edit
import { z } from "zod";

export const sharedEvents = {
  "timestamp.created": "shared:timestamp.created",
  "helloMessage": "shared:helloMessage"
} as const;

export type sharedEventTypes = typeof sharedEvents[keyof typeof sharedEvents];



const TimestampCreatedSchema = z.object({ "comment": z.string().optional(), "unix": z.number() }).strict();

export type TimestampCreatedEventPayload = z.infer<typeof TimestampCreatedSchema>;

export class TimestampCreatedEventData {
  private readonly data: TimestampCreatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TimestampCreatedSchema.parse(payload);
  }

  get payload(): TimestampCreatedEventPayload {
    return this.data;
  }

  static from(data: TimestampCreatedEventPayload): TimestampCreatedEventData {
    return new TimestampCreatedEventData(data);
  }
}


const HelloMessageSchema = z.object({ "text": z.string().optional() });

export type HelloMessageEventPayload = z.infer<typeof HelloMessageSchema>;

export class HelloMessageEventData {
  private readonly data: HelloMessageEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = HelloMessageSchema.parse(payload);
  }

  get payload(): HelloMessageEventPayload {
    return this.data;
  }

  static from(data: HelloMessageEventPayload): HelloMessageEventData {
    return new HelloMessageEventData(data);
  }
}
