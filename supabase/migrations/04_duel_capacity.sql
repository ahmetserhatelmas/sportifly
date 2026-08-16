-- Mevcut veritabanları için: düello kontenjan düzeltmesi.
-- 1) Kontenjanı aşan katılımcıları temizler (kurucu + en erken katılanlar kalır).
-- 2) Dolu düelloya yeni katılımcı eklenmesini veritabanı seviyesinde engeller.

-- 1. Fazla katılımcıları sil
delete from public.duel_participants dp
using (
  select t.duel_id, t.user_id
  from (
    select p.duel_id,
           p.user_id,
           row_number() over (
             partition by p.duel_id
             order by (p.user_id = d.creator_id) desc, p.joined_at
           ) as rn,
           d.max_players
    from public.duel_participants p
    join public.duels d on d.id = p.duel_id
  ) t
  where t.rn > t.max_players
) fazla
where dp.duel_id = fazla.duel_id and dp.user_id = fazla.user_id;

-- 2. Kontenjan tetikleyicisi
create or replace function public.check_duel_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Aynı düelloya eşzamanlı katılımları sıraya sokmak için satırı kilitle.
  perform 1 from public.duels where id = new.duel_id for update;

  if (select count(*) from public.duel_participants where duel_id = new.duel_id)
     >= (select max_players from public.duels where id = new.duel_id) then
    raise exception 'Düello kontenjanı dolu';
  end if;
  return new;
end;
$$;

drop trigger if exists duel_capacity_check on public.duel_participants;
create trigger duel_capacity_check
  before insert on public.duel_participants
  for each row execute function public.check_duel_capacity();
