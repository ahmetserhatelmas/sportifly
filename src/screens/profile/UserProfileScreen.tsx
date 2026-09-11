import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { DuelCard } from '../../components/DuelCard';
import { EmptyState } from '../../components/EmptyState';
import { PhotoLightbox } from '../../components/PhotoLightbox';
import { RoleBadges } from '../../components/RoleBadges';
import { useAuth } from '../../context/AuthContext';
import {
  blockUser,
  fetchBlockedIds,
  fetchMutedPartners,
  getBlockState,
  muteConversation,
  unblockUser,
  unmuteConversation,
} from '../../lib/chatModeration';
import { fetchUpcomingMatches } from '../../lib/matches';
import { pushSocial } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Duel, Post, Profile } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { session, profile: me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, played: 0, won: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [upcoming, setUpcoming] = useState<Duel[]>([]);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blockState, setBlockState] = useState<'none' | 'blocked_by_me' | 'blocked_me'>('none');
  const [muted, setMuted] = useState(false);

  const isMe = session?.user.id === userId;
  const blockedByMe = blockState === 'blocked_by_me';

  const fetchData = useCallback(async () => {
    let block: 'none' | 'blocked_by_me' | 'blocked_me' = 'none';
    if (session && session.user.id !== userId) {
      block = await getBlockState(session.user.id, userId);
      setBlockState(block);
      if (block === 'blocked_me') {
        setProfile(null);
        setHidden(true);
        setLoaded(true);
        return;
      }
    } else {
      setBlockState('none');
    }

    const blocked = session?.user.id ? await fetchBlockedIds(session.user.id) : new Set<string>();
    const [profileRes, followers, played, won, postsRes, followRes, matches] = await Promise.all([
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
      fetchUpcomingMatches(userId, blocked),
    ]);
    if (!profileRes.data) {
      setProfile(null);
      setHidden(true);
      setLoaded(true);
      return;
    }
    setHidden(false);
    setProfile(profileRes.data as Profile);
    setStats({
      followers: followers.count ?? 0,
      played: played.count ?? 0,
      won: won.count ?? 0,
    });
    setPosts(block === 'blocked_by_me' ? [] : ((postsRes.data as Post[]) ?? []));
    setUpcoming(block === 'blocked_by_me' ? [] : matches);
    setIsFollowing(Boolean(followRes.data && (followRes.data as any[]).length > 0));
    if (session && session.user.id !== userId) {
      const mutes = await fetchMutedPartners(session.user.id);
      setMuted(mutes.has(userId));
    } else {
      setMuted(false);
    }
    setLoaded(true);
  }, [userId, session]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const confirmBlock = useCallback(() => {
    if (!session || !profile) return;
    Alert.alert(
      'Engelle',
      `@${profile.username} engellensin mi? Birbirinizi akış, arama ve sohbette göremezsiniz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const { error } = await blockUser(session.user.id, userId);
            setBusy(false);
            if (error) {
              Alert.alert('Engel', 'İşlem yapılamadı.');
              return;
            }
            fetchData();
          },
        },
      ]
    );
  }, [session, profile, userId, fetchData]);

  const toggleMute = useCallback(async () => {
    if (!session) return;
    const { error } = muted
      ? await unmuteConversation(session.user.id, userId)
      : await muteConversation(session.user.id, userId);
    if (error) {
      Alert.alert('Sessize al', 'İşlem yapılamadı.');
      return;
    }
    setMuted(!muted);
  }, [session, userId, muted]);

  const confirmUnblock = useCallback(() => {
    if (!session || !profile) return;
    Alert.alert('Engeli kaldır', `@${profile.username} engeli kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        onPress: async () => {
          setBusy(true);
          const { error } = await unblockUser(session.user.id, userId);
          setBusy(false);
          if (error) {
            Alert.alert('Engel', 'İşlem yapılamadı.');
            return;
          }
          fetchData();
        },
      },
    ]);
  }, [session, profile, userId, fetchData]);

  useLayoutEffect(() => {
    if (hidden) {
      navigation.setOptions({ title: 'Hesap', headerRight: undefined });
      return;
    }
    if (profile) navigation.setOptions({ title: `@${profile.username}` });
    if (isMe || !session || !profile) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() =>
            Alert.alert(`@${profile.username}`, undefined, [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: muted ? 'Sesi aç' : 'Sessize al',
                onPress: toggleMute,
              },
              blockedByMe
                ? { text: 'Engeli kaldır', onPress: confirmUnblock }
                : { text: 'Engelle', style: 'destructive', onPress: confirmBlock },
            ])
          }
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [
    navigation,
    profile,
    hidden,
    isMe,
    session,
    blockedByMe,
    muted,
    confirmBlock,
    confirmUnblock,
    toggleMute,
  ]);

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
      const who = me?.full_name || me?.username || 'Birisi';
      void pushSocial(userId, 'Yeni takipçi', `${who} seni takip etmeye başladı`);
    }
    setBusy(false);
    fetchData();
  };

  if (!loaded) return <View style={styles.container} />;
  if (hidden || !profile) {
    return (
      <View style={styles.container}>
        <EmptyState icon="ban-outline" title="Bu hesap kullanılamıyor" />
      </View>
    );
  }

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
                <Image
                  source={{ uri: profile.banner_url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : null}
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarBorder}>
                <Avatar
                  uri={profile.avatar_url}
                  name={profile.username}
                  size={92}
                  onPress={profile.avatar_url ? () => setPhotoOpen(true) : undefined}
                />
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

            {!isMe && blockedByMe && (
              <View style={styles.actions}>
                <Button
                  title="Engeli Kaldır"
                  variant="outline"
                  onPress={confirmUnblock}
                  loading={busy}
                  style={{ flex: 1, height: 44 }}
                />
              </View>
            )}

            {!isMe && !blockedByMe && (
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

            {blockedByMe ? (
              <Text style={styles.blockedNote}>Bu kullanıcıyı engelledin.</Text>
            ) : (
              <>
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

                {upcoming.length > 0 ? (
                  <View>
                    <Text style={styles.sectionTitle}>Katıldığı maçlar</Text>
                    {upcoming.map((duel) => (
                      <DuelCard
                        key={duel.id}
                        duel={duel}
                        compact
                        onPress={() => navigation.navigate('DuelDetail', { duelId: duel.id })}
                      />
                    ))}
                  </View>
                ) : null}

                <Text style={styles.galleryTitle}>Paylaşımlar</Text>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          blockedByMe ? null : (
            <Text style={styles.emptyGallery}>Henüz fotoğraf paylaşmamış.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridImage}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.gridImageInner}
              contentFit="cover"
              recyclingKey={item.id}
            />
          </Pressable>
        )}
      />
      <PhotoLightbox
        uri={profile.avatar_url}
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
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
  blockedNote: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
    paddingHorizontal: 32,
  },
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
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
