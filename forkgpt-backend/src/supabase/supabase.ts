import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Using service key for admin operations

export class Supabase {
  private static _client: SupabaseClient;
  private constructor() {}

  static init() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    Supabase._client = createClient(supabaseUrl, supabaseKey);
  }

  static get client() {
    if (!Supabase._client) throw new Error("Supabase client not initialized");
    return Supabase._client;
  }
}
