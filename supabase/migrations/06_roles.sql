-- Saha sahibi / eğitmen rolleri + başvuru tablosu + ilan RLS.

alter table public.profiles
  add column if not exists is_field_owner boolean not null default false;

alter table public.profiles
  add column if not exists is_instructor boolean not null default false;

-- Kullanıcı kendi rol bayraklarını değiştiremesin.
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and auth.uid() = new.id then
    if new.is_field_owner is distinct from old.is_field_owner
       or new.is_instructor is distinct from old.is_instructor then
      raise exception 'Rol alanları yalnızca yönetici tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('field_owner', 'instructor')),
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists role_requests_one_pending
  on public.role_requests (user_id, role)
  where status = 'pending';

alter table public.role_requests enable row level security;

drop policy if exists "Kullanıcı kendi rol başvurularını görebilir" on public.role_requests;
create policy "Kullanıcı kendi rol başvurularını görebilir"
  on public.role_requests for select using (auth.uid() = user_id);

drop policy if exists "Kullanıcı rol başvurusu gönderebilir" on public.role_requests;
create policy "Kullanıcı rol başvurusu gönderebilir"
  on public.role_requests for insert
  with check (auth.uid() = user_id and status = 'pending');

-- İlan oluşturma: saha için saha sahibi, ders için eğitmen gerekli.
drop policy if exists "Kullanıcı ilan oluşturabilir (komisyon onayı zorunlu)" on public.listings;
drop policy if exists "Yetkili kullanıcı ilan oluşturabilir" on public.listings;
create policy "Yetkili kullanıcı ilan oluşturabilir"
  on public.listings for insert
  with check (
    auth.uid() = owner_id
    and commission_accepted = true
    and (
      (type = 'field' and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_field_owner = true
      ))
      or
      (type = 'lesson' and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_instructor = true
      ))
    )
  );

-- Demo seed kullanıcılarına yetki (mevcut ilan sahipleri bozulmasın).
update public.profiles set is_field_owner = true
where id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);

update public.profiles set is_instructor = true
where id in (
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);

-- =====================================================================
-- YÖNETİCİ: Başvuruyu onaylamak için SQL Editor'da örnek:
--
-- update public.profiles
-- set is_field_owner = true   -- veya is_instructor = true
-- where username = 'kullanici_adi';
--
-- update public.role_requests
-- set status = 'accepted'
-- where user_id = (select id from public.profiles where username = 'kullanici_adi')
--   and role = 'field_owner'   -- veya 'instructor'
--   and status = 'pending';
-- =====================================================================
