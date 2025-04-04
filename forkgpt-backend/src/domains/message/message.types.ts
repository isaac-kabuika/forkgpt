// Error types
export enum MessageErrorCode {
  DATABASE_ERROR = "DATABASE_ERROR",
  MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND",
  INVALID_CONTENT = "INVALID_CONTENT",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export class MessageError extends Error {
  constructor(public code: MessageErrorCode, message: string) {
    super(message);
    this.name = "MessageError";
  }
}

// Domain models
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  parentId: string | null;
  topicId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
