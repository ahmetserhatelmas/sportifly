import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Profile } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

type Row = {
  profile: Profile;
  unread: number;
  lastMessage: string;
  lastAt: string;
};

type DmRow = {
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export function MessagesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const fetchThreads = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;

    const { data: messages } = await supabase
      .from('direct_messages')
      .select('sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
      .order('created_at', { ascending: false })
      .limit(500);

    const msgs = (messages as DmRow[]) ?? [];
    if (msgs.length === 0) {
      setRows([]);
      return;
    }

    const partnerIds = [
      ...new Set(msgs.map((m) => (m.sender_id === me ? m.receiver_id : m.sender_id))),
    ];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', partnerIds);

    const profileMap = new Map(((profiles as Profile[]) ?? []).map((p) => [p.id, p]));
    const byPartner = new Map<string, Row>();

    for (const m of msgs) {
      const partnerId = m.sender_id === me ? m.receiver_id : m.sender_id;
      if (byPartner.has(partnerId)) continue;
      const profile = profileMap.get(partnerId);
      if (!profile) continue;
      byPartner.set(partnerId, {
        profile,
        unread: 0,
        lastMessage: m.content,
        lastAt: m.created_at,
      });
    }

    for (const m of msgs) {
      if (m.receiver_id === me && !m.read_at) {
        const row = byPartner.get(m.sender_id);
        if (row) row.unread += 1;
      }
    }

    setRows(
      [...byPartner.values()].sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      )
    );
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [fetchThreads])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Henüz mesajın yok"
            subtitle="Birini takip edip profilinden mesaj atabilirsin; gelen sohbetler burada görünür."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('DirectChat', {
                userId: item.profile.id,
                username: item.profile.username,
              })
            }
          >
            <Avatar
              uri={item.profile.avatar_url}
              name={item.profile.username}
              size={46}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.name, item.unread > 0 && styles.nameUnread]}>
                {item.profile.username}
              </Text>
              <Text
                style={[styles.preview, item.unread > 0 && styles.previewUnread]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>
            {item.unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  nameUnread: { fontWeight: '800' },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
