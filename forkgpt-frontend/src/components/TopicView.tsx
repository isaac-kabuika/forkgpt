import { ChatInput } from "./ChatInput";
import { ThreadTabs } from "./ThreadTabs";
import { MessageList } from "./MessageList";

export function TopicView() {
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
