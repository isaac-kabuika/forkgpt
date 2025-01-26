import { Message } from "../message/message.types";

// Error types
export enum ThreadErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  THREAD_NOT_FOUND = "THREAD_NOT_FOUND",
  INVALID_PARENT_MESSAGE = "INVALID_PARENT_MESSAGE",
}

export class ThreadError extends Error {
  constructor(public code: ThreadErrorCode, message: string) {
    super(message);
    this.name = "ThreadError";
  }
}

// Domain models
export interface Thread {
  id: string;
  topicId: string;
  name: string;
  leafMessageId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadWithMessages {
  thread: Thread;
  messages: Message[];
}
