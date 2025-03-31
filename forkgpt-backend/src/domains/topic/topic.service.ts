import { EventBus } from "safe-event";
import {
  topicEvents,
  TopicListRequestedEventData,
  TopicListFetchedEventData,
  TopicCreatedEventData,
  TopicUpdatedEventData,
  TopicDeletedEventData,
  TopicCreateEventData,
  TopicUpdateEventData,
  TopicDeleteEventData,
} from "../../_generated/events/topic-events";
import { TopicRepository } from "./topic.repository";
import { TopicError, TopicErrorCode } from "./topic.types";
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
} from "../../_generated/events/llm-events";

export class TopicService {
  constructor(private readonly topicRepository: TopicRepository) {}

  init() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    // Handle list topics request
    EventBus.instance.onEvent({
      event: topicEvents["topic.list.requested"],
      callback: async (
        event: TopicListRequestedEventData,
        topicListRequestorCorrelationId
      ) => {
        try {
          const topics = await this.topicRepository.listTopics({
            accessToken: event.payload.accessToken,
            userId: event.payload.userId,
          });

          EventBus.instance.emitEvent({
            event: topicEvents["topic.list.fetched"],
            correlationId: topicListRequestorCorrelationId,
            data: TopicListFetchedEventData.from({
              userId: event.payload.userId,
              topics: topics.map((topic) => ({
                id: topic.id,
                title: topic.title,
                createdAt: topic.createdAt.getTime(),
                updatedAt: topic.updatedAt.getTime(),
              })),
            }),
          });
        } catch (error) {
          if (error instanceof TopicError) {
            throw error;
          }
          throw error;
        }
      },
    });

    // Handle topic creation request
    EventBus.instance.onEvent({
      event: topicEvents["topic.create"],
      callback: async (
        topicCreateEventData: TopicCreateEventData,
        topicCreateRequestorCorrelationId
      ) => {
        if (!topicCreateRequestorCorrelationId) {
          console.error(
            "Topic.create missing requestor correlation id. Aborting."
          );
          return;
        }
        try {
          const topic = await this.topicRepository.createTopic({
            accessToken: topicCreateEventData.payload.accessToken,
            userId: topicCreateEventData.payload.userId,
            title: "Loading...",
          });

          EventBus.instance.emitEvent({
            event: topicEvents["topic.created"],
            correlationId: topicCreateRequestorCorrelationId,
            data: TopicCreatedEventData.from({
              id: topic.id,
              title: topic.title,
              userId: topic.userId,
              createdAt: topic.createdAt.getTime(),
            }),
          });

          const llmRequestCorrelationId = topicCreateRequestorCorrelationId;

          /** Generates the topic title using LLM and emits the topic updated event. */
          EventBus.instance.onceEvent({
            event: llmEvents["llm.response.generated"],
            correlationId: llmRequestCorrelationId,
            callback: async (
              llmResponseGeneratedEventData: LlmResponseGeneratedEventData
            ) => {
              try {
                const updatedTopic = await this.topicRepository.updateTopic({
                  topicId: topic.id,
                  accessToken: topicCreateEventData.payload.accessToken,
                  title: llmResponseGeneratedEventData.payload.content,
                });

                EventBus.instance.emitEvent({
                  event: topicEvents["topic.updated"],
                  correlationId: topicCreateRequestorCorrelationId,
                  data: TopicUpdatedEventData.from({
                    id: updatedTopic.id,
                    title: updatedTopic.title,
                    userId: updatedTopic.userId,
                  }),
                });
              } catch (updateError) {
                console.error(
                  "Failed to update topic title after LLM generation:",
                  updateError
                );
              }
            },
          });

          EventBus.instance.emitEvent({
            event: llmEvents["llm.response.requested"],
            correlationId: llmRequestCorrelationId,
            data: LlmResponseRequestedEventData.from({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "Generate a concise (5 words or less) title for the following user message. Output only the title text.",
                },
                {
                  role: "user",
                  content: topicCreateEventData.payload.newMessageContent,
                },
              ],
            }),
          });
        } catch (error) {
          console.error(
            "Failed to create topic or initiate title generation:",
            error
          );
          if (error instanceof TopicError) {
            throw error;
          }
          throw error;
        }
      },
    });

    // Handle topic update request
    EventBus.instance.onEvent({
      event: topicEvents["topic.update"],
      callback: async (
        event: TopicUpdateEventData,
        topicUpdateRequestorCorrelationId
      ) => {
        try {
          const topic = await this.topicRepository.updateTopic({
            accessToken: event.payload.accessToken,
            topicId: event.payload.id,
            title: event.payload.title,
          });

          EventBus.instance.emitEvent({
            event: topicEvents["topic.updated"],
            correlationId: topicUpdateRequestorCorrelationId,
            data: TopicUpdatedEventData.from({
              id: topic.id,
              title: topic.title,
              userId: topic.userId,
            }),
          });
        } catch (error) {
          if (error instanceof TopicError) {
            throw error;
          }
          throw error;
        }
      },
    });

    // Handle topic deletion request
    EventBus.instance.onEvent({
      event: topicEvents["topic.delete"],
      callback: async (
        event: TopicDeleteEventData,
        topicDeleteRequestorCorrelationId
      ) => {
        try {
          await this.topicRepository.deleteTopic({
            accessToken: event.payload.accessToken,
            topicId: event.payload.id,
          });

          EventBus.instance.emitEvent({
            event: topicEvents["topic.deleted"],
            correlationId: topicDeleteRequestorCorrelationId,
            data: TopicDeletedEventData.from({
              id: event.payload.id,
              userId: event.payload.userId,
            }),
          });
        } catch (error) {
          if (error instanceof TopicError) {
            throw error;
          }
          throw new TopicError(
            TopicErrorCode.UNAUTHORIZED,
            "Failed to delete topic"
          );
        }
      },
    });
  }

  async createTopic(accessToken: string, userId: string, title: string) {
    return this.topicRepository.createTopic({ accessToken, userId, title });
  }

  async getTopic(accessToken: string, topicId: string) {
    return this.topicRepository.getTopic({ accessToken, topicId });
  }

  async listTopics(accessToken: string, userId: string) {
    return this.topicRepository.listTopics({ accessToken, userId });
  }
}
