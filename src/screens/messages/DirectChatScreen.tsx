import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatView } from '../../components/ChatView';
import { useAuth } from '../../context/AuthContext';
import {
  deleteOwnDirectMessage,
  fetchHiddenMessageIds,
  getBlockState,
  hideMessage,
  unhideConversation,
} from '../../lib/chatModeration';
import { pushAfterDirectMessage } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DirectChat'>;

export function DirectChatScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { session, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [blockState, setBlockState] = useState<'none' | 'blocked_by_me' | 'blocked_me'>('none');

  useLayoutEffect(() => {
    const canOpenProfile = blockState === 'none';
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          onPress={() => {
            if (canOpenProfile) navigation.navigate('UserProfile', { userId });
          }}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed && canOpenProfile ? 0.6 : 1 })}
        >
          <Text style={styles.headerTitle}>{username}</Text>
        </Pressable>
      ),
    });
  }, [navigation, userId, username, blockState]);

  const markRead = useCallback(async () => {
    if (!session) return;
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', session.user.id)
      .eq('sender_id', userId)
      .is('read_at', null);
  }, [session, userId]);

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;
    const [{ data }, hiddenIds, block] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('*, posts:post_id(id, image_url, caption), listings:listing_id(id, title)')
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me})`
        )
        .order('created_at', { ascending: true }),
      fetchHiddenMessageIds(me),
      getBlockState(me, userId),
    ]);

    setBlockState(block);
    if (block !== 'none') {
      setMessages([]);
      return;
    }
    const rows = (data as any[]) ?? [];
    setMessages(
      rows
        .filter((m) => !hiddenIds.has(m.id))
        .map((m) => ({
          id: m.id,
          user_id: m.sender_id,
          content: m.content,
          created_at: m.created_at,
          post_id: m.post_id,
          listing_id: m.listing_id,
          shared_post: m.posts ?? null,
          shared_listing: m.listings ?? null,
        }))
    );
    // Okunmamış gelen mesaj yoksa UPDATE atma: her UPDATE karşı tarafta realtime olayı üretiyor.
    if (rows.some((m) => m.receiver_id === me && !m.read_at)) {
      await markRead();
    }
  }, [session, userId, markRead]);

  // Realtime olayları art arda gelir (özellikle okundu güncellemeleri); tek fetch'e indir.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      refetchTimer.current = null;
      void fetchMessages();
    }, 250);
  }, [fetchMessages]);

  useEffect(() => {
    if (!session) return;
    const me = session.user.id;
    fetchMessages();

    // Benzersiz kanal adı: React Strict Mode / hızlı yeniden mount'ta
    // aynı isimli kanal zaten subscribe olmuş olabiliyor.
    // Eskiden tablodaki her değişiklikte (başka sohbetler dahil) tüm sohbet yeniden çekiliyordu.
    const channel = supabase
      .channel(`dm-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${me}`,
        },
        (payload) => {
          const row = payload.new as { sender_id?: string } | null;
          if (row?.sender_id === userId) scheduleFetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'direct_messages' },
        () => scheduleFetch()
      )
      .subscribe();

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [session, userId, fetchMessages, scheduleFetch]);

  const openPost = useCallback(
    (id: string) => navigation.navigate('PostDetail', { postId: id }),
    [navigation]
  );
  const openListing = useCallback(
    (id: string) => navigation.navigate('ListingDetail', { listingId: id }),
    [navigation]
  );

  const send = async (content: string) => {
    if (!session) return;
    await unhideConversation(session.user.id, userId);
    const { data } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: userId,
        content,
      })
      .select('id')
      .single();
    if (data?.id && session.user.id !== userId) {
      void pushAfterDirectMessage(data.id, {
        receiverId: userId,
        title: profile?.full_name || profile?.username || 'Yeni mesaj',
        body: content.slice(0, 120),
      });
    }
    fetchMessages();
  };

  const remove = async (message: ChatMessage) => {
    if (!session) return;
    if (message.user_id === session.user.id) {
      const { error } = await deleteOwnDirectMessage(message.id);
      if (error) return;
    } else {
      const { error } = await hideMessage(session.user.id, message.id);
      if (error) return;
    }
    fetchMessages();
  };

  if (!session) return null;

  const blocked = blockState !== 'none';

  return (
    <View style={styles.safe}>
      <ChatView
        messages={messages}
        currentUserId={session.user.id}
        onSend={send}
        onDelete={remove}
        composerDisabled={blocked}
        disabledText={
          blockState === 'blocked_by_me'
            ? 'Bu kullanıcıyı engelledin.'
            : blockState === 'blocked_me'
              ? 'Bu kullanıcı seni engelledi.'
              : undefined
        }
        onOpenPost={openPost}
        onOpenListing={openListing}
        emptyText="Sohbeti başlat!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
