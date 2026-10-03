import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
};

export type AdminUser = {
  id: string;
  email: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_field_owner: boolean;
  is_instructor: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
};

export const PAGE_SIZE = 40;

export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, is_admin, is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin || profile.is_banned) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=yetkisiz");
  }

  return {
    supabase,
    user,
    profile: profile as AdminProfile,
    email: user.email ?? null,
  };
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatMoney(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function pageFromSearch(page?: string) {
  const n = Number(page ?? "1");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function rangeForPage(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}
