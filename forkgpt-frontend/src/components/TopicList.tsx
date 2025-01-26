import {
  useTopics,
  useCreateTopic,
  useDeleteTopic,
} from "../server-state/topic.hooks";
import { useAppSelector, useAppDispatch } from "../client-state/hooks";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { setActiveTopic } from "../client-state/slices/topicSlice";
import { useQueryParams } from "../hooks/useQueryParams";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function TopicList() {
  const { data: topics, isLoading } = useTopics();
  const { mutate: createTopic } = useCreateTopic();
  const { mutate: deleteTopic } = useDeleteTopic();
  const activeTopicId = useAppSelector((state) => state.topic.activeTopicId);
  const dispatch = useAppDispatch();
  const { setTopicId } = useQueryParams();

  const handleTopicClick = (topicId: string) => {
    dispatch(setActiveTopic(topicId));
    setTopicId(topicId);
  };

  if (isLoading) {
    return <div className="p-4">Loading topics...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4">
        <button
          onClick={() => createTopic()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-200"
        >
          <PlusIcon className="w-4 h-4" />
          New Topic
        </button>
      </div>

      <div className="mt-2">
        <h3 className="px-4 mb-2 text-xs font-medium text-gray-500 uppercase">
          Yesterday
        </h3>
        <div className="flex-1 overflow-y-auto">
          {topics?.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No topics yet</div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {topics?.map((topic) => (
                <li
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className={classNames(
                    "flex items-center justify-between px-3 py-2 mx-2 hover:bg-gray-300/50 cursor-pointer rounded-lg group",
                    activeTopicId === topic.id ? "bg-gray-300/75 shadow-sm" : ""
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
    </div>
  );
}
