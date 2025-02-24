import Ably from "ably";
import * as Api from "forkgpt-api-types";

export class AblyService {
  private static _client: Ably.Rest;
  private constructor() {}

  static init() {
    const ablyKey = process.env.ABLY_API_KEY;
    if (!ablyKey) {
      throw new Error("Missing Ably API key environment variable");
    }
    AblyService._client = new Ably.Rest({ key: ablyKey });
  }

  static get client() {
    if (!AblyService._client) throw new Error("Ably client not initialized");
    return AblyService._client;
  }

  /**
   * Emits a message to a specific client via their user ID channel
   * @param args.userId The user ID to send to (used as the channel name)
   * @param args.eventName The event name to publish
   * @param args.message The message payload to send
   */
  static async emitToClient(args: {
    userId: string;
    eventName: Api.ably.EventName;
    data: Api.ably.MessageUpdated | Api.ably.ThreadUpdated;
  }) {
    // Create the channel if it doesn't exist, or get existing one
    const channel = this.client.channels.get(args.userId, {
      modes: ["publish"],
    });
    await channel.publish(args.eventName, args.data);
  }
}
