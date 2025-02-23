import { EventBus } from "safe-event";
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
  LlmChunkGeneratedEventData,
} from "../../_generated/events/llm-events";
import { OpenAi } from "./openAi";

export class LlmService {
  private static instance: LlmService;
  static init() {
    if (!LlmService.instance) {
      LlmService.instance = new LlmService();
    }
  }

  private constructor() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    EventBus.instance.onEvent({
      event: llmEvents["llm.response.requested"],
      callback: async (
        event: LlmResponseRequestedEventData,
        llmResponseRequestedRequestorCorrelationId
      ) => {
        let fullContent = "";

        const stream = await OpenAi.client.chat.completions.create({
          model: event.payload.model ?? OpenAi.model,
          messages: event.payload.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
        });
        for await (const chunk of stream) {
          const chunkContent = chunk.choices[0]?.delta?.content || "";
          if (chunkContent) {
            fullContent += chunkContent;
            const isFinalChunk = chunk.choices[0]?.finish_reason === "stop";
            EventBus.instance.emitEvent({
              event: llmEvents["llm.chunk.generated"],
              correlationId: llmResponseRequestedRequestorCorrelationId,
              data: LlmChunkGeneratedEventData.from({
                chunkContent,
                fullContent,
                isFinalChunk,
              }),
            });
          }
        }
        EventBus.instance.emitEvent({
          event: llmEvents["llm.response.generated"],
          correlationId: llmResponseRequestedRequestorCorrelationId,
          data: LlmResponseGeneratedEventData.from({
            content: fullContent,
          }),
        });
      },
    });
  }
}
