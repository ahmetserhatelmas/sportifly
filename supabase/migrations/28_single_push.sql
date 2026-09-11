-- Mesaj bildirimi sadece uygulamadan gitsin (çift bildirim bitsin).
-- Takip/beğeni/yorum push'u da tetikleyiciden gitmesin; istemci yollar.

create or replace function public.notify_dm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

create or replace function public.push_social(
  p_user_id uuid,
  p_from_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_from_id is null or p_user_id = p_from_id then
    return;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = p_user_id and blocked_id = p_from_id)
       or (blocker_id = p_from_id and blocked_id = p_user_id)
  ) then
    return;
  end if;

  insert into public.notifications (user_id, type, title, body, post_id, from_user_id)
  values (p_user_id, p_type, p_title, p_body, p_post_id, p_from_id);
end;
$$;
