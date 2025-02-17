import { EventBus } from "safe-event";
import {
  messageEvents,
  MessageListRequestedEventData,
  MessageListFetchedEventData,
  MessageCreatedEventData,
  MessageUpdatedEventData,
  MessageDeletedEventData,
  MessageCreateEventData,
  MessageUpdateEventData,
  MessageDeleteEventData,
  MessageAiResponseRequestedEventData,
} from "../../_generated/events/message-events";
import { MessageRepository } from "./message.repository";
import { MessageError, MessageErrorCode } from "./message.types";
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
} from "../../_generated/events/llm-events";
import { randomUUID } from "crypto";
import { threadEvents } from "../../_generated/events/thread-events";
import { ThreadUpdateLeafEventData } from "../../_generated/events/thread-events";

export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  init() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    // Handle list messages request
    EventBus.instance.onEvent({
      event: messageEvents["message.list.requested"],
      callback: async (event: MessageListRequestedEventData) => {
        try {
          const messages = await this.messageRepository.getMessagesByTopic(
            event.payload.accessToken,
            event.payload.topicId
          );

          EventBus.instance.emitEvent({
            event: messageEvents["message.list.fetched"],
            correlationId: event.payload.userId,
            data: MessageListFetchedEventData.from({
              topicId: event.payload.topicId,
              messages: messages.map((message) => ({
                id: message.id,
                content: message.content,
                role: message.role,
                parentId: message.parentId,
                createdAt: message.createdAt.getTime(),
                updatedAt: message.updatedAt.getTime(),
              })),
            }),
          });
        } catch (error) {
          if (error instanceof MessageError) {
            throw error;
          }
          throw new MessageError(
            MessageErrorCode.UNAUTHORIZED,
            "Failed to fetch messages"
          );
        }
      },
    });

    // Handle message creation request
    EventBus.instance.onEvent({
      event: messageEvents["message.create"],
      callback: async (
        messageCreateEvent: MessageCreateEventData,
        messageCreateEventCorrelationId
      ) => {
        try {
          console.log("message.create.handler");
          const userMessage =
            await this.messageRepository.createMessageWithThreadId(
              messageCreateEvent.payload.accessToken,
              {
                content: messageCreateEvent.payload.content,
                role: messageCreateEvent.payload.role,
                topicId: messageCreateEvent.payload.topicId,
                userId: messageCreateEvent.payload.userId,
              },
              messageCreateEvent.payload.threadId ?? null
            );
          console.log("message.create.handler.userMessage");
          const messages = await this.messageRepository.getThreadMessages(
            messageCreateEvent.payload.accessToken,
            userMessage.id
          );
          if (messageCreateEvent.payload.threadId) {
            EventBus.instance.emitEvent({
              event: threadEvents["thread.updateLeaf"],
              correlationId: messageCreateEvent.payload.userId,
              data: ThreadUpdateLeafEventData.from({
                threadId: messageCreateEvent.payload.threadId,
                messageId: userMessage.id,
                userId: userMessage.userId,
                accessToken: messageCreateEvent.payload.accessToken,
              }),
            });
          }

          const llmRequestorCorrelationId = randomUUID();

          EventBus.instance.onceEvent({
            event: llmEvents["llm.response.generated"],
            correlationId: llmRequestorCorrelationId,
            callback: async (
              llmResponseGeneratedEventData: LlmResponseGeneratedEventData
            ) => {
              const aiMessage = await this.messageRepository.createMessage(
                messageCreateEvent.payload.accessToken,
                {
                  content: llmResponseGeneratedEventData.payload.content,
                  role: "assistant",
                  topicId: userMessage.topicId,
                  parentId: userMessage.id,
                  userId: userMessage.userId,
                }
              );
              if (messageCreateEvent.payload.threadId) {
                EventBus.instance.emitEvent({
                  event: threadEvents["thread.updateLeaf"],
                  correlationId: userMessage.userId,
                  data: ThreadUpdateLeafEventData.from({
                    threadId: messageCreateEvent.payload.threadId,
                    messageId: aiMessage.id,
                    userId: aiMessage.userId,
                    accessToken: messageCreateEvent.payload.accessToken,
                  }),
                });
              }
              EventBus.instance.emitEvent({
                event: messageEvents["message.created"],
                correlationId: messageCreateEventCorrelationId,
                data: MessageCreatedEventData.from({
                  id: aiMessage.id,
                  content: aiMessage.content,
                  role: aiMessage.role,
                  parentId: aiMessage.parentId,
                  topicId: aiMessage.topicId,
                  userId: aiMessage.userId,
                  createdAt: aiMessage.createdAt.getTime(),
                }),
              });
            },
          });
          EventBus.instance.emitEvent({
            event: llmEvents["llm.response.requested"],
            correlationId: llmRequestorCorrelationId,
            data: LlmResponseRequestedEventData.from({
              messages: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            }),
          });
        } catch (error) {
          if (error instanceof MessageError) {
            throw error;
          }
          throw error;
        }
      },
    });

    // Handle message update request
    EventBus.instance.onEvent({
      event: messageEvents["message.update"],
      callback: async (event: MessageUpdateEventData) => {
        try {
          const message = await this.messageRepository.updateMessage(
            event.payload.accessToken,
            event.payload.id,
            event.payload.content
          );

          EventBus.instance.emitEvent({
            event: messageEvents["message.updated"],
            correlationId: event.payload.userId,
            data: MessageUpdatedEventData.from({
              id: message.id,
              content: message.content,
              userId: message.userId,
            }),
          });
        } catch (error) {
          if (error instanceof MessageError) {
            throw error;
          }
          throw new MessageError(
            MessageErrorCode.UNAUTHORIZED,
            "Failed to update message"
          );
        }
      },
    });

    // Handle message deletion request
    EventBus.instance.onEvent({
      event: messageEvents["message.delete"],
      callback: async (event: MessageDeleteEventData) => {
        try {
          await this.messageRepository.deleteMessage(
            event.payload.accessToken,
            event.payload.id
          );

          EventBus.instance.emitEvent({
            event: messageEvents["message.deleted"],
            correlationId: event.payload.userId,
            data: MessageDeletedEventData.from({
              id: event.payload.id,
              userId: event.payload.userId,
            }),
          });
        } catch (error) {
          if (error instanceof MessageError) {
            throw error;
          }
          throw new MessageError(
            MessageErrorCode.UNAUTHORIZED,
            "Failed to delete message"
          );
        }
      },
    });
  }

  async getMessage(access_token: string, messageId: string) {
    return this.messageRepository.getMessage(access_token, messageId);
  }
}
