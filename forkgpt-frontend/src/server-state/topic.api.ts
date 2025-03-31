import * as Api from "forkgpt-api-types";
import { api } from "./api";

export const topicKeys = {
  all: ["topics"] as const,
  lists: () => [...topicKeys.all] as const,
  list: (topicId: string) => [...topicKeys.lists(), topicId] as const,
  detail: (id: string) => [...topicKeys.all, id] as const,
  tree: (id: string) => [...topicKeys.all, id, "tree"] as const,
};

export const topicApi = {
  getTopics: async () => {
    const response = await api.get<Api.TopicListResponse>("/topics");
    return response.data.topics;
  },

  getTopic: async (id: string) => {
    const response = await api.get<Api.TopicResponse>(`/topics/${id}`);
    return response.data.topic;
  },

  createTopic: async (data: Api.CreateTopicRequest) => {
    const response = await api.post<Api.TopicResponse>("/topics", data);
    return response.data.topic;
  },

  deleteTopic: async (id: string) => {
    await api.delete(`/topics/${id}`);
    return id;
  },
};
