import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasPublicSupabaseEnv, publicSupabaseKey, publicSupabaseUrl } from "@/lib/env";

export async function createServerSupabase() {
  if (!hasPublicSupabaseEnv()) {
    throw new Error("Supabase ortam değişkenleri eksik");
  }

  const cookieStore = await cookies();

  return createServerClient(publicSupabaseUrl(), publicSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component içinden cookie yazılamaz; proxy yeniler.
        }
      },
    },
  });
}
