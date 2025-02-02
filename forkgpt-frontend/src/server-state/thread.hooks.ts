import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { threadApi, threadKeys } from "./thread.api";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { removeThreadFromHistory } from "../client-state/slices/threadHistorySlice";
import { Thread, mapThread } from "../models/thread.model";
import { useQueryParams } from "../hooks/useQueryParams";
import { supabase } from "../supabase";
import { useEffect } from "react";

const TEMP_THREAD_ID = "temp_thread_id";

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

  // Add check for temporary thread ID
  const isTempThread = threadId === TEMP_THREAD_ID;

  // Modify all query enable flags
  const threadQuery = useQuery({
    queryKey: threadKeys.detail(threadId),
    queryFn: () => threadApi.getThread(threadId),
    enabled: !!threadId && !isTempThread, // Prevent fetch for temp IDs
  });

  const messagesQuery = useQuery({
    queryKey: threadKeys.messages(threadId),
    queryFn: () => threadApi.getThreadMessages(threadId),
    enabled: !!threadId && !isTempThread, // Prevent fetch for temp IDs
  });

  // Modify subscription effect
  useEffect(() => {
    if (isTempThread || !threadId || !activeTopicId || !userId) return;

    // Subscribe to messages for the current topic and user
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
          // Refresh both thread and messages when a message changes
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
  }, [threadId, activeTopicId, userId, queryClient, isTempThread]);

  // Combine the results
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
    }: {
      topicId: string;
      name: string;
      leafMessageId?: string;
      leftThreadId?: string;
      rightThreadId?: string;
    }) => {
      dispatch(setActiveThread(null));

      return {
        ...(await threadApi.createThread(topicId, {
          name,
          leafMessageId: leafMessageId ?? null,
          leftThreadId: leftThreadId ?? null,
          rightThreadId: rightThreadId ?? null,
        })),
        TEMP_THREAD_ID,
      };
    },
    onMutate: async (variables) => {
      const { topicId, name, leftThreadId, rightThreadId } = variables;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: threadKeys.list(topicId) });

      // Get current threads
      const previousThreads =
        queryClient.getQueryData<Thread[]>(threadKeys.list(topicId)) || [];

      // Calculate temporary rank
      let tempRank = 0;
      if (leftThreadId) {
        const leftThread = previousThreads.find((t) => t.id === leftThreadId);
        tempRank = leftThread ? leftThread.rank + 1 : previousThreads.length;
      } else if (rightThreadId) {
        const rightThread = previousThreads.find((t) => t.id === rightThreadId);
        tempRank = rightThread ? rightThread.rank - 1 : 0;
      } else {
        tempRank = previousThreads.length;
      }

      // Create optimistic thread
      const optimisticThread: Thread = {
        id: TEMP_THREAD_ID,
        topicId,
        name,
        leafMessageId: null,
        userId: "", // Will be populated by real response
        rank: tempRank,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update cache
      queryClient.setQueryData<Thread[]>(threadKeys.list(topicId), (old = []) =>
        [...old, optimisticThread].sort((a, b) => a.rank - b.rank)
      );

      // Activate the optimistic thread
      dispatch(setActiveThread(TEMP_THREAD_ID));
      setThreadId(TEMP_THREAD_ID);

      return { previousThreads, tempId: TEMP_THREAD_ID };
    },
    onSuccess: (realThread, variables, context) => {
      // Replace optimistic thread with real data
      queryClient.setQueryData<Thread[]>(
        threadKeys.list(variables.topicId),
        (old = []) =>
          old
            .map((t) => (t.id === context.tempId ? realThread : t))
            .sort((a, b) => a.rank - b.rank)
      );
      dispatch(setActiveThread(realThread.id));
      setThreadId(realThread.id);
      // Update active thread to real ID: There is a weird bug (not updating active tab) that's fixed when we update active twice with delay.
      setTimeout(() => {
        dispatch(setActiveThread(realThread.id));
        setThreadId(realThread.id);
      });
    },
    onError: (_, variables, context) => {
      // Rollback optimistic update
      if (context?.previousThreads) {
        queryClient.setQueryData(
          threadKeys.list(variables.topicId),
          context.previousThreads
        );
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
      // Invalidate threads list to reflect rank changes
      queryClient.invalidateQueries({
        queryKey: threadKeys.list(updatedThread.topicId),
      });

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
