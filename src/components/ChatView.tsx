import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme';
import { ChatMessage } from '../types';

type Props = {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (content: string) => Promise<void> | void;
  onOpenPost?: (postId: string) => void;
  emptyText?: string;
};

export function ChatView({ messages, currentUserId, onSend, onOpenPost, emptyText }: Props) {
  const [text, setText] = useState('');

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await onSend(content);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          emptyText ? (
            <Text style={styles.empty}>{emptyText}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.user_id === currentUserId;
          return (
            <View style={[styles.messageRow, mine && { justifyContent: 'flex-end' }]}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                {!mine && item.profiles?.username ? (
                  <Text style={styles.sender}>{item.profiles.username}</Text>
                ) : null}
                {item.shared_post ? (
                  <Pressable
                    onPress={() => onOpenPost?.(item.shared_post!.id)}
                    style={styles.shareCard}
                  >
                    <Image source={{ uri: item.shared_post.image_url }} style={styles.shareImage} />
                    {item.shared_post.caption ? (
                      <Text
                        style={[styles.shareCaption, mine && { color: '#fff' }]}
                        numberOfLines={2}
                      >
                        {item.shared_post.caption}
                      </Text>
                    ) : (
                      <Text style={[styles.shareCaption, mine && { color: '#fff' }]}>Gönderi</Text>
                    )}
                  </Pressable>
                ) : (
                  <Text style={[styles.messageText, mine && { color: '#fff' }]}>{item.content}</Text>
                )}
                <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.8)' }]}>
                  {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
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
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    transform: [{ scaleY: -1 }],
  },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  sender: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, marginBottom: 2 },
  messageText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  shareCard: { width: 180 },
  shareImage: { width: 180, height: 180, borderRadius: 10, backgroundColor: colors.border },
  shareCaption: { marginTop: 6, fontSize: 13, color: colors.text, lineHeight: 18 },
  time: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 3 },
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
