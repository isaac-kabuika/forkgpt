// Generated code - do not edit
import { z } from "zod";

export const messageEvents = {
  "message.list.requested": "message:message.list.requested",
  "message.list.fetched": "message:message.list.fetched",
  "message.create": "message:message.create",
  "message.created": "message:message.created",
  "message.update": "message:message.update",
  "message.updated": "message:message.updated",
  "message.delete": "message:message.delete",
  "message.deleted": "message:message.deleted",
  "message.aiResponse.requested": "message:message.aiResponse.requested"
} as const;

export type messageEventTypes = typeof messageEvents[keyof typeof messageEvents];



const MessageListRequestedSchema = z.object({ "topicId": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type MessageListRequestedEventPayload = z.infer<typeof MessageListRequestedSchema>;

export class MessageListRequestedEventData {
  private readonly data: MessageListRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageListRequestedSchema.parse(payload);
  }

  get payload(): MessageListRequestedEventPayload {
    return this.data;
  }

  static from(data: MessageListRequestedEventPayload): MessageListRequestedEventData {
    return new MessageListRequestedEventData(data);
  }
}


const MessageListFetchedSchema = z.object({ "topicId": z.string(), "messages": z.array(z.object({ "id": z.string(), "content": z.string(), "role": z.enum(["user","assistant"]), "parentId": z.union([z.string(), z.null()]), "createdAt": z.number(), "updatedAt": z.number() }).strict()) }).strict();

export type MessageListFetchedEventPayload = z.infer<typeof MessageListFetchedSchema>;

export class MessageListFetchedEventData {
  private readonly data: MessageListFetchedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageListFetchedSchema.parse(payload);
  }

  get payload(): MessageListFetchedEventPayload {
    return this.data;
  }

  static from(data: MessageListFetchedEventPayload): MessageListFetchedEventData {
    return new MessageListFetchedEventData(data);
  }
}


const MessageCreateSchema = z.object({ "content": z.string(), "role": z.enum(["user","assistant"]), "topicId": z.string(), "threadId": z.union([z.string(), z.null()]).optional(), "userId": z.string(), "accessToken": z.string() }).strict();

export type MessageCreateEventPayload = z.infer<typeof MessageCreateSchema>;

export class MessageCreateEventData {
  private readonly data: MessageCreateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageCreateSchema.parse(payload);
  }

  get payload(): MessageCreateEventPayload {
    return this.data;
  }

  static from(data: MessageCreateEventPayload): MessageCreateEventData {
    return new MessageCreateEventData(data);
  }
}


const MessageCreatedSchema = z.object({ "id": z.string(), "content": z.string(), "role": z.enum(["user","assistant"]), "parentId": z.union([z.string(), z.null()]), "topicId": z.string(), "userId": z.string(), "createdAt": z.number() }).strict();

export type MessageCreatedEventPayload = z.infer<typeof MessageCreatedSchema>;

export class MessageCreatedEventData {
  private readonly data: MessageCreatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageCreatedSchema.parse(payload);
  }

  get payload(): MessageCreatedEventPayload {
    return this.data;
  }

  static from(data: MessageCreatedEventPayload): MessageCreatedEventData {
    return new MessageCreatedEventData(data);
  }
}


const MessageUpdateSchema = z.object({ "id": z.string(), "content": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type MessageUpdateEventPayload = z.infer<typeof MessageUpdateSchema>;

export class MessageUpdateEventData {
  private readonly data: MessageUpdateEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageUpdateSchema.parse(payload);
  }

  get payload(): MessageUpdateEventPayload {
    return this.data;
  }

  static from(data: MessageUpdateEventPayload): MessageUpdateEventData {
    return new MessageUpdateEventData(data);
  }
}


const MessageUpdatedSchema = z.object({ "id": z.string(), "content": z.string(), "userId": z.string() }).strict();

export type MessageUpdatedEventPayload = z.infer<typeof MessageUpdatedSchema>;

export class MessageUpdatedEventData {
  private readonly data: MessageUpdatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageUpdatedSchema.parse(payload);
  }

  get payload(): MessageUpdatedEventPayload {
    return this.data;
  }

  static from(data: MessageUpdatedEventPayload): MessageUpdatedEventData {
    return new MessageUpdatedEventData(data);
  }
}


const MessageDeleteSchema = z.object({ "id": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type MessageDeleteEventPayload = z.infer<typeof MessageDeleteSchema>;

export class MessageDeleteEventData {
  private readonly data: MessageDeleteEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageDeleteSchema.parse(payload);
  }

  get payload(): MessageDeleteEventPayload {
    return this.data;
  }

  static from(data: MessageDeleteEventPayload): MessageDeleteEventData {
    return new MessageDeleteEventData(data);
  }
}


const MessageDeletedSchema = z.object({ "id": z.string(), "userId": z.string() }).strict();

export type MessageDeletedEventPayload = z.infer<typeof MessageDeletedSchema>;

export class MessageDeletedEventData {
  private readonly data: MessageDeletedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageDeletedSchema.parse(payload);
  }

  get payload(): MessageDeletedEventPayload {
    return this.data;
  }

  static from(data: MessageDeletedEventPayload): MessageDeletedEventData {
    return new MessageDeletedEventData(data);
  }
}


const MessageAiResponseRequestedSchema = z.object({ "messageId": z.string(), "topicId": z.string(), "userId": z.string(), "accessToken": z.string() }).strict();

export type MessageAiResponseRequestedEventPayload = z.infer<typeof MessageAiResponseRequestedSchema>;

export class MessageAiResponseRequestedEventData {
  private readonly data: MessageAiResponseRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = MessageAiResponseRequestedSchema.parse(payload);
  }

  get payload(): MessageAiResponseRequestedEventPayload {
    return this.data;
  }

  static from(data: MessageAiResponseRequestedEventPayload): MessageAiResponseRequestedEventData {
    return new MessageAiResponseRequestedEventData(data);
  }
}
