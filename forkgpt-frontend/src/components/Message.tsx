import { Message as MessageType } from "../models/message.model";

interface MessageProps {
  message: MessageType;
}

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Message({ message }: MessageProps) {
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
            : "bg-white text-black"
        )}
      >
        {message.role === "assistant" && (
          <div className="absolute -top-2 -left-2 w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center bg-white">
            <span className="text-xs text-gray-900 font-medium">AI</span>
          </div>
        )}
        <div className={message.role === "assistant" ? "ml-4" : ""}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
