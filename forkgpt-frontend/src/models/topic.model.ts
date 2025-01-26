import * as Api from "forkgpt-api-types";
import { buildMessageTree, Message } from "./message.model";

export interface Topic {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface TopicTree {
  topic: Topic;
  messageTree: Message[];
}

export function mapTopic(apiTopic: Api.Topic): Topic {
  return {
    ...apiTopic,
    createdAt: new Date(apiTopic.createdAt),
    updatedAt: new Date(apiTopic.updatedAt),
  };
}

export function mapTopicTree(apiTopicTree: Api.TopicTree): TopicTree {
  return {
    topic: mapTopic(apiTopicTree.topic),
    messageTree: buildMessageTree(apiTopicTree.messages),
  };
}
