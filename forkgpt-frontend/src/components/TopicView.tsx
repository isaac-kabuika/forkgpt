import { ChatInput } from "./ChatInput";
import { ThreadTabs } from "./ThreadTabs";
import { MessageList } from "./MessageList";
import { useAppSelector } from "../client-state/hooks";
import { useThreads } from "../server-state/thread.hooks";
export function TopicView() {
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const { data: threads, isLoading } = useThreads(activeTopicId || "");

  if (!isLoading && !threads?.length) {
    return (
      <div className="flex flex-col w-full h-full min-w-0 justify-center items-center">
        <div className="w-full max-w-2xl px-4 -mt-32">
          <h2 className="text-2xl font-medium text-center mb-6 text-gray-700">
            How can I help?
          </h2>
          <ChatInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-w-0">
      <ThreadTabs />
      <div className="flex-1 overflow-y-auto min-w-0">
        <MessageList />
      </div>
      <ChatInput />
    </div>
  );
}
