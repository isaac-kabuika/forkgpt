import { Application, Request, Response } from "express";
import { MessageService } from "./message.service";
import { SupabaseMessageRepository } from "./message.repository.supabase";
import { EventBus } from "safe-event";
import {
  messageEvents,
  MessageListFetchedEventData,
  MessageCreatedEventData,
  MessageUpdatedEventData,
  MessageListRequestedEventData,
  MessageCreateEventData,
  MessageUpdateEventData,
  MessageDeleteEventData,
} from "../../_generated/events/message-events";
import { MessageError, MessageErrorCode } from "./message.types";
import * as ApiType from "forkgpt-api-types";
import { randomUUID } from "crypto";

let messageService: MessageService;

export function initMessageApi(app: Application) {
  // Initialize service
  messageService = new MessageService(new SupabaseMessageRepository());
  messageService.init();

  // List messages
  app.get(
    "/api/topics/:topicId/messages",
    async (req: Request, res: Response) => {
      try {
        EventBus.instance.onceEvent({
          event: messageEvents["message.list.fetched"],
          correlationId: req.user.id,
          callback: (data: MessageListFetchedEventData) => {
            const response: ApiType.MessageListResponse = {
              messages: data.payload.messages.map((message) => ({
                id: message.id,
                content: message.content,
                role: message.role,
                parentId: message.parentId,
                topicId: data.payload.topicId,
                userId: req.user.id,
                createdAt: new Date(message.createdAt),
                updatedAt: new Date(message.updatedAt),
              })),
            };
            res.json(response);
          },
        });

        EventBus.instance.emitEvent({
          event: messageEvents["message.list.requested"],
          correlationId: req.user.id,
          data: MessageListRequestedEventData.from({
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

  // Create message
  app.post(
    "/api/topics/:topicId/messages",
    async (req: Request, res: Response) => {
      try {
        const createData = ApiType.createMessageRequestSchema.parse(req.body);

        const requestorCorrelationId = randomUUID();
        EventBus.instance.onceEvent({
          event: messageEvents["message.created"],
          correlationId: requestorCorrelationId,
          callback: (data: MessageCreatedEventData) => {
            const response: ApiType.MessageResponse = {
              message: {
                id: data.payload.id,
                content: data.payload.content,
                role: data.payload.role,
                parentId: data.payload.parentId,
                topicId: data.payload.topicId,
                userId: data.payload.userId,
                createdAt: new Date(data.payload.createdAt),
                updatedAt: new Date(data.payload.createdAt),
              },
            };
            res.status(201).json(response);
          },
        });

        EventBus.instance.emitEvent({
          event: messageEvents["message.create"],
          correlationId: requestorCorrelationId,
          data: MessageCreateEventData.from({
            content: createData.content,
            role: "user",
            threadId: createData.threadId,
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

  // Update message
  app.patch("/api/messages/:id", async (req: Request, res: Response) => {
    try {
      const updateData = ApiType.updateMessageRequestSchema.parse(req.body);
      const message = await messageService.getMessage(
        req.user.accessToken,
        req.params.id
      );

      if (!message) {
        throw new MessageError(
          MessageErrorCode.MESSAGE_NOT_FOUND,
          "Message not found"
        );
      }

      if (message.userId !== req.user.id) {
        throw new MessageError(MessageErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: messageEvents["message.updated"],
        correlationId: req.user.id,
        callback: (data: MessageUpdatedEventData) => {
          const response: ApiType.MessageResponse = {
            message: {
              id: data.payload.id,
              content: data.payload.content,
              role: message.role,
              parentId: message.parentId,
              topicId: message.topicId,
              userId: message.userId,
              createdAt: message.createdAt,
              updatedAt: new Date(),
            },
          };
          res.json(response);
        },
      });

      EventBus.instance.emitEvent({
        event: messageEvents["message.update"],
        correlationId: req.user.id,
        data: MessageUpdateEventData.from({
          id: req.params.id,
          content: updateData.content,
          userId: req.user.id,
          accessToken: req.user.accessToken,
        }),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Delete message
  app.delete("/api/messages/:id", async (req: Request, res: Response) => {
    try {
      const message = await messageService.getMessage(
        req.user.accessToken,
        req.params.id
      );

      if (!message) {
        throw new MessageError(
          MessageErrorCode.MESSAGE_NOT_FOUND,
          "Message not found"
        );
      }

      if (message.userId !== req.user.id) {
        throw new MessageError(MessageErrorCode.UNAUTHORIZED, "Unauthorized");
      }

      EventBus.instance.onceEvent({
        event: messageEvents["message.deleted"],
        correlationId: req.user.id,
        callback: () => {
          res.status(204).send();
        },
      });

      EventBus.instance.emitEvent({
        event: messageEvents["message.delete"],
        correlationId: req.user.id,
        data: MessageDeleteEventData.from({
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
  if (error instanceof MessageError) {
    res.status(400).json({ error: error.message, code: error.code });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
}
