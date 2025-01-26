// Generated code - do not edit
import { z } from "zod";

export const topicEvents = {
  "topic.list.requested": "topic:topic.list.requested",
  "topic.list.fetched": "topic:topic.list.fetched",
  "topic.create": "topic:topic.create",
  "topic.created": "topic:topic.created",
  "topic.update": "topic:topic.update",
  "topic.updated": "topic:topic.updated",
  "topic.delete": "topic:topic.delete",
  "topic.deleted": "topic:topic.deleted"
} as const;

export type topicEventTypes = typeof topicEvents[keyof typeof topicEvents];



const TopicListRequestedSchema = z.object({ "userId": z.string(), "accessToken": z.string() }).strict();

export type TopicListRequestedEventPayload = z.infer<typeof TopicListRequestedSchema>;

export class TopicListRequestedEventData {
  private readonly data: TopicListRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicListRequestedSchema.parse(payload);
  }

  get payload(): TopicListRequestedEventPayload {
    return this.data;
  }

  static from(data: TopicListRequestedEventPayload): TopicListRequestedEventData {
    return new TopicListRequestedEventData(data);
  }
}


const TopicListFetchedSchema = z.object({ "userId": z.string(), "topics": z.array(z.object({ "id": z.string(), "title": z.string(), "createdAt": z.number(), "updatedAt": z.number() }).strict()) }).strict();

export type TopicListFetchedEventPayload = z.infer<typeof TopicListFetchedSchema>;

export class TopicListFetchedEventData {
  private readonly data: TopicListFetchedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicListFetchedSchema.parse(payload);
  }

  get payload(): TopicListFetchedEventPayload {
    return this.data;
  }

  static from(data: TopicListFetchedEventPayload): TopicListFetchedEventData {
    return new TopicListFetchedEventData(data);
  }
}


const TopicCreateSchema = z.object({ "userId": z.string(), "title": z.string(), "accessToken": z.string() }).strict();

export type TopicCreateEventPayload = z.infer<typeof TopicCreateSchema>;

export class TopicCreateEventData {
  private readonly data: TopicCreateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicCreateSchema.parse(payload);
  }

  get payload(): TopicCreateEventPayload {
    return this.data;
  }

  static from(data: TopicCreateEventPayload): TopicCreateEventData {
    return new TopicCreateEventData(data);
  }
}


const TopicCreatedSchema = z.object({ "id": z.string(), "title": z.string(), "userId": z.string(), "createdAt": z.number() }).strict();

export type TopicCreatedEventPayload = z.infer<typeof TopicCreatedSchema>;

export class TopicCreatedEventData {
  private readonly data: TopicCreatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicCreatedSchema.parse(payload);
  }

  get payload(): TopicCreatedEventPayload {
    return this.data;
  }

  static from(data: TopicCreatedEventPayload): TopicCreatedEventData {
    return new TopicCreatedEventData(data);
  }
}


const TopicUpdateSchema = z.object({ "id": z.string(), "title": z.string(), "accessToken": z.string() }).strict();

export type TopicUpdateEventPayload = z.infer<typeof TopicUpdateSchema>;

export class TopicUpdateEventData {
  private readonly data: TopicUpdateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicUpdateSchema.parse(payload);
  }

  get payload(): TopicUpdateEventPayload {
    return this.data;
  }

  static from(data: TopicUpdateEventPayload): TopicUpdateEventData {
    return new TopicUpdateEventData(data);
  }
}


const TopicUpdatedSchema = z.object({ "id": z.string(), "title": z.string(), "userId": z.string() }).strict();

export type TopicUpdatedEventPayload = z.infer<typeof TopicUpdatedSchema>;

export class TopicUpdatedEventData {
  private readonly data: TopicUpdatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicUpdatedSchema.parse(payload);
  }

  get payload(): TopicUpdatedEventPayload {
    return this.data;
  }

  static from(data: TopicUpdatedEventPayload): TopicUpdatedEventData {
    return new TopicUpdatedEventData(data);
  }
}


const TopicDeleteSchema = z.object({ "id": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type TopicDeleteEventPayload = z.infer<typeof TopicDeleteSchema>;

export class TopicDeleteEventData {
  private readonly data: TopicDeleteEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicDeleteSchema.parse(payload);
  }

  get payload(): TopicDeleteEventPayload {
    return this.data;
  }

  static from(data: TopicDeleteEventPayload): TopicDeleteEventData {
    return new TopicDeleteEventData(data);
  }
}


const TopicDeletedSchema = z.object({ "id": z.string(), "userId": z.string() }).strict();

export type TopicDeletedEventPayload = z.infer<typeof TopicDeletedSchema>;

export class TopicDeletedEventData {
  private readonly data: TopicDeletedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = TopicDeletedSchema.parse(payload);
  }

  get payload(): TopicDeletedEventPayload {
    return this.data;
  }

  static from(data: TopicDeletedEventPayload): TopicDeletedEventData {
    return new TopicDeletedEventData(data);
  }
}
