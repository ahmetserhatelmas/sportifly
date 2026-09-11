import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { pushSocial } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Profile } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SharePost'>;

export function SharePostScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { session, profile } = useAuth();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;
    const [{ data: following }, { data: followers }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', me),
      supabase.from('follows').select('follower_id').eq('following_id', me),
    ]);
    const ids = [
      ...new Set([
        ...((following ?? []).map((r: { following_id: string }) => r.following_id)),
        ...((followers ?? []).map((r: { follower_id: string }) => r.follower_id)),
      ]),
    ].filter((id) => id !== me);
    if (ids.length === 0) {
      setFriends([]);
      return;
    }
    const [{ data: profiles }, blocked] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      fetchBlockedIds(me),
    ]);
    setFriends(((profiles as Profile[]) ?? []).filter((p) => !blocked.has(p.id)));
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [fetchFriends])
  );

  const sendTo = async (friend: Profile) => {
    if (!session) return;
    setSendingId(friend.id);
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: friend.id,
        content: 'Sana bir gönderi gönderdi',
        post_id: postId,
      })
      .select('id')
      .single();
    if (!error && data?.id) {
      void pushSocial(friend.id, profile?.full_name || profile?.username || 'Yeni mesaj', 'Sana bir gönderi gönderdi');
    }
    setSendingId(null);
    if (error) {
      Alert.alert(
        'Gönderilemedi',
        'Bu kişiye mesaj atılamadı. Takip ilişkisi veya mevcut sohbet gerekir.'
      );
      return;
    }
    navigation.replace('DirectChat', { userId: friend.id, username: friend.username });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Gönderilecek kimse yok"
            subtitle="Birini takip et veya seni takip edenlere gönderi yollayabilirsin."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => sendTo(item)}
            disabled={sendingId === item.id}
          >
            <Avatar uri={item.avatar_url} name={item.username} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.username}</Text>
              {item.full_name ? <Text style={styles.full}>{item.full_name}</Text> : null}
            </View>
            <Text style={styles.send}>{sendingId === item.id ? '...' : 'Gönder'}</Text>
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
  full: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  send: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
