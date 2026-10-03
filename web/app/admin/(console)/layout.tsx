import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/admin";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile } = await requireAdmin();
  const { count } = await supabase
    .from("role_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <AdminShell profile={profile} pendingRoles={count ?? 0}>
      {children}
    </AdminShell>
  );
}
