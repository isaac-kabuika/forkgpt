import { useTopics, useDeleteTopic } from "../server-state/topic.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import {
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { setActiveTopic } from "../client-state/slices/topicSlice";
import { useQueryParams } from "../client-state/useQueryParams";
import { useNavigate } from "react-router-dom";
import { setActiveThread } from "../client-state/slices/threadSlice";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface TopicListProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function TopicList({ isCollapsed, onToggleCollapse }: TopicListProps) {
  const { data: topics, isLoading } = useTopics();
  const { mutate: deleteTopic } = useDeleteTopic();
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const dispatch = useAppDispatch();
  const { setTopicId, setThreadId } = useQueryParams();
  const navigate = useNavigate();

  const handleTopicClick = (topicId: string) => {
    dispatch(setActiveTopic(topicId));
    setTopicId(topicId);
  };

  const createTopic = () => {
    dispatch(setActiveThread(null));
    setThreadId(null);
    dispatch(setActiveTopic(null));
    setTopicId(null);
    navigate("/");
  };

  if (isLoading) {
    return <div className="p-4">Loading topics...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between px-4 py-1">
        {!isCollapsed && (
          <h1
            className={classNames(
              "font-bold text-2xl font-pacifico whitespace-nowrap",
              "transition-opacity delay-100 duration-75",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
          >
            GoLook
          </h1>
        )}
        <button
          onClick={onToggleCollapse}
          className={classNames(
            "p-1 hover:bg-gray-200 rounded-lg transition-colors",
            isCollapsed ? "mx-auto" : ""
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <div
        className={classNames(
          "flex items-center",
          isCollapsed ? "p-2 justify-center" : "p-4"
        )}
      >
        <button
          onClick={() => createTopic()}
          className={classNames(
            "flex items-center gap-2 rounded-lg transition-colors",
            "bg-gray-200 hover:bg-gray-300 text-gray-800 hover:text-gray-900",
            isCollapsed ? "p-2 w-full justify-center" : "ps-2 pe-4 py-2"
          )}
          title={isCollapsed ? "New Chat" : undefined}
        >
          <PlusIcon
            className={classNames(
              "transition-all",
              isCollapsed ? "w-6 h-6" : "w-5 h-5"
            )}
          />
          {!isCollapsed && (
            <span className="whitespace-nowrap transition-opacity delay-100 duration-75">
              New chat
            </span>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-2">
          <h3 className="px-4 mb-2 text-xs font-medium text-gray-500 uppercase">
            Yesterday
          </h3>
          <div className="flex-1 overflow-y-auto">
            {topics?.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No topics yet</div>
            ) : (
              <ul className="flex flex-col gap-2 p-2">
                {topics?.map((topic) => (
                  <li
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={classNames(
                      "flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg group",
                      activeTopicId === topic.id
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "hover:bg-gray-300/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {topic.title || "Untitled Topic"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTopic(topic.id);
                      }}
                      className={classNames(
                        "ml-2 p-1 text-black rounded opacity-0",
                        "group-hover:opacity-100",
                        activeTopicId === topic.id ? "opacity-100" : ""
                      )}
                      title="Delete Topic"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
