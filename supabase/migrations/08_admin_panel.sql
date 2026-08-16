  -- Admin paneli: is_admin + başvuruları görme + onay/red RPC.

  alter table public.profiles
    add column if not exists is_admin boolean not null default false;

  -- is_admin de kullanıcı tarafından değiştirilemesin.
  create or replace function public.protect_profile_roles()
  returns trigger
  language plpgsql
  as $$
  begin
    if auth.uid() is not null and auth.uid() = new.id then
      if new.is_field_owner is distinct from old.is_field_owner
        or new.is_instructor is distinct from old.is_instructor
        or new.is_admin is distinct from old.is_admin then
        raise exception 'Rol alanları yalnızca yönetici tarafından değiştirilebilir';
      end if;
    end if;
    return new;
  end;
  $$;

  create or replace function public.is_current_user_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(
      (select p.is_admin from public.profiles p where p.id = auth.uid()),
      false
    );
  $$;

  drop policy if exists "Adminler tüm rol başvurularını görebilir" on public.role_requests;
  create policy "Adminler tüm rol başvurularını görebilir"
    on public.role_requests for select
    using (public.is_current_user_admin());

  -- Onay: rol bayrağını aç + başvuru status = accepted
  create or replace function public.admin_review_role_request(
    p_request_id uuid,
    p_decision text
  )
  returns void
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    req public.role_requests%rowtype;
  begin
    if not public.is_current_user_admin() then
      raise exception 'Bu işlem için admin yetkisi gerekli';
    end if;

    if p_decision not in ('accepted', 'rejected') then
      raise exception 'Geçersiz karar';
    end if;

    select * into req
    from public.role_requests
    where id = p_request_id
    for update;

    if not found then
      raise exception 'Başvuru bulunamadı';
    end if;

    if req.status <> 'pending' then
      raise exception 'Bu başvuru zaten sonuçlandırılmış';
    end if;

    update public.role_requests
    set status = p_decision
    where id = p_request_id;

    if p_decision = 'accepted' then
      if req.role = 'field_owner' then
        update public.profiles set is_field_owner = true where id = req.user_id;
      elsif req.role = 'instructor' then
        update public.profiles set is_instructor = true where id = req.user_id;
      end if;
    end if;
  end;
  $$;

  grant execute on function public.admin_review_role_request(uuid, text) to authenticated;
  grant execute on function public.is_current_user_admin() to authenticated;

  -- =====================================================================
  -- KENDİNİ ADMIN YAPMAK İÇİN (SQL Editor, bir kez):
  --
  -- update public.profiles
  -- set is_admin = true
  -- where username = 'SENIN_KULLANICI_ADIN';
  -- =====================================================================
