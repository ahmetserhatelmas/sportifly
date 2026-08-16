-- Rol başvurularına açıklama + ek dosya alanları.

alter table public.role_requests
  add column if not exists description text;

alter table public.role_requests
  add column if not exists attachment_url text;

alter table public.role_requests
  add column if not exists attachment_name text;

-- Eski "note" varsa description'a taşı (bir kez).
update public.role_requests
set description = note
where description is null and note is not null;

-- Başvuru belgeleri için storage klasörü (media bucket altında).
-- Ayrı bucket gerekmez; path: role-requests/<user_id>/...
