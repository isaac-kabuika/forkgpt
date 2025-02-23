import { Realtime } from "ably";
import store from "../client-state/store";
import { queryClient } from "./queryClient";
import { messageKeys } from "./message.api";
import { threadKeys } from "./thread.api";
import * as Api from "forkgpt-api-types";

let ablyClient: Realtime | null = null;
let channel: any = null;

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
      channel.subscribe(
        Api.ably.EventName.MESSAGE_UPDATED,
        (ablyMessage: { data: Api.ably.MessageUpdated }) => {
          const updatedMessage = ablyMessage.data.message;
          const threadId = ablyMessage.data.threadId;

          // Update or insert the message detail cache
          queryClient.setQueryData(
            messageKeys.detail(updatedMessage.id),
            updatedMessage
          );

          // Update or insert the message in thread messages cache
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

          // Update or insert message in responses cache if it exists
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
        }
      );

      channel.subscribe("thread.updated", () => {
        // Future thread update handling
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
