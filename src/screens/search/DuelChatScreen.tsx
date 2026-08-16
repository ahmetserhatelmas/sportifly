import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '../../components/ChatView';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DuelChat'>;

export function DuelChatScreen({ route }: Props) {
  const { duelId } = route.params;
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('duel_messages')
      .select('*, profiles(*)')
      .eq('duel_id', duelId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) ?? []);
  }, [duelId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`duel-chat-${duelId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'duel_messages', filter: `duel_id=eq.${duelId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [duelId, fetchMessages]);

  const send = async (content: string) => {
    if (!session) return;
    await supabase.from('duel_messages').insert({
      duel_id: duelId,
      user_id: session.user.id,
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
        emptyText="Buluşma yerini ve saati burada netleştirin."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});
