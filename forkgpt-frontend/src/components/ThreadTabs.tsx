import {
  useThreads,
  useCreateThread,
  useDeleteThread,
  useUpdateThread,
} from "../server-state/thread.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryParams } from "../hooks/useQueryParams";
import { Thread } from "../models/thread.model";
import { threadApi } from "../server-state/thread.api";
import { DragEvent, useState } from "react";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ThreadTabs() {
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const { data: threads, isLoading } = useThreads(activeTopicId || "");
  const { mutate: createThread } = useCreateThread();
  const { mutate: deleteThread } = useDeleteThread();
  const { mutate: updateThread } = useUpdateThread();
  const dispatch = useAppDispatch();
  const { setThreadId } = useQueryParams();
  const [draggedThread, setDraggedThread] = useState<Thread | null>(null);

  if (!activeTopicId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="border-b border-gray-200">
        <div className="px-4 py-2">Loading threads...</div>
      </div>
    );
  }

  const handleNewThread = () => {
    if (threads && threads.length === 0) {
      dispatch(setActiveThread(null));
      setThreadId(null);
      createThread({
        topicId: activeTopicId,
        name: "New Thread",
      });
    }
  };

  const handleBranchThread = async (parentThread: Thread) => {
    // Get the latest thread data to ensure we have the current leaf message ID
    const latestThread = await threadApi.getThread(parentThread.id);

    const threadList = threads || [];
    const leftThreadIdIndex = threadList.findIndex(
      (t) => t.id === latestThread.id
    );

    // Get left and right threads for the new position
    const leftThreadId = threadList[leftThreadIdIndex].id;
    const rightThreadId =
      leftThreadIdIndex < threadList.length - 1
        ? threadList[leftThreadIdIndex + 1].id
        : undefined;

    createThread({
      topicId: activeTopicId,
      name: `${parentThread.name} (branch)`,
      leafMessageId: latestThread.leafMessageId ?? undefined,
      leftThreadId,
      rightThreadId,
    });
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this thread?")) {
      deleteThread(threadId);
      setThreadId(null);
    }
  };

  const handleThreadClick = (threadId: string) => {
    dispatch(setActiveThread(threadId));
    setThreadId(threadId);
  };

  const handleDragStart = (thread: Thread, e: DragEvent<HTMLDivElement>) => {
    setDraggedThread(thread);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (thread: Thread, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetThread: Thread, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedThread || draggedThread.id === targetThread.id) return;

    // Find adjacent threads for new position
    const threadList = threads || [];
    const targetIndex = threadList.findIndex((t) => t.id === targetThread.id);

    // Get left and right threads for the new position
    const leftThreadId =
      targetIndex > 0 ? threadList[targetIndex - 1].id : null;
    const rightThreadId =
      targetIndex < threadList.length - 1 ? threadList[targetIndex].id : null;

    updateThread({
      threadId: draggedThread.id,
      name: draggedThread.name,
      leftThreadId,
      rightThreadId,
    });

    setDraggedThread(null);
  };

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center px-4">
        <nav className="flex flex-1 overflow-x-auto py-2" aria-label="Threads">
          {threads?.map((thread) => (
            <div
              key={thread.id}
              draggable
              onDragStart={(e) => handleDragStart(thread, e)}
              onDragOver={(e) => handleDragOver(thread, e)}
              onDrop={(e) => handleDrop(thread, e)}
              className={classNames(
                "group relative flex items-center cursor-move",
                "first:before:hidden before:content-[''] before:h-5 before:w-[2px] before:bg-gray-300 before:mx-4 before:self-center"
              )}
            >
              <button
                onClick={() => handleThreadClick(thread.id)}
                className={classNames(
                  thread.id === activeThreadId
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-700",
                  "px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-2"
                )}
              >
                <span>{thread.name}</span>
              </button>
              <div className="flex gap-4 items-center">
                <button
                  onClick={(e) => handleDeleteThread(thread.id, e)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md ml-1"
                  title="Delete thread"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBranchThread(thread)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md ml-1"
                  title="Branch from this thread"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </nav>
        {(!threads || threads.length === 0) && (
          <button
            onClick={handleNewThread}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600"
            title="New Thread"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
