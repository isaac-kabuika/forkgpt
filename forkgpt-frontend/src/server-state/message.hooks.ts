import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi, messageKeys } from "./message.api";
import { threadKeys } from "./thread.api";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import {
  setActiveMessage,
  setActivePath,
} from "../client-state/slices/messageSlice";
import * as Api from "forkgpt-api-types";
import { topicKeys } from "./topic.api";

export function useMessage(topicId: string, messageId: string) {
  return useQuery({
    queryKey: messageKeys.detail(messageId),
    queryFn: () => messageApi.getMessage(topicId, messageId),
    enabled: !!topicId && !!messageId,
  });
}

export function useMessageResponses(topicId: string, messageId: string) {
  return useQuery({
    queryKey: messageKeys.responses(messageId),
    queryFn: () => messageApi.getMessageResponses(topicId, messageId),
    enabled: !!topicId && !!messageId,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useMutation({
    mutationFn: async ({
      topicId,
      content,
    }: {
      topicId: string;
      content: string;
    }) => {
      // Get current thread messages to find parent ID
      const currentThread = queryClient.getQueryData<Api.ThreadWithMessages>(
        threadKeys.messages(activeThreadId!)
      );
      const parentId = currentThread?.messages.length
        ? currentThread.messages[currentThread.messages.length - 1].id
        : null;

      // Create optimistic message
      const optimisticMessage: Api.Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        content,
        role: "user",
        parentId,
        topicId,
        userId: userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add optimistic message to cache before the request
      if (activeThreadId) {
        queryClient.setQueryData<Api.ThreadWithMessages>(
          threadKeys.messages(activeThreadId),
          (old) => ({
            ...old!,
            messages: [...(old?.messages || []), optimisticMessage],
          })
        );
      }

      // Make the actual API call
      return messageApi.createMessage(topicId, {
        content,
        threadId: activeThreadId,
      });
    },
    onSuccess: (newMessage: Api.Message) => {
      if (activeThreadId) {
        // Replace optimistic message with real one and invalidate to get AI response
        queryClient.setQueryData<Api.ThreadWithMessages>(
          threadKeys.messages(activeThreadId),
          (old) => ({
            ...old!,
            messages:
              old?.messages.map((msg) =>
                msg.id.startsWith("temp-") ? newMessage : msg
              ) || [],
          })
        );

        // Invalidate to get the AI response
        queryClient.invalidateQueries({
          queryKey: threadKeys.messages(activeThreadId),
        });
      }

      // Set as active message
      dispatch(setActiveMessage(newMessage.id));
      dispatch(setActivePath([newMessage.id]));
    },
    onError: () => {
      // Remove optimistic message on error
      if (activeThreadId) {
        queryClient.setQueryData<Api.ThreadWithMessages>(
          threadKeys.messages(activeThreadId),
          (old) => ({
            ...old!,
            messages:
              old?.messages.filter((msg) => !msg.id.startsWith("temp-")) || [],
          })
        );
      }
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      messageId,
      content,
    }: {
      topicId: string;
      messageId: string;
      content: string;
    }) => {
      return messageApi.updateMessage(topicId, messageId, { content });
    },
    onSuccess: (updatedMessage: Api.Message, { topicId }) => {
      // Update message in topic tree cache
      queryClient.setQueryData(
        topicKeys.tree(topicId),
        (old: { messages: Api.Message[] } | undefined) => ({
          ...old,
          messages: old?.messages.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ),
        })
      );

      // Update individual message cache
      queryClient.setQueryData(
        messageKeys.detail(updatedMessage.id),
        updatedMessage
      );
    },
  });
}
