import { useState } from "react";
import { TopicList } from "./TopicList";
import { TopicView } from "./TopicView";

export function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen">
      <div
        className={`${
          isSidebarCollapsed ? "w-16" : "w-[260px]"
        } bg-gray-50 flex flex-col py-2 transition-all duration-300 overflow-hidden border-r`}
      >
        <TopicList
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isCollapsed={isSidebarCollapsed}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopicView />
      </div>
    </div>
  );
}
