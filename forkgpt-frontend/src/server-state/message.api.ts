import * as Api from "forkgpt-api-types";
import { api } from "./api";

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (topicId: string) => [...messageKeys.lists(), topicId] as const,
  details: () => [...messageKeys.all, "detail"] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  responses: (parentId: string) =>
    [...messageKeys.detail(parentId), "responses"] as const,
};

export const messageApi = {
  createMessage: async (topicId: string, data: Api.CreateMessageRequest) => {
    const response = await api.post<Api.MessageResponse>(
      `/topics/${topicId}/messages`,
      data
    );
    return response.data.message;
  },

  updateMessage: async (
    topicId: string,
    messageId: string,
    data: Api.UpdateMessageRequest
  ) => {
    const response = await api.post(
      `/topics/${topicId}/messages/${messageId}`,
      data
    );
    return Api.messageSchema.parse(response.data);
  },

  getMessage: async (topicId: string, messageId: string) => {
    const response = await api.get(`/topics/${topicId}/messages/${messageId}`);
    return Api.messageSchema.parse(response.data);
  },

  getMessageResponses: async (topicId: string, messageId: string) => {
    const response = await api.get(
      `/topics/${topicId}/messages/${messageId}/responses`
    );
    return response.data as Api.Message[];
  },
};
