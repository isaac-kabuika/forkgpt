import { EventBus } from "safe-event";
import {
  threadEvents,
  ThreadListRequestedEventData,
  ThreadListFetchedEventData,
  ThreadCreatedEventData,
  ThreadUpdatedEventData,
  ThreadDeletedEventData,
  ThreadCreateEventData,
  ThreadUpdateEventData,
  ThreadDeleteEventData,
  ThreadMessagesRequestedEventData,
  ThreadMessagesFetchedEventData,
  ThreadUpdateLeafEventData,
  ThreadLeafUpdatedEventData,
} from "../../_generated/events/thread-events";
import { ThreadRepository } from "./thread.repository";
import { ThreadError, ThreadErrorCode } from "./thread.types";

export class ThreadService {
  constructor(private readonly threadRepository: ThreadRepository) {}

  init() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    // Handle list threads request
    EventBus.instance.onEvent({
      event: threadEvents["thread.list.requested"],
      callback: async (event: ThreadListRequestedEventData) => {
        try {
          const threads = await this.threadRepository.listThreads(
            event.payload.accessToken,
            event.payload.topicId
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.list.fetched"],
            correlationId: event.payload.userId,
            data: ThreadListFetchedEventData.from({
              threads: threads.map((thread) => ({
                id: thread.id,
                topicId: thread.topicId,
                name: thread.name,
                leafMessageId: thread.leafMessageId,
                userId: thread.userId,
                rank: thread.rank,
                createdAt: thread.createdAt.getTime(),
                updatedAt: thread.updatedAt.getTime(),
              })),
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw error;
        }
      },
    });

    // Handle thread creation request
    EventBus.instance.onEvent({
      event: threadEvents["thread.create"],
      callback: async (event: ThreadCreateEventData) => {
        try {
          // Only allow creating a thread without parent if no threads exist
          if (!event.payload.leafMessageId) {
            const existingThreads = await this.threadRepository.listThreads(
              event.payload.accessToken,
              event.payload.topicId
            );

            if (existingThreads.length > 0) {
              throw new ThreadError(
                ThreadErrorCode.INVALID_PARENT_MESSAGE,
                "New threads must branch from existing messages"
              );
            }
          }

          const thread = await this.threadRepository.createThread(
            event.payload.accessToken,
            event.payload.userId,
            event.payload.topicId,
            event.payload.name,
            event.payload.leafMessageId ?? null,
            event.payload.leftThreadId ?? null,
            event.payload.rightThreadId ?? null
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.created"],
            correlationId: event.payload.userId,
            data: ThreadCreatedEventData.from({
              id: thread.id,
              topicId: thread.topicId,
              name: thread.name,
              leafMessageId: thread.leafMessageId,
              userId: thread.userId,
              rank: thread.rank,
              createdAt: thread.createdAt.getTime(),
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw new ThreadError(
            ThreadErrorCode.UNAUTHORIZED,
            "Failed to create thread"
          );
        }
      },
    });

    // Handle thread update request
    EventBus.instance.onEvent({
      event: threadEvents["thread.update"],
      callback: async (event: ThreadUpdateEventData) => {
        try {
          const thread = await this.threadRepository.updateThread(
            event.payload.accessToken,
            event.payload.id,
            {
              name: event.payload.name,
              rank: event.payload.rank,
              leftThreadId: event.payload.leftThreadId,
              rightThreadId: event.payload.rightThreadId,
            }
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.updated"],
            correlationId: event.payload.userId,
            data: ThreadUpdatedEventData.from({
              id: thread.id,
              name: thread.name,
              userId: thread.userId,
              rank: thread.rank,
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw new ThreadError(
            ThreadErrorCode.UNAUTHORIZED,
            "Failed to update thread"
          );
        }
      },
    });

    // Handle thread deletion request
    EventBus.instance.onEvent({
      event: threadEvents["thread.delete"],
      callback: async (event: ThreadDeleteEventData) => {
        try {
          await this.threadRepository.deleteThread(
            event.payload.accessToken,
            event.payload.id
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.deleted"],
            correlationId: event.payload.userId,
            data: ThreadDeletedEventData.from({
              id: event.payload.id,
              userId: event.payload.userId,
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw new ThreadError(
            ThreadErrorCode.UNAUTHORIZED,
            "Failed to delete thread"
          );
        }
      },
    });

    // Handle thread messages request
    EventBus.instance.onEvent({
      event: threadEvents["thread.messages.requested"],
      callback: async (event: ThreadMessagesRequestedEventData) => {
        try {
          const thread = await this.threadRepository.getThread(
            event.payload.accessToken,
            event.payload.threadId
          );

          if (!thread) {
            throw new ThreadError(
              ThreadErrorCode.THREAD_NOT_FOUND,
              "Thread not found"
            );
          }

          if (thread.userId !== event.payload.userId) {
            throw new ThreadError(ThreadErrorCode.UNAUTHORIZED, "Unauthorized");
          }

          const messages = await this.threadRepository.getThreadMessages(
            event.payload.accessToken,
            event.payload.threadId
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.messages.fetched"],
            correlationId: event.payload.userId,
            data: ThreadMessagesFetchedEventData.from({
              thread: {
                id: thread.id,
                topicId: thread.topicId,
                name: thread.name,
                leafMessageId: thread.leafMessageId,
                userId: thread.userId,
                rank: thread.rank,
                createdAt: thread.createdAt.getTime(),
                updatedAt: thread.updatedAt.getTime(),
              },
              messages: messages.map((message) => ({
                id: message.id,
                content: message.content,
                role: message.role,
                parentId: message.parentId,
                topicId: message.topicId,
                userId: message.userId,
                createdAt: message.createdAt.getTime(),
                updatedAt: message.updatedAt.getTime(),
              })),
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw new ThreadError(
            ThreadErrorCode.UNAUTHORIZED,
            "Failed to fetch thread messages"
          );
        }
      },
    });

    // Handle thread leaf update
    EventBus.instance.onEvent({
      event: threadEvents["thread.updateLeaf"],
      callback: async (event: ThreadUpdateLeafEventData) => {
        try {
          await this.threadRepository.updateThreadLeaf(
            event.payload.accessToken,
            event.payload.threadId,
            event.payload.messageId
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.leafUpdated"],
            correlationId: event.payload.userId,
            data: ThreadLeafUpdatedEventData.from({
              threadId: event.payload.threadId,
              messageId: event.payload.messageId,
              userId: event.payload.userId,
            }),
          });
        } catch (error) {
          if (error instanceof ThreadError) {
            throw error;
          }
          throw new ThreadError(
            ThreadErrorCode.UNAUTHORIZED,
            "Failed to update thread leaf"
          );
        }
      },
    });
  }

  async getThread(access_token: string, threadId: string) {
    return this.threadRepository.getThread(access_token, threadId);
  }

  async getThreadMessages(access_token: string, threadId: string) {
    return this.threadRepository.getThreadMessages(access_token, threadId);
  }

  async updateThreadLeaf(
    access_token: string,
    threadId: string,
    messageId: string
  ) {
    return this.threadRepository.updateThreadLeaf(
      access_token,
      threadId,
      messageId
    );
  }
}
