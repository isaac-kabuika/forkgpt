// Generated code - do not edit
import { z } from "zod";

export const threadEvents = {
  "thread.list.requested": "thread:thread.list.requested",
  "thread.list.fetched": "thread:thread.list.fetched",
  "thread.create": "thread:thread.create",
  "thread.created": "thread:thread.created",
  "thread.update": "thread:thread.update",
  "thread.updated": "thread:thread.updated",
  "thread.delete": "thread:thread.delete",
  "thread.deleted": "thread:thread.deleted",
  "thread.messages.requested": "thread:thread.messages.requested",
  "thread.messages.fetched": "thread:thread.messages.fetched",
  "thread.updateLeaf": "thread:thread.updateLeaf",
  "thread.leafUpdated": "thread:thread.leafUpdated"
} as const;

export type threadEventTypes = typeof threadEvents[keyof typeof threadEvents];



const ThreadListRequestedSchema = z.object({ "topicId": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type ThreadListRequestedEventPayload = z.infer<typeof ThreadListRequestedSchema>;

export class ThreadListRequestedEventData {
  private readonly data: ThreadListRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadListRequestedSchema.parse(payload);
  }

  get payload(): ThreadListRequestedEventPayload {
    return this.data;
  }

  static from(data: ThreadListRequestedEventPayload): ThreadListRequestedEventData {
    return new ThreadListRequestedEventData(data);
  }
}


const ThreadListFetchedSchema = z.object({ "threads": z.array(z.object({ "id": z.string(), "topicId": z.string(), "name": z.string(), "leafMessageId": z.union([z.string(), z.null()]), "userId": z.string(), "createdAt": z.number(), "updatedAt": z.number(), "rank": z.number() }).strict()) }).strict();

export type ThreadListFetchedEventPayload = z.infer<typeof ThreadListFetchedSchema>;

export class ThreadListFetchedEventData {
  private readonly data: ThreadListFetchedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadListFetchedSchema.parse(payload);
  }

  get payload(): ThreadListFetchedEventPayload {
    return this.data;
  }

  static from(data: ThreadListFetchedEventPayload): ThreadListFetchedEventData {
    return new ThreadListFetchedEventData(data);
  }
}


const ThreadCreateSchema = z.object({ "name": z.string(), "leafMessageId": z.union([z.string(), z.null()]).optional(), "topicId": z.string(), "userId": z.string(), "accessToken": z.string(), "leftThreadId": z.union([z.string(), z.null()]).optional(), "rightThreadId": z.union([z.string(), z.null()]).optional(), "newMessageContent": z.string() }).strict();

export type ThreadCreateEventPayload = z.infer<typeof ThreadCreateSchema>;

export class ThreadCreateEventData {
  private readonly data: ThreadCreateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadCreateSchema.parse(payload);
  }

  get payload(): ThreadCreateEventPayload {
    return this.data;
  }

  static from(data: ThreadCreateEventPayload): ThreadCreateEventData {
    return new ThreadCreateEventData(data);
  }
}


const ThreadCreatedSchema = z.object({ "id": z.string(), "topicId": z.string(), "name": z.string(), "leafMessageId": z.union([z.string(), z.null()]), "userId": z.string(), "createdAt": z.number(), "rank": z.number() }).strict();

export type ThreadCreatedEventPayload = z.infer<typeof ThreadCreatedSchema>;

export class ThreadCreatedEventData {
  private readonly data: ThreadCreatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadCreatedSchema.parse(payload);
  }

  get payload(): ThreadCreatedEventPayload {
    return this.data;
  }

  static from(data: ThreadCreatedEventPayload): ThreadCreatedEventData {
    return new ThreadCreatedEventData(data);
  }
}


const ThreadUpdateSchema = z.object({ "id": z.string(), "name": z.string().optional(), "rank": z.number().optional(), "userId": z.string(), "accessToken": z.string(), "leftThreadId": z.union([z.string(), z.null()]).optional(), "rightThreadId": z.union([z.string(), z.null()]).optional() }).strict();

export type ThreadUpdateEventPayload = z.infer<typeof ThreadUpdateSchema>;

export class ThreadUpdateEventData {
  private readonly data: ThreadUpdateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadUpdateSchema.parse(payload);
  }

  get payload(): ThreadUpdateEventPayload {
    return this.data;
  }

  static from(data: ThreadUpdateEventPayload): ThreadUpdateEventData {
    return new ThreadUpdateEventData(data);
  }
}


const ThreadUpdatedSchema = z.object({ "id": z.string(), "name": z.string(), "userId": z.string(), "rank": z.number() }).strict();

export type ThreadUpdatedEventPayload = z.infer<typeof ThreadUpdatedSchema>;

export class ThreadUpdatedEventData {
  private readonly data: ThreadUpdatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadUpdatedSchema.parse(payload);
  }

  get payload(): ThreadUpdatedEventPayload {
    return this.data;
  }

  static from(data: ThreadUpdatedEventPayload): ThreadUpdatedEventData {
    return new ThreadUpdatedEventData(data);
  }
}


const ThreadDeleteSchema = z.object({ "id": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type ThreadDeleteEventPayload = z.infer<typeof ThreadDeleteSchema>;

export class ThreadDeleteEventData {
  private readonly data: ThreadDeleteEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadDeleteSchema.parse(payload);
  }

  get payload(): ThreadDeleteEventPayload {
    return this.data;
  }

  static from(data: ThreadDeleteEventPayload): ThreadDeleteEventData {
    return new ThreadDeleteEventData(data);
  }
}


const ThreadDeletedSchema = z.object({ "id": z.string(), "userId": z.string() }).strict();

export type ThreadDeletedEventPayload = z.infer<typeof ThreadDeletedSchema>;

export class ThreadDeletedEventData {
  private readonly data: ThreadDeletedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadDeletedSchema.parse(payload);
  }

  get payload(): ThreadDeletedEventPayload {
    return this.data;
  }

  static from(data: ThreadDeletedEventPayload): ThreadDeletedEventData {
    return new ThreadDeletedEventData(data);
  }
}


const ThreadMessagesRequestedSchema = z.object({ "threadId": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type ThreadMessagesRequestedEventPayload = z.infer<typeof ThreadMessagesRequestedSchema>;

export class ThreadMessagesRequestedEventData {
  private readonly data: ThreadMessagesRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadMessagesRequestedSchema.parse(payload);
  }

  get payload(): ThreadMessagesRequestedEventPayload {
    return this.data;
  }

  static from(data: ThreadMessagesRequestedEventPayload): ThreadMessagesRequestedEventData {
    return new ThreadMessagesRequestedEventData(data);
  }
}


const ThreadMessagesFetchedSchema = z.object({ "thread": z.object({ "id": z.string(), "topicId": z.string(), "name": z.string(), "leafMessageId": z.union([z.string(), z.null()]), "userId": z.string(), "createdAt": z.number(), "updatedAt": z.number(), "rank": z.number() }).strict(), "messages": z.array(z.object({ "id": z.string(), "content": z.string(), "role": z.enum(["user","assistant"]), "parentId": z.union([z.string(), z.null()]), "topicId": z.string(), "userId": z.string(), "createdAt": z.number(), "updatedAt": z.number() }).strict()) }).strict();

export type ThreadMessagesFetchedEventPayload = z.infer<typeof ThreadMessagesFetchedSchema>;

export class ThreadMessagesFetchedEventData {
  private readonly data: ThreadMessagesFetchedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadMessagesFetchedSchema.parse(payload);
  }

  get payload(): ThreadMessagesFetchedEventPayload {
    return this.data;
  }

  static from(data: ThreadMessagesFetchedEventPayload): ThreadMessagesFetchedEventData {
    return new ThreadMessagesFetchedEventData(data);
  }
}


const ThreadUpdateLeafSchema = z.object({ "threadId": z.string(), "messageId": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type ThreadUpdateLeafEventPayload = z.infer<typeof ThreadUpdateLeafSchema>;

export class ThreadUpdateLeafEventData {
  private readonly data: ThreadUpdateLeafEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadUpdateLeafSchema.parse(payload);
  }

  get payload(): ThreadUpdateLeafEventPayload {
    return this.data;
  }

  static from(data: ThreadUpdateLeafEventPayload): ThreadUpdateLeafEventData {
    return new ThreadUpdateLeafEventData(data);
  }
}


const ThreadLeafUpdatedSchema = z.object({ "threadId": z.string(), "messageId": z.string(), "userId": z.string() }).strict();

export type ThreadLeafUpdatedEventPayload = z.infer<typeof ThreadLeafUpdatedSchema>;

export class ThreadLeafUpdatedEventData {
  private readonly data: ThreadLeafUpdatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = ThreadLeafUpdatedSchema.parse(payload);
  }

  get payload(): ThreadLeafUpdatedEventPayload {
    return this.data;
  }

  static from(data: ThreadLeafUpdatedEventPayload): ThreadLeafUpdatedEventData {
    return new ThreadLeafUpdatedEventData(data);
  }
}
