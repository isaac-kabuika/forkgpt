import { Supabase } from "../../../supabase/supabase";
import { Topic, TopicError, TopicErrorCode } from "./topic.types";
import { TopicRepository } from "./topic.repository";
import { Tables } from "../../_generated/database/database.types";

export class SupabaseTopicRepository implements TopicRepository {
  async createTopic(
    access_token: string,
    userId: string,
    title: string
  ): Promise<Topic> {
    const { data, error } = await Supabase.client
      .from("topics")
      .insert([{ user_id: userId, title }] as Tables<"topics">[])
      .select()
      .single()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      console.error(error);
      throw error;
    }

    return this.mapDbTopicToDomain(data as Tables<"topics">);
  }

  async getTopic(access_token: string, topicId: string): Promise<Topic | null> {
    const { data, error } = await Supabase.client
      .from("topics")
      .select()
      .eq("id", topicId)
      .single<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new TopicError(
        TopicErrorCode.UNAUTHORIZED,
        "Failed to fetch topic"
      );
    }

    return this.mapDbTopicToDomain(data);
  }

  async updateTopic(
    access_token: string,
    topicId: string,
    title: string
  ): Promise<Topic> {
    const { data, error } = await Supabase.client
      .from("topics")
      .update({ title })
      .eq("id", topicId)
      .select()
      .single<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new TopicError(
        TopicErrorCode.UNAUTHORIZED,
        "Failed to update topic"
      );
    }

    return this.mapDbTopicToDomain(data);
  }

  async deleteTopic(access_token: string, topicId: string): Promise<void> {
    const { error } = await Supabase.client
      .from("topics")
      .delete()
      .eq("id", topicId)
      .returns<Tables<"topics">>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new TopicError(
        TopicErrorCode.UNAUTHORIZED,
        "Failed to delete topic"
      );
    }
  }

  async listTopics(access_token: string, userId: string): Promise<Topic[]> {
    const { data, error } = await Supabase.client
      .from("topics")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<Tables<"topics">[]>()
      .setHeader("Authorization", `Bearer ${access_token}`);

    if (error) {
      throw new TopicError(
        TopicErrorCode.UNAUTHORIZED,
        "Failed to list topics"
      );
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
