import { Supabase } from "../../supabase/supabase";
import { Thread, ThreadError, ThreadErrorCode } from "./thread.types";
import { ThreadRepository } from "./thread.repository";
import { Message } from "../message/message.types";
import { Tables } from "../../_generated/database/database.types";

export class SupabaseThreadRepository implements ThreadRepository {
  async createThread(args: {
    accessToken: string;
    id?: string;
    userId: string;
    topicId: string;
    name: string;
    leafMessageId: string | null;
    leftThreadId: string | null;
    rightThreadId: string | null;
  }): Promise<Thread> {
    const {
      accessToken,
      userId,
      topicId,
      name,
      leafMessageId,
      leftThreadId,
      rightThreadId,
    } = args;
    // Calculate new rank
    let newRank: number;
    if (leftThreadId && rightThreadId) {
      // Insert between threads
      const { data: threads, error: threadsError } = await Supabase.client
        .from("threads")
        .select("id,rank")
        .in("id", [leftThreadId, rightThreadId])
        .returns<Pick<Tables<"threads">, "id" | "rank">[]>()
        .setHeader("Authorization", `Bearer ${accessToken}`);

      if (threadsError || !threads || threads.length !== 2) {
        throw threadsError;
      }

      const leftRank = threads.find((t) => t.id === leftThreadId)?.rank;
      const rightRank = threads.find((t) => t.id === rightThreadId)?.rank;

      if (!leftRank || !rightRank) {
        throw threadsError;
      }

      newRank = (leftRank + rightRank) / 2;
    } else if (!leftThreadId && !rightThreadId) {
      // First thread in topic
      newRank = 1000;
    } else if (!rightThreadId) {
      // Append to end
      const { data: leftThread, error: leftError } = await Supabase.client
        .from("threads")
        .select("rank")
        .eq("id", leftThreadId)
        .single<Pick<Tables<"threads">, "rank">>()
        .setHeader("Authorization", `Bearer ${accessToken}`);

      if (leftError || !leftThread) {
        throw leftError;
      }
      newRank = leftThread.rank + 1000;
    } else {
      // !leftThreadId: Insert at start
      const { data: rightThread, error: rightError } = await Supabase.client
        .from("threads")
        .select("rank")
        .eq("id", rightThreadId)
        .single<Pick<Tables<"threads">, "rank">>()
        .setHeader("Authorization", `Bearer ${accessToken}`);

      if (rightError || !rightThread) {
        throw rightError;
      }
      newRank = rightThread.rank / 2;
    }

    const threadRowData = {
      topic_id: topicId,
      name,
      leaf_message_id: leafMessageId,
      user_id: userId,
      rank: newRank,
    };
    const { data, error } = await Supabase.client
      .from("threads")
      .insert([
        args.id ? { ...threadRowData, id: args.id } : threadRowData,
      ] satisfies (
        | Omit<Tables<"threads">, "id" | "created_at" | "updated_at">
        | Omit<Tables<"threads">, "created_at" | "updated_at">
      )[])
      .select()
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to create thread"
      );
    }

    return this.mapDbThreadToDomain(data);
  }

  async getThread(args: {
    accessToken: string;
    threadId: string;
  }): Promise<Thread | null> {
    const { accessToken, threadId } = args;
    const { data, error } = await Supabase.client
      .from("threads")
      .select()
      .eq("id", threadId)
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

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

  async getThreadMessages(args: {
    accessToken: string;
    threadId: string;
  }): Promise<Message[]> {
    const { accessToken, threadId } = args;
    // First get the thread to find the leaf message
    const thread = await this.getThread({ accessToken, threadId });
    if (!thread || !thread.leafMessageId) {
      return [];
    }

    // Get all ancestor messages in a single query using recursive CTE
    const { data, error } = await Supabase.client
      .rpc("get_message_ancestors", {
        leaf_message_id: thread.leafMessageId,
      })
      .returns<Tables<"messages">[]>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to fetch messages"
      );
    }
    // Messages come ordered from root to leaf
    return data.map(this.mapDbMessageToDomain);
  }

  async listThreads(args: {
    accessToken: string;
    topicId: string;
  }): Promise<Thread[]> {
    const { accessToken, topicId } = args;
    const { data, error } = await Supabase.client
      .from("threads")
      .select()
      .eq("topic_id", topicId)
      .order("rank", { ascending: true })
      .returns<Tables<"threads">[]>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to list threads"
      );
    }

    return data.map(this.mapDbThreadToDomain);
  }

  async updateThread(args: {
    accessToken: string;
    threadId: string;
    updates: {
      name?: string;
      rank?: number;
      leftThreadId?: string | null;
      rightThreadId?: string | null;
    };
  }): Promise<Thread> {
    const { accessToken, threadId, updates } = args;
    let newRank: number | undefined = updates.rank;

    // If we need to calculate a new rank based on adjacent threads
    if (
      updates.leftThreadId !== undefined ||
      updates.rightThreadId !== undefined
    ) {
      if (!updates.leftThreadId && !updates.rightThreadId) {
        newRank = 1000;
      } else if (!updates.rightThreadId) {
        const { data: leftThread, error: leftError } = await Supabase.client
          .from("threads")
          .select("rank")
          .eq("id", updates.leftThreadId)
          .single<Pick<Tables<"threads">, "rank">>()
          .setHeader("Authorization", `Bearer ${accessToken}`);

        if (leftError || !leftThread) {
          throw new ThreadError(
            ThreadErrorCode.THREAD_NOT_FOUND,
            "Left thread not found"
          );
        }
        newRank = leftThread.rank + 1000;
      } else if (!updates.leftThreadId) {
        const { data: rightThread, error: rightError } = await Supabase.client
          .from("threads")
          .select("rank")
          .eq("id", updates.rightThreadId)
          .single<Pick<Tables<"threads">, "rank">>()
          .setHeader("Authorization", `Bearer ${accessToken}`);

        if (rightError || !rightThread) {
          throw new ThreadError(
            ThreadErrorCode.THREAD_NOT_FOUND,
            "Right thread not found"
          );
        }
        newRank = rightThread.rank / 2;
      } else {
        const { data: threads, error: threadsError } = await Supabase.client
          .from("threads")
          .select("id,rank")
          .in("id", [updates.leftThreadId, updates.rightThreadId])
          .returns<Pick<Tables<"threads">, "id" | "rank">[]>()
          .setHeader("Authorization", `Bearer ${accessToken}`);

        if (threadsError || !threads || threads.length !== 2) {
          throw new ThreadError(
            ThreadErrorCode.THREAD_NOT_FOUND,
            "Adjacent threads not found"
          );
        }

        const leftRank = threads.find(
          (t) => t.id === updates.leftThreadId
        )?.rank;
        const rightRank = threads.find(
          (t) => t.id === updates.rightThreadId
        )?.rank;

        if (!leftRank || !rightRank) {
          throw new ThreadError(
            ThreadErrorCode.THREAD_NOT_FOUND,
            "Adjacent threads not found"
          );
        }

        newRank = (leftRank + rightRank) / 2;
      }
    }

    const updateData = {
      ...(updates.name && { name: updates.name }),
      ...(newRank !== undefined && { rank: newRank }),
    } satisfies Partial<Pick<Tables<"threads">, "name" | "rank">>;

    const { data, error } = await Supabase.client
      .from("threads")
      .update(updateData)
      .eq("id", threadId)
      .select()
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to update thread"
      );
    }

    return this.mapDbThreadToDomain(data);
  }

  async deleteThread(args: {
    accessToken: string;
    threadId: string;
  }): Promise<void> {
    const { accessToken, threadId } = args;
    const { error } = await Supabase.client
      .from("threads")
      .delete()
      .eq("id", threadId)
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new ThreadError(
        ThreadErrorCode.UNAUTHORIZED,
        "Failed to delete thread"
      );
    }
  }

  async updateThreadLeaf(args: {
    accessToken: string;
    threadId: string;
    messageId: string;
  }): Promise<Thread> {
    const { accessToken, threadId, messageId } = args;
    const { data, error } = await Supabase.client
      .from("threads")
      .update({ leaf_message_id: messageId })
      .eq("id", threadId)
      .select()
      .single<Tables<"threads">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

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
      rank: data.rank,
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
