import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatView } from '../../components/ChatView';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';
import { ChatMessage } from '../../types';

export function SupportScreen() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    setMessages(
      ((data as any[]) ?? []).map((m) => ({
        id: m.id,
        user_id: m.is_from_support ? 'support' : m.user_id,
        content: m.content,
        created_at: m.created_at,
      }))
    );
  }, [session]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const send = async (content: string) => {
    if (!session) return;
    await supabase.from('support_messages').insert({
      user_id: session.user.id,
      content,
    });
    fetchMessages();
  };

  if (!session) return null;

  return (
    <View style={styles.safe}>
      <View style={styles.banner}>
        <Ionicons name="headset" size={22} color={colors.primaryDark} />
        <Text style={styles.bannerText}>
          Sorularını buraya yazabilirsin, destek ekibimiz en kısa sürede dönüş yapacak.
        </Text>
      </View>
      <ChatView
        messages={messages}
        currentUserId={session.user.id}
        onSend={send}
        emptyText="Merhaba! Sana nasıl yardımcı olabiliriz?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    margin: 12,
    padding: 12,
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
  },
});
