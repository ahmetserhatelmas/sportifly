import { supabase } from './supabase';

export async function fetchMutedPartners(userId: string) {
  const { data, error } = await supabase
    .from('chat_mutes')
    .select('partner_id')
    .eq('user_id', userId);
  if (error) return new Set<string>();
  return new Set(((data as { partner_id: string }[]) ?? []).map((r) => r.partner_id));
}

export async function muteConversation(userId: string, partnerId: string) {
  return supabase.from('chat_mutes').upsert({ user_id: userId, partner_id: partnerId });
}

export async function unmuteConversation(userId: string, partnerId: string) {
  return supabase.from('chat_mutes').delete().match({ user_id: userId, partner_id: partnerId });
}

export async function countVisibleUnread(userId: string) {
  const [{ data: unread }, hides, mutes, blocked] = await Promise.all([
    supabase
      .from('direct_messages')
      .select('sender_id, created_at')
      .eq('receiver_id', userId)
      .is('read_at', null),
    fetchHiddenPartners(userId),
    fetchMutedPartners(userId),
    fetchBlockedIds(userId),
  ]);
  let n = 0;
  for (const m of (unread as { sender_id: string; created_at: string }[]) ?? []) {
    if (blocked.has(m.sender_id)) continue;
    if (mutes.has(m.sender_id)) continue;
    const hiddenAt = hides.get(m.sender_id);
    if (hiddenAt && m.created_at <= hiddenAt) continue;
    n += 1;
  }
  return n;
}

export async function hideConversation(userId: string, partnerId: string) {
  return supabase.from('chat_hides').upsert({ user_id: userId, partner_id: partnerId });
}

export async function unhideConversation(userId: string, partnerId: string) {
  return supabase.from('chat_hides').delete().match({ user_id: userId, partner_id: partnerId });
}

export async function fetchHiddenPartners(userId: string) {
  const { data, error } = await supabase
    .from('chat_hides')
    .select('partner_id, created_at')
    .eq('user_id', userId);
  if (error) return new Map<string, string>();
  return new Map(
    ((data as { partner_id: string; created_at: string }[]) ?? []).map((h) => [
      h.partner_id,
      h.created_at,
    ])
  );
}

export async function fetchBlockedIds(userId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  if (error) return new Set<string>();
  const ids = new Set<string>();
  for (const r of (data as { blocker_id: string; blocked_id: string }[]) ?? []) {
    ids.add(r.blocker_id === userId ? r.blocked_id : r.blocker_id);
  }
  return ids;
}

export async function fetchBlockedProfiles(userId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  const ids = ((data as { blocked_id: string }[]) ?? []).map((r) => r.blocked_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
  const map = new Map(((profiles as import('../types').Profile[]) ?? []).map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean) as import('../types').Profile[];
}

export async function unblockUser(blockerId: string, blockedId: string) {
  return supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function blockUser(blockerId: string, blockedId: string) {
  const result = await supabase
    .from('blocks')
    .upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (result.error) return result;
  await Promise.all([
    supabase
      .from('follows')
      .delete()
      .match({ follower_id: blockerId, following_id: blockedId }),
    hideConversation(blockerId, blockedId),
  ]);
  return result;
}

export async function reportUser(reporterId: string, reportedId: string) {
  return supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason: 'Kullanıcı raporu',
  });
}

export async function fetchHiddenMessageIds(userId: string) {
  const { data, error } = await supabase
    .from('message_hides')
    .select('message_id')
    .eq('user_id', userId);
  if (error) return new Set<string>();
  return new Set(((data as { message_id: string }[]) ?? []).map((r) => r.message_id));
}

export async function hideMessage(userId: string, messageId: string) {
  return supabase.from('message_hides').upsert({ user_id: userId, message_id: messageId });
}

export async function deleteOwnDirectMessage(messageId: string) {
  return supabase.from('direct_messages').delete().eq('id', messageId);
}

export async function deleteOwnDuelMessage(messageId: string) {
  return supabase.from('duel_messages').delete().eq('id', messageId);
}

export async function getBlockState(me: string, other: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(
      `and(blocker_id.eq.${me},blocked_id.eq.${other}),and(blocker_id.eq.${other},blocked_id.eq.${me})`
    );
  if (error) return 'none' as const;
  const rows = (data as { blocker_id: string; blocked_id: string }[]) ?? [];
  if (rows.some((r) => r.blocker_id === me)) return 'blocked_by_me' as const;
  if (rows.some((r) => r.blocked_id === me)) return 'blocked_me' as const;
  return 'none' as const;
}
