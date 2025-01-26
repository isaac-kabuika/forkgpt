import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import { setActiveTopic } from "../client-state/slices/topicSlice";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { setLastThreadForTopic } from "../client-state/slices/threadHistorySlice";

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const lastThreadByTopic = useAppSelector(
    (state) => state.threadHistory.lastThreadByTopic
  );

  // Read and set initial state from URL
  useEffect(() => {
    const topicId = searchParams.get("topic");
    const threadId = searchParams.get("thread");

    if (topicId) {
      dispatch(setActiveTopic(topicId));
      if (!threadId && lastThreadByTopic[topicId]) {
        dispatch(setActiveThread(lastThreadByTopic[topicId]));
        setThreadId(lastThreadByTopic[topicId]);
      }
    }
    if (threadId) {
      dispatch(setActiveThread(threadId));
    }
  }, [lastThreadByTopic]);

  const setTopicId = (topicId: string | null) => {
    if (topicId) {
      searchParams.set("topic", topicId);
      const lastThreadId = lastThreadByTopic[topicId];
      if (lastThreadId) {
        searchParams.set("thread", lastThreadId);
        dispatch(setActiveThread(lastThreadId));
      } else {
        searchParams.delete("thread");
        dispatch(setActiveThread(null));
      }
    } else {
      searchParams.delete("topic");
      searchParams.delete("thread");
    }
    setSearchParams(searchParams);
  };

  const setThreadId = (threadId: string | null) => {
    const topicId = searchParams.get("topic");
    if (threadId) {
      searchParams.set("thread", threadId);
      if (topicId) {
        dispatch(setLastThreadForTopic({ topicId, threadId }));
      }
    } else {
      searchParams.delete("thread");
    }
    setSearchParams(searchParams);
  };

  return {
    topicId: searchParams.get("topic"),
    threadId: searchParams.get("thread"),
    setTopicId,
    setThreadId,
  };
}
