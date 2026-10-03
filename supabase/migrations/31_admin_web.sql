-- Web admin paneli: ban, dizin, bayrak RPC ve admin RLS.

alter table public.profiles
  add column if not exists is_banned boolean not null default false;

create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and auth.uid() = new.id then
    if new.is_field_owner is distinct from old.is_field_owner
      or new.is_instructor is distinct from old.is_instructor
      or new.is_admin is distinct from old.is_admin
      or new.is_banned is distinct from old.is_banned then
      raise exception 'Rol alanları yalnızca yönetici tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.admin_user_directory()
returns table (
  id uuid,
  email text,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  is_field_owner boolean,
  is_instructor boolean,
  is_admin boolean,
  is_banned boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_field_owner,
    p.is_instructor,
    p.is_admin,
    p.is_banned,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_current_user_admin();
$$;

create or replace function public.admin_set_user_flags(
  p_user_id uuid,
  p_is_field_owner boolean default null,
  p_is_instructor boolean default null,
  p_is_banned boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli';
  end if;

  if p_user_id = auth.uid() and p_is_banned is true then
    raise exception 'Kendi hesabını yasaklayamazsın';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id and is_admin = true)
     and p_is_banned is true then
    raise exception 'Admin hesap yasaklanamaz';
  end if;

  update public.profiles
  set
    is_field_owner = coalesce(p_is_field_owner, is_field_owner),
    is_instructor = coalesce(p_is_instructor, is_instructor),
    is_banned = coalesce(p_is_banned, is_banned)
  where id = p_user_id;

  if not found then
    raise exception 'Kullanıcı bulunamadı';
  end if;
end;
$$;

grant execute on function public.admin_user_directory() to authenticated;
grant execute on function public.admin_set_user_flags(uuid, boolean, boolean, boolean) to authenticated;

drop policy if exists "Adminler tüm satın almaları görür" on public.purchases;
create policy "Adminler tüm satın almaları görür"
  on public.purchases for select
  using (public.is_current_user_admin());

drop policy if exists "Adminler satın alma günceller" on public.purchases;
create policy "Adminler satın alma günceller"
  on public.purchases for update
  using (public.is_current_user_admin());

drop policy if exists "Adminler tüm raporları görür" on public.reports;
create policy "Adminler tüm raporları görür"
  on public.reports for select
  using (public.is_current_user_admin());

drop policy if exists "Adminler tüm destek mesajlarını görür" on public.support_messages;
create policy "Adminler tüm destek mesajlarını görür"
  on public.support_messages for select
  using (public.is_current_user_admin());

drop policy if exists "Admin destek yanıtı yazar" on public.support_messages;
create policy "Admin destek yanıtı yazar"
  on public.support_messages for insert
  with check (public.is_current_user_admin() and is_from_support = true);

drop policy if exists "Admin gönderi siler" on public.posts;
create policy "Admin gönderi siler"
  on public.posts for delete
  using (public.is_current_user_admin());

drop policy if exists "Admin yorum siler" on public.post_comments;
create policy "Admin yorum siler"
  on public.post_comments for delete
  using (public.is_current_user_admin());

drop policy if exists "Admin ilan siler" on public.listings;
create policy "Admin ilan siler"
  on public.listings for delete
  using (public.is_current_user_admin());

drop policy if exists "Admin ilan günceller" on public.listings;
create policy "Admin ilan günceller"
  on public.listings for update
  using (public.is_current_user_admin());

drop policy if exists "Admin değerlendirme siler" on public.listing_reviews;
create policy "Admin değerlendirme siler"
  on public.listing_reviews for delete
  using (public.is_current_user_admin());

drop policy if exists "Admin düello siler" on public.duels;
create policy "Admin düello siler"
  on public.duels for delete
  using (public.is_current_user_admin());
