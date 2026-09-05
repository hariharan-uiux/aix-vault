export const supabaseEnv = {
  get url() {
    return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  },
  get anonKey() {
    return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  },
  get serviceRoleKey() {
    return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  },
};

export function hasSupabaseConfig() {
  return Boolean(supabaseEnv.url && supabaseEnv.anonKey);
}
