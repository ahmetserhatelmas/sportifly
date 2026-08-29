import { isDuelUpcoming } from './duelTime';
import { supabase } from './supabase';
import { Duel } from '../types';

export async function fetchUpcomingMatches(userId: string, blockedIds?: Set<string>): Promise<Duel[]> {
  const { data, error } = await supabase
    .from('duel_participants')
    .select('duels(*, profiles!duels_creator_id_fkey(*), duel_participants(user_id))')
    .eq('user_id', userId);

  if (error || !data) return [];

  return (data as { duels: any }[])
    .map((row) => (Array.isArray(row.duels) ? row.duels[0] : row.duels))
    .filter(Boolean)
    .filter((d) => isDuelUpcoming(d.match_date, d.start_time))
    .filter((d) => !blockedIds?.has(d.creator_id))
    .map((d) => ({
      ...d,
      participant_count: d.duel_participants?.length ?? 0,
      joined_by_me: true,
    }))
    .sort((a, b) => {
      const date = String(a.match_date).localeCompare(String(b.match_date));
      if (date !== 0) return date;
      return String(a.start_time).localeCompare(String(b.start_time));
    });
}
