import { Message } from "./message.types";

export interface MessageRepository {
  createMessage(
    access_token: string,
    message: Omit<Message, "id" | "createdAt" | "updatedAt">,
    id?: string
  ): Promise<Message>;
  createMessageWithThreadId(
    access_token: string,
    message: Omit<Message, "id" | "createdAt" | "updatedAt" | "parentId">,
    threadId: string | null
  ): Promise<Message>;
  getMessage(access_token: string, messageId: string): Promise<Message | null>;
  getMessagesByTopic(access_token: string, topicId: string): Promise<Message[]>;
  getThreadMessages(
    access_token: string,
    leafMessageId: string
  ): Promise<Message[]>;
  updateMessage(
    access_token: string,
    messageId: string,
    content: string
  ): Promise<Message>;
  deleteMessage(access_token: string, messageId: string): Promise<void>;
}
