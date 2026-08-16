-- =====================================================================
-- MIGRATION 03: Gönderi düzenleme
-- Kullanıcının kendi gönderisinin açıklamasını düzenleyebilmesi için
-- update politikası ekler.
-- =====================================================================

drop policy if exists "Kullanıcı kendi gönderisini güncelleyebilir" on public.posts;

create policy "Kullanıcı kendi gönderisini güncelleyebilir"
  on public.posts for update using (auth.uid() = user_id);
