-- =====================================================================
-- MIGRATION 02: Talep iptali
-- Kullanıcı, henüz onaylanmamış (beklemede olan) talebini iptal edebilir.
-- =====================================================================

drop policy if exists "Kullanıcı bekleyen talebini iptal edebilir" on public.purchases;

create policy "Kullanıcı bekleyen talebini iptal edebilir"
  on public.purchases for delete
  using (auth.uid() = user_id and status = 'pending');
