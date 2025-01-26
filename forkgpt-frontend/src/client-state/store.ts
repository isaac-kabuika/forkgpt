import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import topicReducer from "./slices/topicSlice";
import messageReducer from "./slices/messageSlice";
import threadReducer from "./slices/threadSlice";
import threadHistoryReducer from "./slices/threadHistorySlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    topic: topicReducer,
    message: messageReducer,
    thread: threadReducer,
    threadHistory: threadHistoryReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
