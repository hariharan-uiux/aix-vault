export const supabaseEnv = {
  url: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
  anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
  serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
};

export function hasSupabaseConfig() {
  return Boolean(supabaseEnv.url && supabaseEnv.anonKey);
}

export function hasSupabaseAdminConfig() {
  return Boolean(supabaseEnv.url && supabaseEnv.serviceRoleKey);
}
