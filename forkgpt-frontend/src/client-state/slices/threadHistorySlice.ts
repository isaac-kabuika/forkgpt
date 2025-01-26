import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ThreadHistoryState {
  lastThreadByTopic: Record<string, string>;
}

const initialState: ThreadHistoryState = {
  lastThreadByTopic: {},
};

const threadHistorySlice = createSlice({
  name: "threadHistory",
  initialState,
  reducers: {
    setLastThreadForTopic: (
      state,
      action: PayloadAction<{ topicId: string; threadId: string }>
    ) => {
      state.lastThreadByTopic[action.payload.topicId] = action.payload.threadId;
    },
    removeThreadFromHistory: (
      state,
      action: PayloadAction<string> // threadId
    ) => {
      // Remove this thread from any topic's history
      Object.entries(state.lastThreadByTopic).forEach(([topicId, threadId]) => {
        if (threadId === action.payload) {
          delete state.lastThreadByTopic[topicId];
        }
      });
    },
    clearThreadHistory: (state) => {
      state.lastThreadByTopic = {};
    },
  },
});

export const {
  setLastThreadForTopic,
  clearThreadHistory,
  removeThreadFromHistory,
} = threadHistorySlice.actions;
export default threadHistorySlice.reducer;
