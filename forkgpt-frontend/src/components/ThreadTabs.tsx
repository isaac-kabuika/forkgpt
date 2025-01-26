import {
  useThreads,
  useCreateThread,
  useDeleteThread,
} from "../server-state/thread.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryParams } from "../hooks/useQueryParams";
import { Thread } from "../models/thread.model";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ThreadTabs() {
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const { data: threads, isLoading } = useThreads(activeTopicId || "");
  const { mutate: createThread } = useCreateThread();
  const { mutate: deleteThread } = useDeleteThread();
  const dispatch = useAppDispatch();
  const { setThreadId } = useQueryParams();

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

  const handleBranchThread = (parentThread: Thread) => {
    createThread({
      topicId: activeTopicId,
      name: `${parentThread.name} (branch)`,
      leafMessageId: parentThread.leafMessageId ?? undefined,
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

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center px-4">
        <nav className="flex flex-1 overflow-x-auto py-2" aria-label="Threads">
          {threads?.map((thread) => (
            <div
              key={thread.id}
              className="group relative flex items-center first:before:hidden before:content-[''] before:h-5 before:w-[2px] before:bg-gray-300 before:mx-4 before:self-center"
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
