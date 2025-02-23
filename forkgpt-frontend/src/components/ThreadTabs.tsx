import {
  useThreads,
  useDeleteThread,
  useUpdateThread,
} from "../server-state/thread.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import { setActiveThread } from "../client-state/slices/threadSlice";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryParams } from "../hooks/useQueryParams";
import { Thread } from "../models/thread.model";
import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Add sortable item component
const SortableItem = React.memo(
  ({
    thread,
    onDelete,
    activeThreadId,
    onSelect,
  }: {
    thread: Thread;
    onDelete: (id: string) => void;
    activeThreadId: string | null;
    onSelect: (id: string) => void;
  }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useSortable({ id: thread.id });

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
        className="group relative flex items-center px-2 gap-1"
        {...attributes}
        data-id={thread.id}
        role="button"
      >
        <div
          className={classNames(
            thread.id === activeThreadId
              ? "text-blue-700 bg-blue-100"
              : "text-gray-600 hover:bg-blue-50",
            "w-full flex justify-between items-center py-1.5 px-2 text-sm rounded-md transition-colors cursor-pointer"
          )}
          {...listeners}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(thread.id);
          }}
        >
          <span className="line-clamp-1">{thread.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(thread.id);
            }}
            className="ml-2 text-gray-400 hover:text-gray-600"
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
  const { mutate: deleteThread } = useDeleteThread();
  const { mutate: updateThread } = useUpdateThread();
  const dispatch = useAppDispatch();
  const { setThreadId } = useQueryParams();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [localThreads, setLocalThreads] = useState<Thread[]>([]);

  // Add topic change detection
  const prevTopicId = useRef(activeTopicId);
  useEffect(() => {
    if (activeTopicId !== prevTopicId.current) {
      setLocalThreads([]);
      prevTopicId.current = activeTopicId;
    }
  }, [activeTopicId]);

  // Update synchronization logic
  useEffect(() => {
    if (threads) {
      const serverIds = threads.map((t) => t.id).join(",");
      const localIds = localThreads.map((t) => t.id).join(",");

      if (serverIds !== localIds) {
        setLocalThreads(threads);
      }
    }
  }, [threads]); // Removed isDragging dependency

  // Add container measurement and scroll adjustment
  const navRef = useRef<HTMLDivElement>(null);

  // Add this useEffect
  useEffect(() => {
    if (threads?.length && !activeThreadId) {
      const lastThread = threads[threads.length - 1];
      dispatch(setActiveThread(lastThread.id));
      setThreadId(lastThread.id);
    }
  }, [threads, activeThreadId, dispatch, setThreadId]);

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

  const handleDeleteThread = (threadId: string) => {
    if (window.confirm("Are you sure you want to delete this thread?")) {
      deleteThread(threadId);
      setThreadId(null);
    }
  };

  const handleThreadClick = (threadId: string) => {
    dispatch(setActiveThread(threadId));
    setThreadId(threadId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Immediate local state update
    const oldIndex = localThreads.findIndex((t) => t.id === active.id);
    const newIndex = localThreads.findIndex((t) => t.id === over.id);

    if (oldIndex === newIndex) return;

    const newThreads = arrayMove([...localThreads], oldIndex, newIndex);
    setLocalThreads(newThreads); // Optimistic update

    // Async server update
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
          <div className="flex items-center">
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
                  activeThreadId={activeThreadId}
                  onSelect={handleThreadClick}
                />
              ))}
            </nav>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
