import { Message } from "../message/message.types";
import { Thread } from "./thread.types";

export interface ThreadRepository {
  createThread(args: {
    accessToken: string;
    userId: string;
    topicId: string;
    name: string;
    leafMessageId: string | null;
    leftThreadId: string | null;
    rightThreadId: string | null;
  }): Promise<Thread>;

  getThread(args: {
    accessToken: string;
    threadId: string;
  }): Promise<Thread | null>;

  getThreadMessages(args: {
    accessToken: string;
    threadId: string;
  }): Promise<Message[]>;

  listThreads(args: {
    accessToken: string;
    topicId: string;
  }): Promise<Thread[]>;

  updateThread(args: {
    accessToken: string;
    threadId: string;
    updates: {
      name?: string;
      rank?: number;
      leftThreadId?: string | null;
      rightThreadId?: string | null;
    };
  }): Promise<Thread>;

  deleteThread(args: { accessToken: string; threadId: string }): Promise<void>;

  updateThreadLeaf(args: {
    accessToken: string;
    threadId: string;
    messageId: string;
  }): Promise<Thread>;
}
