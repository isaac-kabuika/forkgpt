import { TopicList } from "./TopicList";
import { TopicView } from "./TopicView";

export function Layout() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-[260px] bg-gray-50 flex flex-col py-2">
        <TopicList />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopicView />
      </div>
    </div>
  );
}
