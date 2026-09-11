import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { pushSocial } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { PostComment } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Comments'>;

export function CommentsScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { session, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    const [{ data }, blocked] = await Promise.all([
      supabase
        .from('post_comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
      session?.user.id ? fetchBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
    ]);
    setComments(((data as PostComment[]) ?? []).filter((c) => !blocked.has(c.user_id)));
  }, [postId, session?.user.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const send = async () => {
    if (!text.trim() || !session || sending) return;
    setSending(true);
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: session.user.id,
      content: text.trim(),
    });
    setSending(false);
    if (!error) {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .maybeSingle();
      const ownerId = (post as { user_id?: string } | null)?.user_id;
      if (ownerId && ownerId !== session.user.id) {
        const who = profile?.full_name || profile?.username || 'Birisi';
        void pushSocial(ownerId, 'Yeni yorum', `${who}: ${text.trim().slice(0, 80)}`);
      }
      setText('');
      fetchComments();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" title="Henüz yorum yok" subtitle="İlk yorumu sen yap." />
          }
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Pressable
                onPress={() => navigation.navigate('UserProfile', { userId: item.user_id })}
              >
                <Avatar uri={item.profiles?.avatar_url} name={item.profiles?.username} size={34} />
              </Pressable>
              <View style={styles.bubble}>
                <Text style={styles.commentUser}>{item.profiles?.username}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Yorum yaz..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable onPress={send} style={styles.sendBtn} hitSlop={8}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  comment: { flexDirection: 'row', marginBottom: 14 },
  bubble: {
    marginLeft: 10,
    backgroundColor: colors.card,
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
