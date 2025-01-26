import * as Api from "forkgpt-api-types";
import { mapMessage, Message } from "./message.model";

export interface Thread {
  id: string;
  topicId: string;
  name: string;
  leafMessageId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function mapThread(apiThread: Api.Thread): Thread {
  return {
    ...apiThread,
    createdAt: new Date(apiThread.createdAt),
    updatedAt: new Date(apiThread.updatedAt),
  };
}

export interface ThreadWithMessages {
  thread: Thread;
  messages: Message[];
}

export function mapThreadWithMessages(
  apiThreadWithMessages: Api.ThreadWithMessages
): ThreadWithMessages {
  return {
    thread: mapThread(apiThreadWithMessages.thread),
    messages: apiThreadWithMessages.messages.map(mapMessage),
  };
}
