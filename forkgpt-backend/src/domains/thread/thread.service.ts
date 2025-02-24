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
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
} from "../../_generated/events/llm-events";
import {
  MessageCreateEventData,
  messageEvents,
} from "../../_generated/events/message-events";

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
          const threads = await this.threadRepository.listThreads({
            accessToken: event.payload.accessToken,
            topicId: event.payload.topicId,
          });

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
      callback: async (
        threadCreateEventData: ThreadCreateEventData,
        threadCreateRequestorCorrelationId
      ) => {
        if (!threadCreateRequestorCorrelationId) {
          console.error(
            "Thread.create missing requestor correlation id. Aborting."
          );
          return;
        }
        try {
          // Only allow creating a thread without parent if no threads exist
          if (!threadCreateEventData.payload.leafMessageId) {
            const existingThreads = await this.threadRepository.listThreads({
              accessToken: threadCreateEventData.payload.accessToken,
              topicId: threadCreateEventData.payload.topicId,
            });

            if (existingThreads.length > 0) {
              throw new ThreadError(
                ThreadErrorCode.INVALID_PARENT_MESSAGE,
                "New threads must branch from existing messages"
              );
            }
          }

          const newThreadWithoutName = await this.threadRepository.createThread(
            {
              id: threadCreateEventData.payload.id,
              accessToken: threadCreateEventData.payload.accessToken,
              userId: threadCreateEventData.payload.userId,
              topicId: threadCreateEventData.payload.topicId,
              name: "Loading",
              leafMessageId:
                threadCreateEventData.payload.leafMessageId ?? null,
              leftThreadId: threadCreateEventData.payload.leftThreadId ?? null,
              rightThreadId:
                threadCreateEventData.payload.rightThreadId ?? null,
            }
          );

          EventBus.instance.emitEvent({
            event: threadEvents["thread.created"],
            correlationId: threadCreateRequestorCorrelationId,
            data: ThreadCreatedEventData.from({
              id: newThreadWithoutName.id,
              topicId: newThreadWithoutName.topicId,
              name: newThreadWithoutName.name,
              leafMessageId: newThreadWithoutName.leafMessageId,
              userId: newThreadWithoutName.userId,
              rank: newThreadWithoutName.rank,
              createdAt: newThreadWithoutName.createdAt.getTime(),
            }),
          });

          const llmRequestCorrelationId = threadCreateRequestorCorrelationId;

          /** Generates the thread name and emits the thread with the name update. */
          EventBus.instance.onceEvent({
            event: llmEvents["llm.response.generated"],
            correlationId: llmRequestCorrelationId,
            callback: async (
              llmResponseGeneratedEventData: LlmResponseGeneratedEventData
            ) => {
              const newThreadWithName =
                await this.threadRepository.updateThread({
                  threadId: newThreadWithoutName.id,
                  accessToken: threadCreateEventData.payload.accessToken,
                  updates: {
                    name: llmResponseGeneratedEventData.payload.content,
                  },
                });
              EventBus.instance.emitEvent({
                event: threadEvents["thread.updated"],
                correlationId: threadCreateRequestorCorrelationId,
                data: ThreadUpdatedEventData.from({
                  id: newThreadWithName.id,
                  name: newThreadWithName.name,
                  userId: newThreadWithName.userId,
                  rank: newThreadWithName.rank,
                }),
              });
            },
          });
          EventBus.instance.emitEvent({
            event: llmEvents["llm.response.requested"],
            correlationId: llmRequestCorrelationId,
            data: LlmResponseRequestedEventData.from({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "assistant",
                  content:
                    "You are the fastest text title builder. Only ouput 3 or less words that's a good title for the user text.",
                },
                {
                  role: "user",
                  content: threadCreateEventData.payload.newMessageContent,
                },
              ],
            }),
          });

          EventBus.instance.emitEvent({
            event: messageEvents["message.create"],
            correlationId: threadCreateRequestorCorrelationId,
            data: MessageCreateEventData.from({
              content: threadCreateEventData.payload.newMessageContent,
              role: "user",
              threadId: newThreadWithoutName.id,
              topicId: newThreadWithoutName.topicId,
              userId: newThreadWithoutName.userId,
              accessToken: threadCreateEventData.payload.accessToken,
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
          const thread = await this.threadRepository.updateThread({
            accessToken: event.payload.accessToken,
            threadId: event.payload.id,
            updates: {
              name: event.payload.name,
              rank: event.payload.rank,
              leftThreadId: event.payload.leftThreadId,
              rightThreadId: event.payload.rightThreadId,
            },
          });

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
          await this.threadRepository.deleteThread({
            accessToken: event.payload.accessToken,
            threadId: event.payload.id,
          });

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
          const thread = await this.threadRepository.getThread({
            accessToken: event.payload.accessToken,
            threadId: event.payload.threadId,
          });

          if (!thread) {
            throw new ThreadError(
              ThreadErrorCode.THREAD_NOT_FOUND,
              "Thread not found"
            );
          }

          if (thread.userId !== event.payload.userId) {
            throw new ThreadError(ThreadErrorCode.UNAUTHORIZED, "Unauthorized");
          }

          const messages = await this.threadRepository.getThreadMessages({
            accessToken: event.payload.accessToken,
            threadId: event.payload.threadId,
          });

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
          await this.threadRepository.updateThreadLeaf({
            accessToken: event.payload.accessToken,
            threadId: event.payload.threadId,
            messageId: event.payload.messageId,
          });

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

  async getThread(accessToken: string, threadId: string) {
    return this.threadRepository.getThread({ accessToken, threadId });
  }

  async getThreadMessages(accessToken: string, threadId: string) {
    return this.threadRepository.getThreadMessages({ accessToken, threadId });
  }

  async updateThreadLeaf(
    accessToken: string,
    threadId: string,
    messageId: string
  ) {
    return this.threadRepository.updateThreadLeaf({
      accessToken,
      threadId,
      messageId,
    });
  }
}
