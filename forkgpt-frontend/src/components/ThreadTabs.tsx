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
import { DragEvent, useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  rectIntersection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import React from "react";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Add sortable item component
const SortableItem = React.memo(
  ({
    thread,
    onDelete,
    onBranch,
    activeThreadId,
    onSelect,
  }: {
    thread: Thread;
    onDelete: (id: string) => void;
    onBranch: (thread: Thread) => void;
    activeThreadId: string | null;
    onSelect: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: thread.id });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition: "none",
      zIndex: isDragging ? 20 : "auto",
      opacity: isDragging ? 0.9 : 1,
      flex: "0 0 auto",
      width: "auto",
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group relative flex items-center px-2"
        {...attributes}
        data-id={thread.id}
        role="button"
      >
        <div className="flex items-center " {...listeners}>
          <button
            onClick={() => {
              onSelect(thread.id);
            }}
            className={classNames(
              thread.id === activeThreadId
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-100",
              " py-1.5 text-sm font-medium rounded-md px-2 transition-colors"
            )}
          >
            <span className="line-clamp-1">{thread.name}</span>
          </button>
        </div>

        <div className="flex items-center pl-2">
          <button
            onClick={() => onBranch(thread)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Branch from this thread"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onDelete(thread.id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Delete thread"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

export function ThreadTabs() {
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const { data: threads, isLoading } = useThreads(activeTopicId || "");
  const { mutate: createThread } = useCreateThread();
  const { mutate: deleteThread } = useDeleteThread();
  const { mutate: updateThread } = useUpdateThread();
  const dispatch = useAppDispatch();
  const { setThreadId } = useQueryParams();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [localThreads, setLocalThreads] = useState<Thread[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize once when threads load
  useEffect(() => {
    if (threads && localThreads.length === 0) {
      setLocalThreads(threads);
    }
  }, [threads]); // Only run once when threads first load

  // Add container measurement and scroll adjustment
  const navRef = useRef<HTMLDivElement>(null);

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

  const handleDeleteThread = (threadId: string) => {
    if (window.confirm("Are you sure you want to delete this thread?")) {
      deleteThread(threadId);
      setThreadId(null);
    }
  };

  const handleThreadClick = (threadId: string) => {
    console.log("was here");
    dispatch(setActiveThread(threadId));
    setThreadId(threadId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = localThreads.findIndex((t) => t.id === active.id);
    const newIndex = localThreads.findIndex((t) => t.id === over.id);

    if (oldIndex === newIndex) return;

    const newThreads = arrayMove([...localThreads], oldIndex, newIndex);
    setLocalThreads(newThreads);

    // Get neighbors from the reordered array
    const thread = newThreads[newIndex];
    const leftThread = newThreads[newIndex - 1];
    const rightThread = newThreads[newIndex + 1];

    updateThread({
      threadId: thread.id,
      name: thread.name,
      leftThreadId: leftThread?.id || null,
      rightThreadId: rightThread?.id || null,
    });
  };

  return (
    <div className="thread-tabs-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        modifiers={[]}
        autoScroll={{ threshold: { x: 0.1, y: 0.1 } }}
      >
        <SortableContext
          items={localThreads.map((t) => t.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex items-center justify-between">
            <nav
              ref={navRef}
              className="flex flex-1 overflow-x-auto flex-nowrap gap-px p-2 bg-gray-50/50 rounded-xl scrollbar-hide"
              aria-label="Threads"
            >
              {localThreads.map((thread) => (
                <SortableItem
                  key={thread.id}
                  thread={thread}
                  onDelete={handleDeleteThread}
                  onBranch={handleBranchThread}
                  activeThreadId={activeThreadId}
                  onSelect={handleThreadClick}
                />
              ))}
            </nav>
            <button
              onClick={handleNewThread}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600"
              title="New Thread"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
