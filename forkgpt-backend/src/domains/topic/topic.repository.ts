import { Topic } from "./topic.types";

export interface TopicRepository {
  createTopic(args: {
    accessToken: string;
    userId: string;
    title: string;
  }): Promise<Topic>;
  getTopic(args: {
    accessToken: string;
    topicId: string;
  }): Promise<Topic | null>;
  updateTopic(args: {
    accessToken: string;
    topicId: string;
    title: string;
  }): Promise<Topic>;
  deleteTopic(args: { accessToken: string; topicId: string }): Promise<void>;
  listTopics(args: { accessToken: string; userId: string }): Promise<Topic[]>;
}
