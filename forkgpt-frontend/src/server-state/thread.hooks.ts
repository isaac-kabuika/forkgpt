import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { threadApi, threadKeys } from "./thread.api";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { removeThreadFromHistory } from "../client-state/slices/threadHistorySlice";
import { Thread, mapThread } from "../models/thread.model";
import { useQueryParams } from "../client-state/useQueryParams";
import { supabase } from "../supabase";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const threadQuery = useQuery({
    queryKey: threadKeys.detail(threadId),
    queryFn: async () => {
      const thread = await threadApi.getThread(threadId);
      return mapThread(thread);
    },
    enabled: !!threadId,
  });

  const messagesQuery = useQuery({
    queryKey: threadKeys.messages(threadId),
    queryFn: () => threadApi.getThreadMessages(threadId),
    enabled: !!threadId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!threadId || !activeTopicId || !userId) return;

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `topic_id=eq.${activeTopicId} AND user_id=eq.${userId}`,
        },
        async () => {
          queryClient.invalidateQueries({
            queryKey: threadKeys.detail(threadId),
          });
          queryClient.invalidateQueries({
            queryKey: threadKeys.messages(threadId),
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId, activeTopicId, userId, queryClient]);

  return {
    data:
      messagesQuery.data && threadQuery.data
        ? {
            thread: threadQuery.data,
            messages: messagesQuery.data.messages,
          }
        : undefined,
    isLoading: threadQuery.isLoading || messagesQuery.isLoading,
    error: threadQuery.error || messagesQuery.error,
  };
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
      leftThreadId,
      rightThreadId,
      newMessageContent,
    }: {
      topicId: string;
      name: string;
      leafMessageId?: string;
      leftThreadId?: string;
      rightThreadId?: string;
      newMessageContent: string;
    }) => {
      return threadApi.createThread(topicId, {
        id: crypto.randomUUID(),
        name,
        leafMessageId: leafMessageId ?? null,
        leftThreadId: leftThreadId ?? null,
        rightThreadId: rightThreadId ?? null,
        newMessageContent: newMessageContent,
      });
    },
    onSuccess: (newThread, variables) => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(variables.topicId),
      });

      queryClient.removeQueries({
        queryKey: threadKeys.messages(newThread.id),
      });
    },
    onSettled: (newThread) => {
      if (newThread) {
        // invalidateQueries & removeQueries seem to have a race condition with the dispatch for activeThread.
        // This bug is fixed when we move the dispatch calls to the end of the event loop.
        setTimeout(() => {
          dispatch(setActiveThread(newThread.id));
          setThreadId(newThread.id);
        }, 0);
      }
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      name,
      leftThreadId,
      rightThreadId,
    }: {
      threadId: string;
      name: string;
      leftThreadId: string | null;
      rightThreadId: string | null;
    }) => {
      return threadApi.updateThread(threadId, {
        name,
        leftThreadId,
        rightThreadId,
      });
    },
    onSuccess: (updatedThread) => {
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(updatedThread.topicId),
      });

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
      queryClient.removeQueries({
        queryKey: threadKeys.detail(deletedThreadId),
      });
      queryClient.removeQueries({
        queryKey: threadKeys.messages(deletedThreadId),
      });

      if (activeTopicId) {
        queryClient.setQueryData<Thread[]>(
          threadKeys.list(activeTopicId),
          (old = []) => old.filter((thread) => thread.id !== deletedThreadId)
        );
      }

      dispatch(setActiveThread(null));
      dispatch(removeThreadFromHistory(deletedThreadId));
    },
  });
}
