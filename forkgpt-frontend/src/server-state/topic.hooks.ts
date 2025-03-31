import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { topicApi, topicKeys } from "./topic.api";
import { useAppDispatch } from "../client-state/hooks";
import { setActiveTopic } from "../client-state/slices/topicSlice";
import { mapTopic } from "../models/topic.model";
import * as Api from "forkgpt-api-types";
import { useQueryParams } from "../client-state/useQueryParams";

export function useTopics() {
  return useQuery({
    queryKey: topicKeys.lists(),
    queryFn: async () => {
      const topics = await topicApi.getTopics();
      return topics.map(mapTopic);
    },
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: async () => {
      const topic = await topicApi.getTopic(id);
      return mapTopic(topic);
    },
    enabled: !!id,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { setTopicId } = useQueryParams();

  return useMutation({
    mutationFn: (newMessageContent: string) => {
      const data = Api.createTopicRequestSchema.parse({
        newMessageContent,
      });
      return topicApi.createTopic(data);
    },
    onSuccess: (newTopic: Api.Topic) => {
      // Update topics list cache
      queryClient.setQueryData<Api.Topic[]>(topicKeys.lists(), (old = []) => [
        ...old,
        newTopic,
      ]);

      // Set the active topic immediately
      dispatch(setActiveTopic(newTopic.id));
      setTopicId(newTopic.id);
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: topicApi.deleteTopic,
    onSuccess: (_, deletedTopicId) => {
      // Invalidate the topics list cache
      queryClient.invalidateQueries({
        queryKey: topicKeys.lists(),
      });

      // Remove topic detail from cache
      queryClient.removeQueries({
        queryKey: topicKeys.detail(deletedTopicId),
      });

      // Clear active topic if it was deleted
      dispatch(setActiveTopic(null));
    },
  });
}
