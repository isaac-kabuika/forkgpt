import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ThreadState {
  activeThreadId: string | null;
}

const initialState: ThreadState = {
  activeThreadId: null,
};

const threadSlice = createSlice({
  name: "thread",
  initialState,
  reducers: {
    setActiveThread: (state, action: PayloadAction<string | null>) => {
      state.activeThreadId = action.payload;
    },
  },
});

export const { setActiveThread } = threadSlice.actions;
export default threadSlice.reducer;
