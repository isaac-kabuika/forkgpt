import { useState, useRef, useEffect } from "react";
import { useCreateMessage } from "../server-state/message.hooks";
import { useAppSelector } from "../client-state/hooks";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ChatInput() {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: createMessage, isPending: isSending } = useCreateMessage();
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const activeMessageId = useAppSelector(
    (state) => state.message.activeMessageId
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopicId || !content.trim()) return;

    createMessage({
      topicId: activeTopicId,
      content: content.trim(),
    });

    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeTopicId) {
    return null;
  }

  return (
    <div className="px-4 pb-4 pt-2 mb-4">
      <div className="max-w-2xl mx-auto relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeMessageId ? "Type your reply..." : "Type your message..."
          }
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
          disabled={!content.trim() || isSending}
          className={classNames(
            "absolute right-4 bottom-5 p-2 rounded-full",
            "bg-black hover:bg-gray-800"
          )}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
            <path
              fill="currentColor"
              d="M4 12h12M12 6l6 6-6 6"
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
