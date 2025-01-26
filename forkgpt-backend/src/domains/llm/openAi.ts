import OpenAiLib from "openai";

export class OpenAi {
  private static instance: OpenAiLib;
  static get client(): OpenAiLib {
    if (!OpenAi.instance) {
      OpenAi.instance = new OpenAiLib({
        apiKey: process.env.OPEN_AI_API_KEY!,
      });
    }
    return OpenAi.instance;
  }

  static get model(): string {
    return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  }

  private constructor() {}
}
