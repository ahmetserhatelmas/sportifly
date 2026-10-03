"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function loginAdmin(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Giriş başarısız. E-posta veya şifre yanlış." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açılamadı." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin || profile.is_banned) {
    await supabase.auth.signOut();
    return { error: "Bu hesap admin değil." };
  }

  redirect("/admin");
}
