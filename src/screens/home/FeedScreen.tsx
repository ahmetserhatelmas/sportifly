import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { countVisibleUnread, fetchBlockedIds } from '../../lib/chatModeration';
import { pushSocial } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Post } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

type PostCardProps = {
  item: Post;
  onOpenProfile: (userId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onShare: (postId: string) => void;
  onToggleLike: (post: Post) => void;
};

// Kart memoize edildi: beğeni / yenileme sırasında sadece değişen satır yeniden çizilir.
const PostCard = React.memo(function PostCard({
  item,
  onOpenProfile,
  onOpenPost,
  onOpenComments,
  onShare,
  onToggleLike,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.cardHeader} onPress={() => onOpenProfile(item.user_id)}>
        <Avatar uri={item.profiles?.avatar_url} name={item.profiles?.username} size={36} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.username}>{item.profiles?.username}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => onOpenPost(item.id)}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.postImage}
          contentFit="cover"
          recyclingKey={item.id}
          transition={120}
        />
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={() => onToggleLike(item)} hitSlop={8} style={styles.actionBtn}>
          <Ionicons
            name={item.liked_by_me ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked_by_me ? colors.danger : colors.text}
          />
          <Text style={styles.actionText}>{item.like_count}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments(item.id)} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          <Text style={styles.actionText}>{item.comment_count}</Text>
        </Pressable>
        <Pressable onPress={() => onShare(item.id)} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
          <Text style={styles.actionText}>Gönder</Text>
        </Pressable>
      </View>

      {item.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.username}>{item.profiles?.username} </Text>
          {item.caption}
        </Text>
      ) : null}
    </View>
  );
});

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!session) {
      setUnreadCount(0);
      return;
    }
    setUnreadCount(await countVisibleUnread(session.user.id));
  }, [session]);

  const fetchPosts = useCallback(async () => {
    // Gönderiler ve engel listesi paralel çekilir; art arda bekletmek akışı geciktiriyordu.
    const [{ data, error }, blocked] = await Promise.all([
      supabase
        .from('posts')
        // profiles ilişkisi açıkça belirtilmeli: posts->profiles hem gönderi sahibi
        // (user_id) hem de post_likes üzerinden bağlı olduğu için sorgu yoksa hata verir
        .select('*, profiles!posts_user_id_fkey(*), post_likes(user_id), post_comments(id)')
        .order('created_at', { ascending: false })
        .limit(50),
      session?.user.id ? fetchBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
    ]);

    if (error) {
      console.warn('Akış yüklenemedi:', error.message);
    }
    if (!error && data) {
      setPosts(
        data
          .filter((p: any) => !blocked.has(p.user_id))
          .map((p: any) => ({
          ...p,
          like_count: p.post_likes?.length ?? 0,
          comment_count: p.post_comments?.length ?? 0,
          liked_by_me: p.post_likes?.some((l: any) => l.user_id === session?.user.id) ?? false,
        }))
      );
    }
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchUnread();
    }, [fetchPosts, fetchUnread])
  );

  useEffect(() => {
    if (!session) return;
    // Okundu işaretleme her satır için ayrı olay üretir; hepsini tek sayıma indir.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`unread-dm-${session.user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            timer = null;
            void fetchUnread();
          }, 400);
        }
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [session, fetchUnread]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const openProfile = useCallback(
    (userId: string) => navigation.navigate('UserProfile', { userId }),
    [navigation]
  );
  const openPost = useCallback(
    (postId: string) => navigation.navigate('PostDetail', { postId }),
    [navigation]
  );
  const openComments = useCallback(
    (postId: string) => navigation.navigate('Comments', { postId }),
    [navigation]
  );
  const sharePost = useCallback(
    (postId: string) => navigation.navigate('SharePost', { postId }),
    [navigation]
  );

  const toggleLike = useCallback(async (post: Post) => {
    if (!session) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: (p.like_count ?? 0) + (p.liked_by_me ? -1 : 1),
            }
          : p
      )
    );
    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: session.user.id });
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: session.user.id });
      if (post.user_id !== session.user.id) {
        const who = profile?.full_name || profile?.username || 'Birisi';
        void pushSocial(post.user_id, 'Yeni beğeni', `${who} gönderini beğendi`);
      }
    }
  }, [session, profile?.full_name, profile?.username]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        item={item}
        onOpenProfile={openProfile}
        onOpenPost={openPost}
        onOpenComments={openComments}
        onShare={sharePost}
        onToggleLike={toggleLike}
      />
    ),
    [openProfile, openPost, openComments, sharePost, toggleLike]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Sportifly</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('CreatePost')} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={26} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Messages')}
            hitSlop={8}
            style={styles.msgBtn}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        // Düşük donanımlı Android'de takılmayı azaltır: az sayıda kart hazırla, ekran dışını boşalt.
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="Henüz gönderi yok"
            subtitle="İlk spor anını paylaşan sen ol! Sağ üstteki + butonuna dokun."
          />
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  logo: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  msgBtn: { marginLeft: 16, position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  username: { fontSize: 14, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  postImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.border },
  actions: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { marginLeft: 6, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  caption: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, lineHeight: 20 },
});
