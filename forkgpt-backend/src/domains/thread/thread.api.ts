import { Application, Request, Response } from "express";
import { ThreadService } from "./thread.service";
import { SupabaseThreadRepository } from "./thread.repository.supabase";
import { EventBus } from "safe-event";
import {
  threadEvents,
  ThreadListFetchedEventData,
  ThreadCreatedEventData,
  ThreadUpdatedEventData,
  ThreadMessagesFetchedEventData,
  ThreadDeleteEventData,
  ThreadListRequestedEventData,
  ThreadMessagesRequestedEventData,
  ThreadCreateEventData,
  ThreadUpdateEventData,
} from "../../_generated/events/thread-events";
import { ThreadError, ThreadErrorCode } from "./thread.types";
import * as ApiType from "forkgpt-api-types";
import {
  MessageAiResponsePartialMessageEventData,
  MessageCreatedEventData,
  messageEvents,
} from "../../_generated/events/message-events";
import { randomUUID } from "crypto";
import { AblyService } from "../../ably/ably";

let threadService: ThreadService;

export function initThreadApi(app: Application) {
  // Initialize service
  threadService = new ThreadService(new SupabaseThreadRepository());
  threadService.init();

  // List threads
  app.get(
    "/api/topics/:topicId/threads",
    async (req: Request, res: Response) => {
      try {
        EventBus.instance.onceEvent({
          event: threadEvents["thread.list.fetched"],
          correlationId: req.user.id,
          callback: (data: ThreadListFetchedEventData) => {
            const response: ApiType.ThreadListResponse = {
              threads: data.payload.threads.map((thread) => ({
                ...thread,
                rank: thread.rank,
                createdAt: new Date(thread.createdAt),
                updatedAt: new Date(thread.updatedAt),
              })),
            };
            res.json(response);
          },
        });

        EventBus.instance.emitEvent({
          event: threadEvents["thread.list.requested"],
          correlationId: req.user.id,
          data: ThreadListRequestedEventData.from({
            topicId: req.params.topicId,
            userId: req.user.id,
            accessToken: req.user.accessToken,
          }),
        });
      } catch (error) {
        handleError(error, res);
      }
    }
  );

  // Get thread
  app.get("/api/threads/:id", async (req: Request, res: Response) => {
    try {
      const thread = await threadService.getThread(
        req.user.accessToken,
        req.params.id
      );

      if (!thread) {
        throw new ThreadError(
          ThreadErrorCode.THREAD_NOT_FOUND,
          "Thread not found"
        );
      }

      const response: ApiType.ThreadResponse = {
        thread: {
          ...thread,
          rank: thread.rank,
        },
      };
      res.json(response);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get thread with messages
  app.get("/api/threads/:id/messages", async (req: Request, res: Response) => {
    try {
      EventBus.instance.onceEvent({
        event: threadEvents["thread.messages.fetched"],
        correlationId: req.user.id,
        callback: (data: ThreadMessagesFetchedEventData) => {
          const response: ApiType.ThreadWithMessages = {
            thread: {
              id: data.payload.thread.id,
              topicId: data.payload.thread.topicId,
              name: data.payload.thread.name,
              leafMessageId: data.payload.thread.leafMessageId,
              userId: data.payload.thread.userId,
              rank: data.payload.thread.rank,
              createdAt: new Date(data.payload.thread.createdAt),
              updatedAt: new Date(data.payload.thread.updatedAt),
            },
            messages: data.payload.messages.map((message) => ({
              id: message.id,
              content: message.content,
              role: message.role,
              parentId: message.parentId,
              topicId: message.topicId,
              userId: message.userId,
              createdAt: new Date(message.createdAt),
              updatedAt: new Date(message.updatedAt),
            })),
          };
          res.json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: threadEvents["thread.messages.requested"],
        correlationId: req.user.id,
        data: ThreadMessagesRequestedEventData.from({
          threadId: req.params.id,
          userId: req.user.id,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Create thread
  app.post(
    "/api/topics/:topicId/threads",
    async (req: Request, res: Response) => {
      try {
        const createData = ApiType.createThreadRequestSchema.parse(req.body);
        createData.id = createData.id ?? randomUUID();

        const requestorCorrelationId = randomUUID();

        EventBus.instance.onceEvent({
          event: threadEvents["thread.created"],
          correlationId: requestorCorrelationId,
          callback: (data: ThreadCreatedEventData) => {
            const response: ApiType.ThreadResponse = {
              thread: {
                id: data.payload.id,
                topicId: data.payload.topicId,
                name: data.payload.name,
                leafMessageId: data.payload.leafMessageId,
                userId: data.payload.userId,
                rank: data.payload.rank,
                createdAt: new Date(data.payload.createdAt),
                updatedAt: new Date(data.payload.createdAt),
              },
            };
            res.status(201).json(response);
          },
        });

        EventBus.instance.onceEvent({
          event: threadEvents["thread.updated"],
          correlationId: requestorCorrelationId,
          callback: async (data: ThreadUpdatedEventData) => {
            const thread = await threadService.getThread(
              req.user.accessToken,
              data.payload.id
            );
            if (!thread) {
              console.error(
                `Failed to update the thread name: id ${data.payload.id} not found.`
              );
              return;
            }
            AblyService.emitToClient({
              userId: req.user.id,
              eventName: ApiType.ably.EventName.THREAD_UPDATED,
              data: ApiType.ably.threadUpdatedSchema.parse({
                thread: {
                  id: data.payload.id,
                  topicId: thread.topicId,
                  name: data.payload.name,
                  leafMessageId: thread.leafMessageId,
                  userId: data.payload.userId,
                  rank: data.payload.rank,
                  createdAt: thread.createdAt,
                  updatedAt: new Date(),
                },
              } as ApiType.ably.ThreadUpdated),
            });
          },
        });

        const aiResponseChunkListener = EventBus.instance.onEvent({
          event: messageEvents["message.aiResponse.partialMessage"],
          correlationId: requestorCorrelationId,
          callback: (data: MessageAiResponsePartialMessageEventData) => {
            AblyService.emitToClient({
              userId: req.user.id,
              eventName: ApiType.ably.EventName.MESSAGE_UPDATED,
              data: ApiType.ably.messageUpdatedSchema.parse({
                message: {
                  ...data.payload,
                  createdAt: new Date(data.payload.createdAt),
                  updatedAt: new Date(data.payload.updatedAt),
                },
                threadId: createData.id,
              } as ApiType.ably.MessageUpdated),
            });
            if (data.payload.isFinalMessage) {
              aiResponseChunkListener.destroy();
            }
          },
        });

        EventBus.instance.onceEvent({
          event: messageEvents["message.created"],
          correlationId: requestorCorrelationId,
          callback: (data: MessageCreatedEventData) => {
            AblyService.emitToClient({
              userId: req.user.id,
              eventName: ApiType.ably.EventName.MESSAGE_UPDATED,
              data: ApiType.ably.messageUpdatedSchema.parse({
                message: {
                  ...data.payload,
                  createdAt: new Date(data.payload.createdAt),
                  updatedAt: new Date(data.payload.createdAt),
                },
                threadId: createData.id,
              } as ApiType.ably.MessageUpdated),
            });
          },
        });

        EventBus.instance.emitEvent({
          event: threadEvents["thread.create"],
          correlationId: requestorCorrelationId,
          data: ThreadCreateEventData.from({
            ...createData,
            topicId: req.params.topicId,
            userId: req.user.id,
            accessToken: req.user.accessToken,
          }),
        });
      } catch (error) {
        handleError(error, res);
      }
    }
  );

  // Update thread
  app.patch("/api/threads/:id", async (req: Request, res: Response) => {
    try {
      const updateData = ApiType.updateThreadRequestSchema.parse(req.body);
      const thread = await threadService.getThread(
        req.user.accessToken,
        req.params.id
      );

      if (!thread) {
        throw new ThreadError(
          ThreadErrorCode.THREAD_NOT_FOUND,
          "Thread not found"
        );
      }

      if (thread.userId !== req.user.id) {
        throw new ThreadError(ThreadErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: threadEvents["thread.updated"],
        correlationId: req.user.id,
        callback: (data: ThreadUpdatedEventData) => {
          const response: ApiType.ThreadResponse = {
            thread: {
              id: data.payload.id,
              topicId: thread.topicId,
              name: data.payload.name,
              leafMessageId: thread.leafMessageId,
              userId: data.payload.userId,
              rank: data.payload.rank,
              createdAt: thread.createdAt,
              updatedAt: new Date(),
            },
          };
          res.json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: threadEvents["thread.update"],
        correlationId: req.user.id,
        data: ThreadUpdateEventData.from({
          id: req.params.id,
          name: updateData.name,
          rank: updateData.rank,
          leftThreadId: updateData.leftThreadId,
          rightThreadId: updateData.rightThreadId,
          userId: req.user.id,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Delete thread
  app.delete("/api/threads/:id", async (req: Request, res: Response) => {
    try {
      const thread = await threadService.getThread(
        req.user.accessToken,
        req.params.id
      );

      if (!thread) {
        throw new ThreadError(
          ThreadErrorCode.THREAD_NOT_FOUND,
          "Thread not found"
        );
      }

      if (thread.userId !== req.user.id) {
        throw new ThreadError(ThreadErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: threadEvents["thread.deleted"],
        correlationId: req.user.id,
        callback: () => {
          res.status(204).send();
        },
      });

      EventBus.instance.emitEvent({
        event: threadEvents["thread.delete"],
        correlationId: req.user.id,
        data: ThreadDeleteEventData.from({
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
  if (error instanceof ThreadError) {
    res.status(400).json({ error: error.message, code: error.code });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
