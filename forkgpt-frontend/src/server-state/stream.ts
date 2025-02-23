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
        (ablyMessage: Api.ably.MessageUpdated) => {
          console.log("Api.ably.MessageUpdatedEvent ", ablyMessage);
          const updatedMessage = ablyMessage.message;
          queryClient.setQueryData(
            messageKeys.detail(updatedMessage.id),
            updatedMessage
          );

          const threadId = ablyMessage.threadId;
          if (threadId) {
            queryClient.setQueryData(
              threadKeys.messages(threadId),
              (oldData: any) => ({
                ...oldData,
                messages:
                  oldData?.messages?.map((msg: any) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                  ) || [],
              })
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
