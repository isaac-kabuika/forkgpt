import { Supabase } from "../../supabase/supabase";
import { Topic, TopicError, TopicErrorCode } from "./topic.types";
import { TopicRepository } from "./topic.repository";
import { Tables } from "../../_generated/database/database.types";

export class SupabaseTopicRepository implements TopicRepository {
  async createTopic(args: {
    accessToken: string;
    userId: string;
    title: string;
  }): Promise<Topic> {
    const { accessToken, userId, title } = args;
    const { data, error } = await Supabase.client
      .from("topics")
      .insert([{ user_id: userId, title }] as Tables<"topics">[])
      .select()
      .single()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new TopicError(TopicErrorCode.DATABASE_ERROR, error.message);
    }

    return this.mapDbTopicToDomain(data as Tables<"topics">);
  }

  async getTopic(args: {
    accessToken: string;
    topicId: string;
  }): Promise<Topic | null> {
    const { accessToken, topicId } = args;
    const { data, error } = await Supabase.client
      .from("topics")
      .select()
      .eq("id", topicId)
      .single<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new TopicError(TopicErrorCode.DATABASE_ERROR, error.message);
    }

    return this.mapDbTopicToDomain(data);
  }

  async updateTopic(args: {
    accessToken: string;
    topicId: string;
    title: string;
  }): Promise<Topic> {
    const { accessToken, topicId, title } = args;
    const { data, error } = await Supabase.client
      .from("topics")
      .update({ title })
      .eq("id", topicId)
      .select()
      .single<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new TopicError(TopicErrorCode.DATABASE_ERROR, error.message);
    }

    return this.mapDbTopicToDomain(data);
  }

  async deleteTopic(args: {
    accessToken: string;
    topicId: string;
  }): Promise<void> {
    const { accessToken, topicId } = args;
    const { error } = await Supabase.client
      .from("topics")
      .delete()
      .eq("id", topicId)
      .returns<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new TopicError(TopicErrorCode.DATABASE_ERROR, error.message);
    }
  }

  async listTopics(args: {
    accessToken: string;
    userId: string;
  }): Promise<Topic[]> {
    const { accessToken, userId } = args;
    const { data, error } = await Supabase.client
      .from("topics")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<Tables<"topics">[]>()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      throw new TopicError(TopicErrorCode.DATABASE_ERROR, error.message);
    }

    return data.map(this.mapDbTopicToDomain);
  }

  private mapDbTopicToDomain(data: Tables<"topics">): Topic {
    return {
      id: data.id,
      title: data.title,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
