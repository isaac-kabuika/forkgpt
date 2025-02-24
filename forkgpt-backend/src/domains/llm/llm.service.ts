import { EventBus } from "safe-event";
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
  LlmChunkGeneratedEventData,
} from "../../_generated/events/llm-events";
import { OpenAi } from "./openAi";

const MESSAGE_STREAM_RATE_MS = 50;

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
        let buffer = "";
        let timeoutId: NodeJS.Timeout | null = null;

        const emitBufferedChunk = (isFinal: boolean) => {
          if (buffer.length > 0) {
            EventBus.instance.emitEvent({
              event: llmEvents["llm.chunk.generated"],
              correlationId: llmResponseRequestedRequestorCorrelationId,
              data: LlmChunkGeneratedEventData.from({
                chunkContent: buffer,
                fullContent,
                isFinalChunk: isFinal,
              }),
            });
            buffer = "";
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
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
            buffer += chunkContent;
            const isFinalChunk = chunk.choices[0]?.finish_reason === "stop";

            if (!timeoutId) {
              timeoutId = setTimeout(() => {
                emitBufferedChunk(false);
              }, MESSAGE_STREAM_RATE_MS);
            }

            if (isFinalChunk) {
              emitBufferedChunk(true);
            }
          }
        }
        emitBufferedChunk(true);

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
