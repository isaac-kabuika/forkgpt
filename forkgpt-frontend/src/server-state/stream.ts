import { Realtime, RealtimeChannel, Channel } from "ably";
import store from "../client-state/store";
import { queryClient } from "./queryClient";
import { messageKeys } from "./message.api";
import { threadKeys } from "./thread.api";
import { topicKeys } from "./topic.api";
import * as Api from "forkgpt-api-types";
import { mapThread } from "../models/thread.model";
import { mapTopic } from "../models/topic.model";

let ablyClient: Realtime | null = null;
let channel: RealtimeChannel | Channel;

// Store the unsubscribe function for the store listener
let unsubscribeStore: CallableFunction;

// Initialize Ably connection when user is available
const initializeStreamListener = () => {
  unsubscribeStore = store.subscribe(async () => {
    const state = store.getState();
    const userId = state.auth.user?.id;

    if (userId && !ablyClient) {
      // Initialize Ably only once
      ablyClient = new Realtime({
        key: import.meta.env.VITE_ABLY_API_KEY,
        clientId: userId,
      });

      channel = ablyClient.channels.get(userId);
      console.debug("Initialized streaming.");
      // Set up message handlers
      channel.subscribe(Api.ably.EventName.MESSAGE_UPDATED, (ablyMessage) => {
        const data: Api.ably.MessageUpdated = ablyMessage.data;
        const updatedMessage = data.message;
        const threadId = data.threadId;
        queryClient.setQueryData(
          messageKeys.detail(updatedMessage.id),
          updatedMessage
        );
        if (threadId) {
          queryClient.setQueryData<Api.ThreadWithMessages>(
            threadKeys.messages(threadId),
            (oldData) => {
              if (!oldData) return oldData;

              const messageExists = oldData.messages.some(
                (msg) => msg.id === updatedMessage.id
              );

              return {
                ...oldData,
                messages: messageExists
                  ? oldData.messages.map((msg) =>
                      msg.id === updatedMessage.id ? updatedMessage : msg
                    )
                  : [...oldData.messages, updatedMessage],
              };
            }
          );
        }
        if (updatedMessage.parentId) {
          queryClient.setQueryData<Api.Message[]>(
            messageKeys.responses(updatedMessage.parentId),
            (oldData) => {
              if (!oldData) return [updatedMessage];

              const messageExists = oldData.some(
                (msg) => msg.id === updatedMessage.id
              );

              return messageExists
                ? oldData.map((msg) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                  )
                : [...oldData, updatedMessage];
            }
          );
        }
      });

      channel.subscribe(Api.ably.EventName.THREAD_UPDATED, (ablyMessage) => {
        const data: Api.ably.ThreadUpdated = ablyMessage.data;
        const updatedThread = mapThread(data.thread);

        queryClient.setQueryData<Api.Thread[]>(
          threadKeys.list(updatedThread.topicId),
          (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((thread) =>
              thread.id === updatedThread.id ? updatedThread : thread
            );
          }
        );

        queryClient.setQueryData(
          threadKeys.detail(updatedThread.id),
          updatedThread
        );
      });

      channel.subscribe(Api.ably.EventName.TOPIC_UPDATED, (ablyMessage) => {
        const data: Api.ably.TopicUpdated = ablyMessage.data;
        const updatedTopic = mapTopic(data.topic);

        queryClient.setQueryData<Api.Topic[]>(topicKeys.lists(), (oldData) => {
          if (!oldData) return [updatedTopic];
          const topicExists = oldData.some(
            (topic) => topic.id === updatedTopic.id
          );
          return topicExists
            ? oldData.map((topic) =>
                topic.id === updatedTopic.id ? updatedTopic : topic
              )
            : [...oldData, updatedTopic];
        });

        queryClient.setQueryData(
          topicKeys.detail(updatedTopic.id),
          updatedTopic
        );
      });

      // Remove the store subscription after initialization
      if (unsubscribeStore) {
        unsubscribeStore();
      }
    }
  });
};

// Cleanup when window closes
window.addEventListener("beforeunload", () => {
  ablyClient?.close();
  unsubscribeStore?.();
});

export default initializeStreamListener;
