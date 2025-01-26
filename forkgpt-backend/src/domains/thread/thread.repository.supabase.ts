import { Supabase } from "../../../supabase/supabase";
import { Thread, ThreadError, ThreadErrorCode } from "./thread.types";
import { ThreadRepository } from "./thread.repository";
import { Message } from "../message/message.types";
import { Tables } from "../../_generated/database/database.types";

export class SupabaseThreadRepository implements ThreadRepository {
  async createThread(
    access_token: string,
    userId: string,
    topicId: string,
    name: string,
    leafMessageId: string | null
  ): Promise<Thread> {
    // If leafMessage is provided, verify it exists and belongs to this topic
    if (leafMessageId) {
      const { data: message, error: messageError } = await Supabase.client
        .from("messages")
        .select()
        .eq("id", leafMessageId)
        .eq("topic_id", topicId)
        .single<Tables<"messages">>()
        .setHeader("Authorization", `Bearer ${access_token}`);

      if (messageError || !message) {
        throw new ThreadError(
          ThreadErrorCode.INVALID_PARENT_MESSAGE,
          "Parent message not found or not accessible"
        );
      }
    }

    const { data, error } = await Supabase.client
      .from("threads")
      .insert([
        {
          topic_id: topicId,
          name,
          user_id: userId,
          leaf_message_id: leafMessageId,
        },
      ] as Tables<"threads">[])
      .select()
      .single()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to create thread"
      );
    }

    return this.mapDbThreadToDomain(data as Tables<"threads">);
  }

  async getThread(
    access_token: string,
    threadId: string
  ): Promise<Thread | null> {
    const { data, error } = await Supabase.client
      .from("threads")
      .select()
      .eq("id", threadId)
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to fetch thread"
      );
    }

    return this.mapDbThreadToDomain(data);
  }

  async getThreadMessages(
    access_token: string,
    threadId: string
  ): Promise<Message[]> {
    // First get the thread to find the leaf message
    const thread = await this.getThread(access_token, threadId);
    if (!thread || !thread.leafMessageId) {
      return [];
    }

    // Get all ancestor messages in a single query using recursive CTE
    const { data, error } = await Supabase.client
      .rpc("get_message_ancestors", {
        leaf_message_id: thread.leafMessageId,
      })
      .returns<Tables<"messages">[]>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to fetch messages"
      );
    }
    console.log(data);
    // Messages come ordered from root to leaf
    return data.map(this.mapDbMessageToDomain);
  }

  async listThreads(access_token: string, topicId: string): Promise<Thread[]> {
    const { data, error } = await Supabase.client
      .from("threads")
      .select()
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false })
      .returns<Tables<"threads">[]>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to list threads"
      );
    }

    return data.map(this.mapDbThreadToDomain);
  }

  async updateThread(
    access_token: string,
    threadId: string,
    name: string
  ): Promise<Thread> {
    const { data, error } = await Supabase.client
      .from("threads")
      .update({ name })
      .eq("id", threadId)
      .select()
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to update thread"
      );
    }

    return this.mapDbThreadToDomain(data);
  }

  async deleteThread(access_token: string, threadId: string): Promise<void> {
    const { error } = await Supabase.client
      .from("threads")
      .delete()
      .eq("id", threadId)
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to delete thread"
      );
    }
  }

  async updateThreadLeaf(
    access_token: string,
    threadId: string,
    messageId: string
  ): Promise<Thread> {
    const { data, error } = await Supabase.client
      .from("threads")
      .update({ leaf_message_id: messageId })
      .eq("id", threadId)
      .select()
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to update thread leaf"
      );
    }

    return this.mapDbThreadToDomain(data);
  }

  private mapDbThreadToDomain(data: Tables<"threads">): Thread {
    return {
      id: data.id,
      topicId: data.topic_id,
      name: data.name,
      leafMessageId: data.leaf_message_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
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
