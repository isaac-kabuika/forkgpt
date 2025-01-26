import { Topic } from "./topic.types";

export interface TopicRepository {
  createTopic(
    access_token: string,
    userId: string,
    title: string
  ): Promise<Topic>;
  getTopic(access_token: string, topicId: string): Promise<Topic | null>;
  updateTopic(
    access_token: string,
    topicId: string,
    title: string
  ): Promise<Topic>;
  deleteTopic(access_token: string, topicId: string): Promise<void>;
  listTopics(access_token: string, userId: string): Promise<Topic[]>;
}
