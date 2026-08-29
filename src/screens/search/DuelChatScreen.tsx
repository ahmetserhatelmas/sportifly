import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatView } from '../../components/ChatView';
import { useAuth } from '../../context/AuthContext';
import { deleteOwnDuelMessage, fetchBlockedIds } from '../../lib/chatModeration';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DuelChat'>;

export function DuelChatScreen({ route }: Props) {
  const { duelId } = route.params;
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [hidden, setHidden] = useState(false);

  const fetchMessages = useCallback(async () => {
    const [{ data }, { data: duel }, blocked] = await Promise.all([
      supabase
        .from('duel_messages')
        .select('*, profiles(*)')
        .eq('duel_id', duelId)
        .order('created_at', { ascending: true }),
      supabase.from('duels').select('creator_id').eq('id', duelId).single(),
      session?.user.id ? fetchBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
    ]);
    if (!duel || (duel.creator_id && blocked.has(duel.creator_id))) {
      setHidden(true);
      setMessages([]);
      return;
    }
    setHidden(false);
    setMessages(
      ((data as ChatMessage[]) ?? []).filter((m) => !blocked.has(m.user_id))
    );
  }, [duelId, session?.user.id]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`duel-chat-${duelId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duel_messages', filter: `duel_id=eq.${duelId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [duelId, fetchMessages]);

  const send = async (content: string) => {
    if (!session || hidden) return;
    await supabase.from('duel_messages').insert({
      duel_id: duelId,
      user_id: session.user.id,
      content,
    });
    fetchMessages();
  };

  const remove = async (message: ChatMessage) => {
    if (!session || message.user_id !== session.user.id) return;
    const { error } = await deleteOwnDuelMessage(message.id);
    if (!error) fetchMessages();
  };

  if (!session) return null;

  return (
    <View style={styles.safe}>
      <ChatView
        messages={messages}
        currentUserId={session.user.id}
        onSend={hidden ? async () => {} : send}
        onDelete={remove}
        canDelete={(m) => m.user_id === session.user.id}
        composerDisabled={hidden}
        disabledText={hidden ? 'Bu sohbet kullanılamıyor.' : undefined}
        emptyText="Buluşma yerini ve saati burada netleştirin."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});
