// Generated code - do not edit
import { z } from "zod";

export const userEvents = {
  "user.profile.requested": "user:user.profile.requested",
  "user.profile.updated": "user:user.profile.updated",
  "user.profile.fetched": "user:user.profile.fetched"
} as const;

export type userEventTypes = typeof userEvents[keyof typeof userEvents];



const UserProfileRequestedSchema = z.object({ "userId": z.string() }).strict();

export type UserProfileRequestedEventPayload = z.infer<typeof UserProfileRequestedSchema>;

export class UserProfileRequestedEventData {
  private readonly data: UserProfileRequestedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = UserProfileRequestedSchema.parse(payload);
  }

  get payload(): UserProfileRequestedEventPayload {
    return this.data;
  }

  static from(data: UserProfileRequestedEventPayload): UserProfileRequestedEventData {
    return new UserProfileRequestedEventData(data);
  }
}


const UserProfileUpdatedSchema = z.object({ "userId": z.string(), "email": z.string().optional(), "isAnonymous": z.boolean() }).strict();

export type UserProfileUpdatedEventPayload = z.infer<typeof UserProfileUpdatedSchema>;

export class UserProfileUpdatedEventData {
  private readonly data: UserProfileUpdatedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = UserProfileUpdatedSchema.parse(payload);
  }

  get payload(): UserProfileUpdatedEventPayload {
    return this.data;
  }

  static from(data: UserProfileUpdatedEventPayload): UserProfileUpdatedEventData {
    return new UserProfileUpdatedEventData(data);
  }
}


const UserProfileFetchedSchema = z.object({ "userId": z.string(), "email": z.string().optional(), "isAnonymous": z.boolean(), "createdAt": z.number(), "lastLoginAt": z.number() }).strict();

export type UserProfileFetchedEventPayload = z.infer<typeof UserProfileFetchedSchema>;

export class UserProfileFetchedEventData {
  private readonly data: UserProfileFetchedEventPayload;

  constructor(data: unknown) {
    const payload = typeof data === 'object' && data !== null && 'data' in data
      ? (data as any).data
      : data;

    this.data = UserProfileFetchedSchema.parse(payload);
  }

  get payload(): UserProfileFetchedEventPayload {
    return this.data;
  }

  static from(data: UserProfileFetchedEventPayload): UserProfileFetchedEventData {
    return new UserProfileFetchedEventData(data);
  }
}
