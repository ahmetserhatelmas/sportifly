import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DirectChat'>;

export function DirectChatScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { session } = useAuth();
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
    const [{ data }, hiddenIds] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('*, posts:post_id(id, image_url, caption), listings:listing_id(id, title)')
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me})`
        )
        .order('created_at', { ascending: true }),
      fetchHiddenMessageIds(me),
    ]);

    const block = await getBlockState(me, userId);
    setBlockState(block);
    if (block !== 'none') {
      setMessages([]);
      return;
    }
    setMessages(
      ((data as any[]) ?? [])
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
    await markRead();
  }, [session, userId, markRead]);

  useEffect(() => {
    fetchMessages();

    // Benzersiz kanal adı: React Strict Mode / hızlı yeniden mount'ta
    // aynı isimli kanal zaten subscribe olmuş olabiliyor.
    const channel = supabase
      .channel(`dm-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchMessages]);

  const send = async (content: string) => {
    if (!session) return;
    await unhideConversation(session.user.id, userId);
    await supabase.from('direct_messages').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      content,
    });
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
        onOpenPost={(id) => navigation.navigate('PostDetail', { postId: id })}
        onOpenListing={(id) => navigation.navigate('ListingDetail', { listingId: id })}
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
