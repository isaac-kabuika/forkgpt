import { Application, Request, Response } from "express";
import { TopicService } from "./topic.service";
import { SupabaseTopicRepository } from "./topic.repository.supabase";
import { EventBus } from "safe-event";
import {
  topicEvents,
  TopicListFetchedEventData,
  TopicListRequestedEventData,
  TopicCreatedEventData,
  TopicCreateEventData,
  TopicDeleteEventData,
  TopicUpdateEventData,
} from "../../_generated/events/topic-events";
import { TopicError, TopicErrorCode } from "./topic.types";
import * as ApiType from "forkgpt-api-types";

let topicService: TopicService;

export function initTopicApi(app: Application) {
  // Initialize service
  topicService = new TopicService(new SupabaseTopicRepository());
  topicService.init();

  // List topics
  app.get("/api/topics", async (req: Request, res: Response) => {
    try {
      EventBus.instance.onceEvent({
        event: topicEvents["topic.list.fetched"],
        correlationId: req.user.id,
        callback: (data: TopicListFetchedEventData) => {
          const response: ApiType.TopicListResponse = {
            topics: data.payload.topics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              userId: data.payload.userId,
              createdAt: new Date(topic.createdAt),
              updatedAt: new Date(topic.updatedAt),
            })),
          };
          res.json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: topicEvents["topic.list.requested"],
        correlationId: req.user.id,
        data: TopicListRequestedEventData.from({
          userId: req.user.id,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Create topic
  app.post("/api/topics", async (req: Request, res: Response) => {
    try {
      const createData = ApiType.createTopicRequestSchema.parse(req.body);

      EventBus.instance.onceEvent({
        event: topicEvents["topic.created"],
        correlationId: req.user.id,
        callback: (data: TopicCreatedEventData) => {
          const response: ApiType.TopicResponse = {
            topic: {
              id: data.payload.id,
              title: data.payload.title,
              userId: data.payload.userId,
              createdAt: new Date(data.payload.createdAt),
              updatedAt: new Date(data.payload.createdAt), // New topics have same created/updated time
            },
          };
          res.status(201).json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: topicEvents["topic.create"],
        correlationId: req.user.id,
        data: TopicCreateEventData.from({
          accessToken: req.user.accessToken,
          userId: req.user.id,
          title: createData.title,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update topic
  app.patch("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const updateData = ApiType.updateTopicRequestSchema.parse(req.body);
      const topic = await topicService.getTopic(
        req.user.accessToken,
        req.params.id
      );

      if (!topic) {
        throw new TopicError(TopicErrorCode.TOPIC_NOT_FOUND, "Topic not found");
      }

      if (topic.userId !== req.user.id) {
        throw new TopicError(TopicErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: topicEvents["topic.updated"],
        correlationId: req.params.id,
        callback: (data) => {
          const response: ApiType.TopicResponse = {
            topic: {
              id: data.payload.id,
              title: data.payload.title,
              userId: data.payload.userId,
              createdAt: topic.createdAt, // Keep original creation time
              updatedAt: new Date(), // Update modification time
            },
          };
          res.json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: topicEvents["topic.update"],
        correlationId: req.params.id,
        data: TopicUpdateEventData.from({
          id: req.params.id,
          title: updateData.title,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Delete topic
  app.delete("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const topic = await topicService.getTopic(
        req.user.accessToken,
        req.params.id
      );

      if (!topic) {
        throw new TopicError(TopicErrorCode.TOPIC_NOT_FOUND, "Topic not found");
      }

      if (topic.userId !== req.user.id) {
        throw new TopicError(TopicErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: topicEvents["topic.deleted"],
        correlationId: req.user.id,
        callback: () => {
          res.status(204).send();
        },
      });

      EventBus.instance.emitEvent({
        event: topicEvents["topic.delete"],
        correlationId: req.user.id,
        data: TopicDeleteEventData.from({
          id: req.params.id,
          userId: req.user.id,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });
}

function handleError(error: unknown, res: Response) {
  console.error(error);
  if (error instanceof TopicError) {
    res.status(400).json({ error: error.message, code: error.code });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
