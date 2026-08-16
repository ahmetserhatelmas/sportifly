import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Profile } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Follows'>;

export function FollowsScreen({ route, navigation }: Props) {
  const { userId, initialTab } = route.params;
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab ?? 'followers');
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);

  const fetchAll = useCallback(async () => {
    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from('follows')
        .select('profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('profiles!follows_following_id_fkey(*)')
        .eq('follower_id', userId),
    ]);
    setFollowers(((followersRes.data as any[]) ?? []).map((r) => r.profiles).filter(Boolean));
    setFollowing(((followingRes.data as any[]) ?? []).map((r) => r.profiles).filter(Boolean));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const data = tab === 'followers' ? followers : following;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'followers' && styles.tabActive]}
          onPress={() => setTab('followers')}
        >
          <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>
            Takipçiler ({followers.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'following' && styles.tabActive]}
          onPress={() => setTab('following')}
        >
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
            Takip Edilen ({following.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={tab === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.push('UserProfile', { userId: item.id })}
          >
            <Avatar uri={item.avatar_url} name={item.username} size={46} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.username}</Text>
              {item.full_name ? <Text style={styles.subName}>{item.full_name}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.card, ...shadow.card },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  subName: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
});
