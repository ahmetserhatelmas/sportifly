-- Takip, beğeni, yorum → telefon bildirimi

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
declare
  v_token text;
  v_enabled boolean;
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

  select expo_push_token, coalesce(push_enabled, true)
    into v_token, v_enabled
  from public.profiles
  where id = p_user_id;

  if coalesce(v_enabled, true) then
    perform public.try_send_expo_push(v_token, p_title, p_body);
  end if;
end;
$$;

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select coalesce(nullif(trim(full_name), ''), username) into v_name
  from public.profiles where id = new.follower_id;

  perform public.push_social(
    new.following_id,
    new.follower_id,
    'follow',
    'Yeni takipçi',
    coalesce(v_name, 'Birisi') || ' seni takip etmeye başladı'
  );
  return new;
end;
$$;

create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_name text;
begin
  select user_id into v_owner from public.posts where id = new.post_id;
  select coalesce(nullif(trim(full_name), ''), username) into v_name
  from public.profiles where id = new.user_id;

  perform public.push_social(
    v_owner,
    new.user_id,
    'like',
    'Yeni beğeni',
    coalesce(v_name, 'Birisi') || ' gönderini beğendi',
    new.post_id
  );
  return new;
end;
$$;

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_name text;
begin
  select user_id into v_owner from public.posts where id = new.post_id;
  select coalesce(nullif(trim(full_name), ''), username) into v_name
  from public.profiles where id = new.user_id;

  perform public.push_social(
    v_owner,
    new.user_id,
    'comment',
    'Yeni yorum',
    coalesce(v_name, 'Birisi') || ': ' || left(coalesce(new.content, ''), 80),
    new.post_id
  );
  return new;
end;
$$;

drop trigger if exists follows_notify on public.follows;
create trigger follows_notify
  after insert on public.follows
  for each row
  execute function public.notify_follow();

drop trigger if exists post_likes_notify on public.post_likes;
create trigger post_likes_notify
  after insert on public.post_likes
  for each row
  execute function public.notify_like();

drop trigger if exists post_comments_notify on public.post_comments;
create trigger post_comments_notify
  after insert on public.post_comments
  for each row
  execute function public.notify_comment();
