/** Statik `process.env.X` Next derlemesinde boş kalabiliyor; köşeli parantez runtime'da okur. */
function env(name: string) {
  return process.env[name] ?? "";
}

export function publicSupabaseUrl() {
  return env("NEXT_PUBLIC_SUPABASE_URL") || env("EXPO_PUBLIC_SUPABASE_URL");
}

export function publicSupabaseKey() {
  return (
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    env("EXPO_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function hasPublicSupabaseEnv() {
  return Boolean(publicSupabaseUrl() && publicSupabaseKey());
}
