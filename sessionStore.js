import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error connecting to Supabase:", error.message);
      process.exit(1);
    }
    if (data.length === 0) {
      console.log("Supabase connection successful, but no data found.");
    } else {
      console.log("Supabase connection successful, data found.");
    }
  } catch (err) {
    console.error("Supabase connection failed:", err.message);
    process.exit(1);
  }
}

await testSupabaseConnection();
export class SupabaseStore {
  constructor() {
    this.table = "sessions";
    console.log("SupabaseStore initialized with table:", this.table);
    this.debug = true; // Enable verbose logging
  }

  log(message) {
    if (this.debug) console.log(`[SupabaseStore] ${message}`);
  }

  async sessionExists(options) {
    const sessionId = options.session || options.clientId;
    this.log(`Checking existence for: ${sessionId}`);

    try {
      const { data, error } = await supabase
        .from(this.table)
        .select("*")
        .eq("client_id", sessionId)
        .maybeSingle();

      if (error) throw error;
      this.log(`Session ${sessionId} exists: ${!!data}`);
      return !!data;
    } catch (error) {
      console.error("sessionExists error:", error);
      return false;
    }
  }

  async save(options) {
    const sessionId = options.session || options.clientId;
    this.log(`Saving session: ${sessionId}`);

    try {
      const { error } = await supabase.from(this.table).upsert(
        {
          client_id: sessionId,
          session_data: options.data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "client_id",
        }
      );

      if (error) throw error;
      this.log(`Session saved successfully: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("save error:", error);
      return false;
    }
  }

  async get(options) {
    const sessionId = options.session || options.clientId;
    this.log(`Retrieving session: ${sessionId}`);

    try {
      const { data, error } = await supabase
        .from(this.table)
        .select("session_data")
        .eq("client_id", sessionId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      this.log(`Session retrieved: ${sessionId}`, !!data);
      return data?.session_data || null;
    } catch (error) {
      console.error("get error:", error);
      return null;
    }
  }

  // Add this critical missing method
  async delete(options) {
    const sessionId = options.session || options.clientId;
    this.log(`Deleting session: ${sessionId}`);

    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq("client_id", sessionId);

      if (error) throw error;
      this.log(`Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("delete error:", error);
      return false;
    }
  }
}
