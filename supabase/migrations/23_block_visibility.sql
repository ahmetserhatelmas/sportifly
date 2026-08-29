-- Engelleme: karşılıklı takip bitsin, içerik ve sohbet gizlensin

create or replace function public.blocked_with(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.on_block_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);

  insert into public.chat_hides (user_id, partner_id)
  values (new.blocker_id, new.blocked_id), (new.blocked_id, new.blocker_id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists blocks_apply_effects on public.blocks;
create trigger blocks_apply_effects
  after insert on public.blocks
  for each row
  execute function public.on_block_insert();

delete from public.follows f
where exists (
  select 1 from public.blocks b
  where (b.blocker_id = f.follower_id and b.blocked_id = f.following_id)
     or (b.blocker_id = f.following_id and b.blocked_id = f.follower_id)
);

insert into public.chat_hides (user_id, partner_id)
select blocker_id, blocked_id from public.blocks
union
select blocked_id, blocker_id from public.blocks
on conflict do nothing;

drop policy if exists "Profiller herkes tarafından okunabilir" on public.profiles;
create policy "Profiller herkes tarafından okunabilir"
  on public.profiles for select
  using (
    auth.uid() is null
    or auth.uid() = id
    or not exists (
      select 1 from public.blocks
      where blocker_id = profiles.id and blocked_id = auth.uid()
    )
  );

drop policy if exists "Kullanıcı takip edebilir" on public.follows;
create policy "Kullanıcı takip edebilir"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and not public.blocked_with(auth.uid(), following_id)
  );

drop policy if exists "Gönderiler herkes tarafından okunabilir" on public.posts;
create policy "Gönderiler herkes tarafından okunabilir"
  on public.posts for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "Yorumlar herkes tarafından okunabilir" on public.post_comments;
create policy "Yorumlar herkes tarafından okunabilir"
  on public.post_comments for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "İlanlar herkes tarafından okunabilir" on public.listings;
create policy "İlanlar herkes tarafından okunabilir"
  on public.listings for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), owner_id));

drop policy if exists "Değerlendirmeler herkes tarafından okunabilir" on public.listing_reviews;
create policy "Değerlendirmeler herkes tarafından okunabilir"
  on public.listing_reviews for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "Düellolar herkes tarafından okunabilir" on public.duels;
create policy "Düellolar herkes tarafından okunabilir"
  on public.duels for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), creator_id));

drop policy if exists "Kullanıcı düelloya katılabilir" on public.duel_participants;
create policy "Kullanıcı düelloya katılabilir"
  on public.duel_participants for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.duels d
      where d.id = duel_id and public.blocked_with(auth.uid(), d.creator_id)
    )
  );

drop policy if exists "Katılımcılar düello mesajlarını okuyabilir" on public.duel_messages;
create policy "Katılımcılar düello mesajlarını okuyabilir"
  on public.duel_messages for select
  using (
    exists (
      select 1 from public.duel_participants dp
      where dp.duel_id = duel_messages.duel_id and dp.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.duels d
      where d.id = duel_messages.duel_id and public.blocked_with(auth.uid(), d.creator_id)
    )
    and (
      user_id = auth.uid()
      or not public.blocked_with(auth.uid(), user_id)
    )
  );

drop policy if exists "Kullanıcı kendi mesajlaşmalarını görebilir" on public.direct_messages;
create policy "Kullanıcı kendi mesajlaşmalarını görebilir"
  on public.direct_messages for select
  using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and not public.blocked_with(
      auth.uid(),
      case when auth.uid() = sender_id then receiver_id else sender_id end
    )
  );
