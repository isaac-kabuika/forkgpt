import * as Api from "forkgpt-api-types";
import { api } from "./api";

export const threadKeys = {
  all: ["threads"] as const,
  lists: () => [...threadKeys.all, "list"] as const,
  list: (topicId: string) => [...threadKeys.lists(), topicId] as const,
  details: () => [...threadKeys.all, "detail"] as const,
  detail: (id: string) => [...threadKeys.details(), id] as const,
  messages: (threadId: string) =>
    [...threadKeys.detail(threadId), "messages"] as const,
};

export const threadApi = {
  getThreads: async (topicId: string) => {
    const response = await api.get<Api.ThreadListResponse>(
      `/topics/${topicId}/threads`
    );
    return response.data.threads;
  },

  getThreadMessages: async (threadId: string) => {
    const response = await api.get<Api.ThreadWithMessages>(
      `/threads/${threadId}/messages`
    );
    return response.data;
  },

  createThread: async (topicId: string, data: Api.CreateThreadRequest) => {
    const response = await api.post<Api.ThreadResponse>(
      `/topics/${topicId}/threads`,
      data
    );
    return response.data.thread;
  },

  updateThread: async (threadId: string, data: Api.UpdateThreadRequest) => {
    const response = await api.patch<Api.ThreadResponse>(
      `/threads/${threadId}`,
      data
    );
    return response.data.thread;
  },

  deleteThread: async (threadId: string) => {
    await api.delete(`/threads/${threadId}`);
    return threadId;
  },
};
