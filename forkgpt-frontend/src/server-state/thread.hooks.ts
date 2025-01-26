import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { threadApi, threadKeys } from "./thread.api";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { removeThreadFromHistory } from "../client-state/slices/threadHistorySlice";
import {
  Thread,
  mapThread,
  mapThreadWithMessages,
} from "../models/thread.model";
import { useQueryParams } from "../hooks/useQueryParams";

export function useThreads(topicId: string) {
  return useQuery({
    queryKey: threadKeys.list(topicId),
    queryFn: async () => {
      const threads = await threadApi.getThreads(topicId);
      return threads.map(mapThread);
    },
    enabled: !!topicId,
  });
}

export function useThreadMessages(threadId: string) {
  return useQuery({
    queryKey: threadKeys.messages(threadId),
    queryFn: async () => {
      const threadWithMessages = await threadApi.getThreadMessages(threadId);
      return mapThreadWithMessages(threadWithMessages);
    },
    enabled: !!threadId,
    placeholderData: undefined,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { setThreadId } = useQueryParams();

  return useMutation({
    mutationFn: async ({
      topicId,
      name,
      leafMessageId,
    }: {
      topicId: string;
      name: string;
      leafMessageId?: string;
    }) => {
      return threadApi.createThread(topicId, {
        name,
        leafMessageId: leafMessageId ?? null,
      });
    },
    onSuccess: (newThread, { topicId }) => {
      // Update threads list cache
      queryClient.setQueryData<Thread[]>(
        threadKeys.list(topicId),
        (old = []) => [...old, newThread]
      );

      // Set as active thread
      dispatch(setActiveThread(newThread.id));
      setThreadId(newThread.id);
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      name,
    }: {
      threadId: string;
      name: string;
    }) => {
      return threadApi.updateThread(threadId, { name });
    },
    onSuccess: (updatedThread) => {
      // Update thread in cache
      queryClient.setQueryData(
        threadKeys.detail(updatedThread.id),
        updatedThread
      );
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);

  return useMutation({
    mutationFn: threadApi.deleteThread,
    onSuccess: (_, deletedThreadId) => {
      // Remove thread detail and messages from cache
      queryClient.removeQueries({
        queryKey: threadKeys.detail(deletedThreadId),
      });
      queryClient.removeQueries({
        queryKey: threadKeys.messages(deletedThreadId),
      });

      // Update threads list cache to remove the deleted thread
      if (activeTopicId) {
        queryClient.setQueryData<Thread[]>(
          threadKeys.list(activeTopicId),
          (old = []) => old.filter((thread) => thread.id !== deletedThreadId)
        );
      }

      // Clear active thread if it was deleted
      dispatch(setActiveThread(null));
      // Remove thread from history
      dispatch(removeThreadFromHistory(deletedThreadId));
    },
  });
}
