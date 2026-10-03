import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseKey, publicSupabaseUrl } from "@/lib/env";

export function createBrowserSupabase() {
  return createBrowserClient(publicSupabaseUrl(), publicSupabaseKey());
}
