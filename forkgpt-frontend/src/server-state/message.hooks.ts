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

  return useMutation({
    mutationFn: async ({
      topicId,
      content,
    }: {
      topicId: string;
      content: string;
    }) => {
      return messageApi.createMessage(topicId, {
        content,
        threadId: activeThreadId,
      });
    },
    onSuccess: (newMessage: Api.Message) => {
      // Update thread messages cache
      if (activeThreadId) {
        queryClient.setQueryData(
          threadKeys.messages(activeThreadId),
          (
            old: { thread: Api.Thread; messages: Api.Message[] } | undefined
          ) => ({
            ...old,
            thread: old?.thread || null,
            messages: [...(old?.messages || []), newMessage],
          })
        );
      }

      // Set as active message
      dispatch(setActiveMessage(newMessage.id));
      dispatch(setActivePath([newMessage.id]));
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
