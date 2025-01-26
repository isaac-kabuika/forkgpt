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

export class TopicService {
  constructor(private readonly topicRepository: TopicRepository) {}

  init() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    // Handle list topics request
    EventBus.instance.onEvent({
      event: topicEvents["topic.list.requested"],
      callback: async (event: TopicListRequestedEventData) => {
        try {
          const topics = await this.topicRepository.listTopics(
            event.payload.accessToken,
            event.payload.userId
          );

          EventBus.instance.emitEvent({
            event: topicEvents["topic.list.fetched"],
            correlationId: event.payload.userId,
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
      callback: async (event: TopicCreateEventData) => {
        try {
          const topic = await this.topicRepository.createTopic(
            event.payload.accessToken,
            event.payload.userId,
            event.payload.title
          );

          EventBus.instance.emitEvent({
            event: topicEvents["topic.created"],
            correlationId: event.payload.userId,
            data: TopicCreatedEventData.from({
              id: topic.id,
              title: topic.title,
              userId: topic.userId,
              createdAt: topic.createdAt.getTime(),
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

    // Handle topic update request
    EventBus.instance.onEvent({
      event: topicEvents["topic.update"],
      callback: async (event: TopicUpdateEventData) => {
        try {
          const topic = await this.topicRepository.updateTopic(
            event.payload.accessToken,
            event.payload.id,
            event.payload.title
          );

          EventBus.instance.emitEvent({
            event: topicEvents["topic.updated"],
            correlationId: event.payload.id, // Change this to userID.
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
      callback: async (event: TopicDeleteEventData) => {
        try {
          await this.topicRepository.deleteTopic(
            event.payload.accessToken,
            event.payload.id
          );

          EventBus.instance.emitEvent({
            event: topicEvents["topic.deleted"],
            correlationId: event.payload.userId,
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

  async createTopic(access_token: string, userId: string, title: string) {
    return this.topicRepository.createTopic(access_token, userId, title);
  }

  async getTopic(access_token: string, topicId: string) {
    return this.topicRepository.getTopic(access_token, topicId);
  }

  async listTopics(access_token: string, userId: string) {
    return this.topicRepository.listTopics(access_token, userId);
  }
}
