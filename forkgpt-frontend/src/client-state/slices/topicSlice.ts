import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../server-state/api";

interface TopicState {
  activeTopicId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Async thunk for creating a new topic
export const createTopic = createAsyncThunk(
  "topic/create",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/topics");
      return data.id as string;
    } catch (error) {
      return rejectWithValue("Failed to create topic");
    }
  }
);

// Async thunk for deleting a topic
export const deleteTopic = createAsyncThunk(
  "topic/delete",
  async (topicId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/topics/${topicId}`);
      return topicId;
    } catch (error) {
      return rejectWithValue("Failed to delete topic");
    }
  }
);

const initialState: TopicState = {
  activeTopicId: null,
  isLoading: false,
  error: null,
};

const topicSlice = createSlice({
  name: "topic",
  initialState,
  reducers: {
    setActiveTopic: (state, action: PayloadAction<string | null>) => {
      state.activeTopicId = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create topic
    builder
      .addCase(createTopic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeTopicId = action.payload;
        state.error = null;
      })
      .addCase(createTopic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete topic
    builder
      .addCase(deleteTopic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.activeTopicId === action.payload) {
          state.activeTopicId = null;
        }
        state.error = null;
      })
      .addCase(deleteTopic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveTopic, setLoading, setError } = topicSlice.actions;
export default topicSlice.reducer;
