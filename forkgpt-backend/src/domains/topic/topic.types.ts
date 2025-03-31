// Error types
export enum TopicErrorCode {
  DATABASE_ERROR = "DATABASE_ERROR",
  TOPIC_NOT_FOUND = "TOPIC_NOT_FOUND",
  INVALID_TITLE = "INVALID_TITLE",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export class TopicError extends Error {
  constructor(public code: TopicErrorCode, message: string) {
    super(message);
    this.name = "TopicError";
  }
}

// Domain models
export interface Topic {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
