import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../server-state/api";

interface MessageState {
  activeMessageId: string | null;
  activePath: string[]; // Array of message IDs representing the path from root to active message
  isLoading: boolean;
  error: string | null;
}

interface CreateMessagePayload {
  topicId: string;
  parentId: string | null;
  content: string;
}

export const createMessage = createAsyncThunk(
  "message/create",
  async (payload: CreateMessagePayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/topics/${payload.topicId}/messages`, {
        parentId: payload.parentId,
        content: payload.content,
      });

      return {
        messageId: data.id as string,
        parentId: payload.parentId,
      };
    } catch (error) {
      return rejectWithValue("Failed to create message");
    }
  }
);

const initialState: MessageState = {
  activeMessageId: null,
  activePath: [],
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setActiveMessage: (state, action: PayloadAction<string | null>) => {
      state.activeMessageId = action.payload;
      state.error = null;
    },
    setActivePath: (state, action: PayloadAction<string[]>) => {
      state.activePath = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create message
    builder
      .addCase(createMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMessageId = action.payload.messageId;
        if (action.payload.parentId) {
          state.activePath = [...state.activePath, action.payload.messageId];
        } else {
          state.activePath = [action.payload.messageId];
        }
        state.error = null;
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveMessage, setActivePath, setLoading, setError } =
  messageSlice.actions;
export default messageSlice.reducer;
