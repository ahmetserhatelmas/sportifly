"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

async function refresh(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function reviewRoleRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "accepted" && decision !== "rejected")) {
    throw new Error("Geçersiz başvuru işlemi");
  }
  const { error } = await supabase.rpc("admin_review_role_request", {
    p_request_id: id,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
  await refresh(["/admin", "/admin/basvurular", "/admin/kullanicilar"]);
}

export async function setUserFlags(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Kullanıcı yok");

  const boolOrNull = (key: string) => {
    const v = formData.get(key);
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  };

  const { error } = await supabase.rpc("admin_set_user_flags", {
    p_user_id: id,
    p_is_field_owner: boolOrNull("is_field_owner"),
    p_is_instructor: boolOrNull("is_instructor"),
    p_is_banned: boolOrNull("is_banned"),
  });
  if (error) throw new Error(error.message);
  await refresh(["/admin/kullanicilar", `/admin/kullanicilar/${id}`, "/admin"]);
}

export async function setPurchaseStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["pending", "accepted", "rejected"].includes(status)) {
    throw new Error("Geçersiz rezervasyon");
  }
  const { error } = await supabase.from("purchases").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await refresh(["/admin/rezervasyonlar", "/admin"]);
}

export async function deleteListing(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("İlan yok");
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await refresh(["/admin/ilanlar", "/admin"]);
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Gönderi yok");
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await refresh(["/admin/gonderiler", "/admin"]);
}

export async function deleteDuel(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Düello yok");
  const { error } = await supabase.from("duels").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await refresh(["/admin/duellolar", "/admin"]);
}

export async function replySupport(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!userId || !content) throw new Error("Mesaj boş");
  const { error } = await supabase.from("support_messages").insert({
    user_id: userId,
    content,
    is_from_support: true,
  });
  if (error) throw new Error(error.message);
  await refresh(["/admin/destek", `/admin/destek/${userId}`]);
}
