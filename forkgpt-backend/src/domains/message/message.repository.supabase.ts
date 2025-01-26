import { Supabase } from "../../../supabase/supabase";
import { Message, MessageError, MessageErrorCode } from "./message.types";
import { MessageRepository } from "./message.repository";
import { Tables } from "../../_generated/database/database.types";

export class SupabaseMessageRepository implements MessageRepository {
  async createMessageWithThreadId(
    access_token: string,
    message: Omit<Message, "id" | "createdAt" | "updatedAt" | "parentId">,
    threadId: string | null
  ): Promise<Message> {
    const { data: threadData, error: threadError } = await Supabase.client
      .from("threads")
      .select()
      .eq("id", threadId)
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${access_token}`);
    if (threadError) throw threadError;
    return this.createMessage(access_token, {
      ...message,
      parentId: threadData?.leaf_message_id ?? null,
    });
  }
  async createMessage(
    access_token: string,
    message: Omit<Message, "id" | "createdAt" | "updatedAt">
  ): Promise<Message> {
    const { data, error } = await Supabase.client
      .from("messages")
      .insert([
        {
          content: message.content,
          role: message.role,
          parent_id: message.parentId,
          topic_id: message.topicId,
          user_id: message.userId,
        },
      ] as Tables<"messages">[])
      .select()
      .single<Tables<"messages">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new MessageError(
        MessageErrorCode.UNAUTHORIZED,
        "Failed to create message"
      );
    }

    return this.mapDbMessageToDomain(data);
  }

  async getMessage(
    access_token: string,
    messageId: string
  ): Promise<Message | null> {
    const { data, error } = await Supabase.client
      .from("messages")
      .select()
      .eq("id", messageId)
      .single<Tables<"messages">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new MessageError(
        MessageErrorCode.UNAUTHORIZED,
        "Failed to fetch message"
      );
    }

    return this.mapDbMessageToDomain(data);
  }

  async getMessagesByTopic(
    access_token: string,
    topicId: string
  ): Promise<Message[]> {
    const { data, error } = await Supabase.client
      .from("messages")
      .select()
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true })
      .returns<Tables<"messages">[]>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new MessageError(
        MessageErrorCode.UNAUTHORIZED,
        "Failed to fetch messages"
      );
    }

    return data.map(this.mapDbMessageToDomain);
  }

  async getThreadMessages(
    access_token: string,
    leafMessageId: string
  ): Promise<Message[]> {
    // Get all ancestor messages in a single query using recursive CTE
    const { data, error } = await Supabase.client
      .rpc("get_message_ancestors", {
        leaf_message_id: leafMessageId,
      })
      .returns<Tables<"messages">[]>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw error;
    }

    // Messages come ordered from root to leaf
    return data.map(this.mapDbMessageToDomain);
  }

  async updateMessage(
    access_token: string,
    messageId: string,
    content: string
  ): Promise<Message> {
    const { data, error } = await Supabase.client
      .from("messages")
      .update({ content })
      .eq("id", messageId)
      .select()
      .single<Tables<"messages">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new MessageError(
        MessageErrorCode.UNAUTHORIZED,
        "Failed to update message"
      );
    }

    return this.mapDbMessageToDomain(data);
  }

  async deleteMessage(access_token: string, messageId: string): Promise<void> {
    const { error } = await Supabase.client
      .from("messages")
      .delete()
      .eq("id", messageId)
      .returns<Tables<"messages">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new MessageError(
        MessageErrorCode.UNAUTHORIZED,
        "Failed to delete message"
      );
    }
  }

  private mapDbMessageToDomain(data: Tables<"messages">): Message {
    return {
      id: data.id,
      content: data.content,
      role: data.role as "user" | "assistant",
      parentId: data.parent_id,
      topicId: data.topic_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
