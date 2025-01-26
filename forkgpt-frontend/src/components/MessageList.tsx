import { useThreadMessages } from "../server-state/thread.hooks";
import { useAppSelector } from "../client-state/hooks";
import { Message } from "./Message";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MessageList() {
  const activeThreadId = useAppSelector((state) => state.thread.activeThreadId);
  const { data: threadData, isLoading } = useThreadMessages(
    activeThreadId || ""
  );

  if (!activeThreadId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a thread to view messages
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading messages...
      </div>
    );
  }

  if (!threadData?.messages.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet
      </div>
    );
  }

  return (
    <div
      className={classNames(
        "flex-1 overflow-y-auto px-4 py-4",
        isLoading ? "opacity-50" : ""
      )}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {threadData.messages.map((message) => (
          <div
            key={message.id}
            className={classNames(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={message.role === "user" ? "w-3/4 ml-auto" : "w-3/4"}
            >
              <Message message={message} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
