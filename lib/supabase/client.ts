import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv, hasSupabaseConfig } from "./config";

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

let adminInstance: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseEnv.url || !supabaseEnv.serviceRoleKey) return null;
  if (!adminInstance) {
    adminInstance = createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminInstance;
}
