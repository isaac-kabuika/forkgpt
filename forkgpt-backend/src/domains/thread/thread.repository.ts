import { Message } from "../message/message.types";
import { Thread } from "./thread.types";

export interface ThreadRepository {
  createThread(
    access_token: string,
    userId: string,
    topicId: string,
    name: string,
    leafMessageId: string | null
  ): Promise<Thread>;

  getThread(access_token: string, threadId: string): Promise<Thread | null>;

  getThreadMessages(access_token: string, threadId: string): Promise<Message[]>;

  listThreads(access_token: string, topicId: string): Promise<Thread[]>;

  updateThread(
    access_token: string,
    threadId: string,
    name: string
  ): Promise<Thread>;

  deleteThread(access_token: string, threadId: string): Promise<void>;

  updateThreadLeaf(
    access_token: string,
    threadId: string,
    messageId: string
  ): Promise<Thread>;
}
