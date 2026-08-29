import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Post, PostComment } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: postData }, { data: commentData }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(*), post_likes(user_id)')
        .eq('id', postId)
        .single(),
      supabase
        .from('post_comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
    ]);
    const blocked = session?.user.id
      ? await fetchBlockedIds(session.user.id)
      : new Set<string>();
    if (postData && !blocked.has((postData as any).user_id)) {
      const p = postData as any;
      setPost({
        ...p,
        like_count: p.post_likes?.length ?? 0,
        liked_by_me: p.post_likes?.some((l: any) => l.user_id === session?.user.id) ?? false,
      });
    } else {
      setPost(null);
    }
    setComments(((commentData as PostComment[]) ?? []).filter((c) => !blocked.has(c.user_id)));
    setLoaded(true);
  }, [postId, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  if (!loaded) return <SafeAreaView style={styles.safe} />;
  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="ban-outline" title="Bu gönderi kullanılamıyor" />
      </SafeAreaView>
    );
  }

  const isOwner = post.user_id === session?.user.id;

  const toggleLike = async () => {
    if (!session) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked_by_me: !prev.liked_by_me,
            like_count: (prev.like_count ?? 0) + (prev.liked_by_me ? -1 : 1),
          }
        : prev
    );
    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: session.user.id });
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: session.user.id });
    }
  };

  const sendComment = async () => {
    if (!session || !commentText.trim()) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: session.user.id,
      content: commentText.trim(),
    });
    if (!error) {
      setCommentText('');
      fetchAll();
    }
  };

  const saveCaption = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('posts')
      .update({ caption: editedCaption.trim() || null })
      .eq('id', postId);
    setSaving(false);
    if (error) {
      Alert.alert('Kaydedilemedi', 'Bir hata oluştu, tekrar deneyin.');
    } else {
      setEditing(false);
      fetchAll();
    }
  };

  const deletePost = () => {
    Alert.alert('Gönderiyi Sil', 'Bu gönderi kalıcı olarak silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('posts').delete().eq('id', postId);
          if (error) Alert.alert('Silinemedi', 'Bir hata oluştu, tekrar deneyin.');
          else navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <Pressable
            style={styles.header}
            onPress={() => navigation.navigate('UserProfile', { userId: post.user_id })}
          >
            <Avatar uri={post.profiles?.avatar_url} name={post.profiles?.username} size={38} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.username}>{post.profiles?.username}</Text>
              <Text style={styles.time}>
                {new Date(post.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {isOwner && (
              <View style={{ flexDirection: 'row' }}>
                <Pressable
                  hitSlop={8}
                  style={styles.iconBtn}
                  onPress={() => {
                    setEditedCaption(post.caption ?? '');
                    setEditing(true);
                  }}
                >
                  <Ionicons name="create-outline" size={22} color={colors.text} />
                </Pressable>
                <Pressable hitSlop={8} style={styles.iconBtn} onPress={deletePost}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            )}
          </Pressable>

          <Image source={{ uri: post.image_url }} style={styles.image} />

          <View style={styles.actions}>
            <Pressable onPress={toggleLike} hitSlop={8} style={styles.actionBtn}>
              <Ionicons
                name={post.liked_by_me ? 'heart' : 'heart-outline'}
                size={26}
                color={post.liked_by_me ? colors.danger : colors.text}
              />
              <Text style={styles.actionText}>{post.like_count} beğeni</Text>
            </Pressable>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={23} color={colors.text} />
              <Text style={styles.actionText}>{comments.length} yorum</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('SharePost', { postId: post.id })}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
              <Text style={styles.actionText}>Gönder</Text>
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.editBox}>
              <Input
                label="Açıklama"
                placeholder="Açıklama yaz..."
                multiline
                value={editedCaption}
                onChangeText={setEditedCaption}
              />
              <View style={{ flexDirection: 'row' }}>
                <Button
                  title="Vazgeç"
                  variant="ghost"
                  onPress={() => setEditing(false)}
                  style={{ flex: 1, height: 44 }}
                />
                <Button
                  title="Kaydet"
                  onPress={saveCaption}
                  loading={saving}
                  style={{ flex: 1, height: 44, marginLeft: 10 }}
                />
              </View>
            </View>
          ) : post.caption ? (
            <Text style={styles.caption}>
              <Text style={styles.username}>{post.profiles?.username} </Text>
              {post.caption}
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Yorumlar</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>Henüz yorum yok. İlk yorumu sen yap.</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.comment}>
                <Pressable
                  onPress={() => navigation.navigate('UserProfile', { userId: c.user_id })}
                >
                  <Avatar uri={c.profiles?.avatar_url} name={c.profiles?.username} size={32} />
                </Pressable>
                <View style={styles.bubble}>
                  <Text style={styles.commentUser}>{c.profiles?.username}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Yorum yaz..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Pressable onPress={sendComment} style={styles.sendBtn} hitSlop={8}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  username: { fontSize: 14, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  iconBtn: { marginLeft: 14 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.border },
  actions: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 22 },
  actionText: { marginLeft: 7, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  caption: {
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  editBox: { paddingHorizontal: 14, paddingTop: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  noComments: { paddingHorizontal: 14, fontSize: 13, color: colors.textMuted },
  comment: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 12 },
  bubble: {
    marginLeft: 10,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  commentUser: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  commentText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
