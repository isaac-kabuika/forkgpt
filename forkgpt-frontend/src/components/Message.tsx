import { useState } from "react";
import { Message as MessageType } from "../models/message.model";
import { PlusIcon } from "@heroicons/react/24/outline";
import { BranchInput } from "./BranchInput";
import { useCreateThread } from "../server-state/thread.hooks";
import { useAppSelector } from "../client-state/hooks";
import { threadApi } from "../server-state/thread.api";
import { useThreads } from "../server-state/thread.hooks";

interface MessageProps {
  message: MessageType;
  threadId: string;
}

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Message({ message, threadId }: MessageProps) {
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const { mutate: createThread } = useCreateThread();
  const { data: threads } = useThreads(activeTopicId || "");

  const handleBranchSubmit = async (content: string) => {
    if (!activeTopicId) return;

    try {
      const parentThread = await threadApi.getThread(threadId);
      const threadList = threads || [];
      const leftThreadIdIndex = threadList.findIndex((t) => t.id === threadId);

      createThread({
        topicId: activeTopicId,
        name: `${parentThread.name} (branch)`,
        leafMessageId: parentThread.leafMessageId ?? undefined,
        leftThreadId: threadList[leftThreadIdIndex]?.id,
        rightThreadId: threadList[leftThreadIdIndex + 1]?.id,
        newMessageContent: content,
      });
    } catch (error) {
      console.error("Failed to create branch:", error);
    }
    setShowBranchInput(false);
  };

  return (
    <div
      className={classNames(
        "flex",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={classNames(
          "prose prose-slate max-w-none px-4 py-3 rounded-2xl relative",
          message.role === "user"
            ? "bg-gray-100 text-gray-950"
            : "bg-white text-black",
          message.role === "assistant" &&
            "group hover:bg-gray-50 transition-colors"
        )}
      >
        {message.role === "assistant" && (
          <>
            <div className="absolute -top-2 -left-2 w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center bg-white">
              <span className="text-xs text-gray-900 font-medium">GL</span>
            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  setClickPosition({ x: e.clientX, y: e.clientY });
                  setShowBranchInput(true);
                }}
                className="p-1.5 bg-gray-100 rounded-full shadow-sm border border-gray-200 hover:bg-gray-200 transition-colors"
                title="Branch conversation"
              >
                <PlusIcon className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {showBranchInput && (
              <div
                className="fixed z-50"
                style={{
                  left: `calc(${clickPosition.x}px - 21rem)`,
                  top: `${clickPosition.y + 20}px`,
                }}
              >
                <BranchInput
                  onClose={() => setShowBranchInput(false)}
                  onSubmit={handleBranchSubmit}
                />
              </div>
            )}
          </>
        )}
        <div className={message.role === "assistant" ? "ml-4" : ""}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
