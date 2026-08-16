import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '../../components/ChatView';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DirectChat'>;

export function DirectChatScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          onPress={() => navigation.navigate('UserProfile', { userId })}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={styles.headerTitle}>{username}</Text>
        </Pressable>
      ),
    });
  }, [navigation, userId, username]);

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
    const { data } = await supabase
      .from('direct_messages')
      .select('*, posts:post_id(id, image_url, caption)')
      .or(
        `and(sender_id.eq.${me},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${me})`
      )
      .order('created_at', { ascending: true });

    setMessages(
      ((data as any[]) ?? []).map((m) => ({
        id: m.id,
        user_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        post_id: m.post_id,
        shared_post: m.posts ?? null,
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
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchMessages]);

  const send = async (content: string) => {
    if (!session) return;
    await supabase.from('direct_messages').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      content,
    });
    fetchMessages();
  };

  if (!session) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ChatView
        messages={messages}
        currentUserId={session.user.id}
        onSend={send}
        onOpenPost={(id) => navigation.navigate('PostDetail', { postId: id })}
        emptyText="Sohbeti başlat!"
      />
    </SafeAreaView>
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
