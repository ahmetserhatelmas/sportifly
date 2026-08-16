import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { RoleBadges } from '../../components/RoleBadges';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Post, Profile } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, played: 0, won: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isMe = session?.user.id === userId;

  const fetchData = useCallback(async () => {
    const [profileRes, followers, played, won, postsRes, followRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase
        .from('duel_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase.from('duels').select('*', { count: 'exact', head: true }).eq('winner_id', userId),
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      session
        ? supabase
            .from('follows')
            .select('follower_id')
            .match({ follower_id: session.user.id, following_id: userId })
        : Promise.resolve({ data: null }),
    ]);
    setProfile(profileRes.data as Profile);
    setStats({
      followers: followers.count ?? 0,
      played: played.count ?? 0,
      won: won.count ?? 0,
    });
    setPosts((postsRes.data as Post[]) ?? []);
    setIsFollowing(Boolean(followRes.data && (followRes.data as any[]).length > 0));
  }, [userId, session]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useLayoutEffect(() => {
    if (profile) navigation.setOptions({ title: `@${profile.username}` });
  }, [navigation, profile]);

  const toggleFollow = async () => {
    if (!session) return;
    setBusy(true);
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: session.user.id, following_id: userId });
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: session.user.id, following_id: userId });
    }
    setBusy(false);
    fetchData();
  };

  if (!profile) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 24 }}
        columnWrapperStyle={{ gap: 2, paddingHorizontal: 2 }}
        ListHeaderComponent={
          <>
            <View style={styles.banner}>
              {profile.banner_url ? (
                <Image source={{ uri: profile.banner_url }} style={StyleSheet.absoluteFill} />
              ) : null}
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarBorder}>
                <Avatar uri={profile.avatar_url} name={profile.username} size={92} />
              </View>
            </View>

            <Text style={styles.name}>{profile.full_name || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <RoleBadges
              isAdmin={profile.is_admin}
              isFieldOwner={profile.is_field_owner}
              isInstructor={profile.is_instructor}
              style={{ marginTop: 8 }}
            />
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            {!isMe && (
              <View style={styles.actions}>
                <Button
                  title={isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                  variant={isFollowing ? 'outline' : 'primary'}
                  onPress={toggleFollow}
                  loading={busy}
                  style={{ flex: 1, height: 44 }}
                />
                {isFollowing && (
                  <Button
                    title="Mesaj"
                    variant="outline"
                    onPress={() =>
                      navigation.navigate('DirectChat', {
                        userId,
                        username: profile.username,
                      })
                    }
                    style={{ flex: 1, height: 44, marginLeft: 10 }}
                  />
                )}
              </View>
            )}

            <View style={styles.statsCard}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.played}</Text>
                <Text style={styles.statLabel}>Maç sayısı</Text>
              </View>
              <View style={[styles.stat, styles.statMiddle]}>
                <Text style={[styles.statValue, { fontSize: 24 }]}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Takipçi</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.won}</Text>
                <Text style={styles.statLabel}>Kazanılan</Text>
              </View>
            </View>

            <Text style={styles.galleryTitle}>Paylaşımlar</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyGallery}>Henüz fotoğraf paylaşmamış.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridImage}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image source={{ uri: item.image_url }} style={styles.gridImageInner} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  banner: { height: 130, backgroundColor: colors.primary, overflow: 'hidden' },
  avatarWrap: { alignItems: 'center', marginTop: -46 },
  avatarBorder: {
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.card,
    backgroundColor: colors.card,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 10 },
  username: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statMiddle: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: { fontSize: 19, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  galleryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyGallery: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
  gridImage: {
    flex: 1 / 3,
    aspectRatio: 1,
    marginBottom: 2,
  },
  gridImageInner: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});
