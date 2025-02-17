import { useState, useRef, useEffect } from "react";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function BranchInput({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const branchInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        branchInputRef.current &&
        !branchInputRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Call the onSubmit prop with the content
    onSubmit(content.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={branchInputRef}
      className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-4 w-[42rem]"
    >
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your branch message..."
          className={classNames(
            "w-full resize-none rounded-lg bg-gray-50 p-4 pr-16",
            "focus:outline-none border-none",
            "placeholder:text-gray-500 text-base",
            "min-h-[120px] max-h-[400px]"
          )}
          rows={1}
          autoFocus
        />
        <div className="absolute right-4 bottom-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            type="submit"
            disabled={!content.trim()}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4v12M6 10l6-6 6 6"
                strokeWidth="2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity="0"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
