import { useState, useRef, useEffect } from "react";
import { useCreateMessage } from "../server-state/message.hooks";
import { useCreateThread } from "../server-state/thread.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import { useCreateTopic } from "../server-state/topic.hooks";
import { useQueryParams } from "../client-state/useQueryParams";
import * as Api from "forkgpt-api-types";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ChatInput() {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: createMessage, isPending: isSending } = useCreateMessage();
  const { mutate: createThread } = useCreateThread();
  const initialActiveTopicId = useAppSelector(
    (state) => state.topic.activeTopicId
  );
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const activeMessageId = useAppSelector(
    (state) => state.message.activeMessageId
  );
  const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
    useCreateTopic();
  const { setThreadId } = useQueryParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    let topicIdToUse: string | null = initialActiveTopicId;

    if (!topicIdToUse) {
      try {
        const newTopic: Api.Topic = await createTopicAsync();
        topicIdToUse = newTopic.id;
      } catch (error) {
        console.error("Failed to create topic:", error);
        return;
      }
    }

    if (!topicIdToUse) {
      console.error("Topic ID is still null after potential creation.");
      return;
    }

    if (!activeThreadId) {
      createThread({
        name: "Pending...",
        topicId: topicIdToUse,
        newMessageContent: trimmedContent,
      });
    } else {
      createMessage({
        topicId: topicIdToUse,
        content: trimmedContent,
      });
    }

    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="pb-2 mb-4">
      <div className="max-w-3xl mx-auto relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeMessageId ? "Ask anything..." : "Ask anything..."}
          className={classNames(
            "w-full resize-none rounded-3xl bg-gray-100 p-3 pl-5 pr-12",
            "focus:outline-none border-none",
            "placeholder:text-gray-500",
            "min-h-[112px] max-h-[200px]",
            "text-lg"
          )}
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSending || isCreatingTopic}
          className={classNames(
            "absolute right-4 bottom-5 p-2 rounded-full",
            "bg-black hover:bg-gray-800",
            isSending || isCreatingTopic ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
            <path
              fill="currentColor"
              d="M12 4v12M6 10l6-6 6 6"
              strokeWidth="3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              fillOpacity="0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
