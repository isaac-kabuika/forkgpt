import { EventBus } from "safe-event";
import {
  llmEvents,
  LlmResponseGeneratedEventData,
  LlmResponseRequestedEventData,
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
        llmResponseRequestedCorrelationId
      ) => {
        const completion = await OpenAi.client.chat.completions.create({
          model: event.payload.model ?? OpenAi.model,
          messages: event.payload.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        });
        EventBus.instance.emitEvent({
          event: llmEvents["llm.response.generated"],
          correlationId: llmResponseRequestedCorrelationId,
          data: LlmResponseGeneratedEventData.from({
            content: completion.choices[0].message.content!,
          }),
        });
      },
    });
  }
}
