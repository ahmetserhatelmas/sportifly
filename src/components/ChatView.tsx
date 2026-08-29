import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { ChatMessage } from '../types';

type Props = {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (content: string) => Promise<void> | void;
  onOpenPost?: (postId: string) => void;
  onOpenListing?: (listingId: string) => void;
  emptyText?: string;
  composerDisabled?: boolean;
  disabledText?: string;
  onDelete?: (message: ChatMessage) => Promise<void> | void;
  canDelete?: (message: ChatMessage) => boolean;
};

export function ChatView({
  messages,
  currentUserId,
  onSend,
  onOpenPost,
  onOpenListing,
  emptyText,
  composerDisabled,
  disabledText,
  onDelete,
  canDelete,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKbHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const keyboardUp = kbHeight > 0;
  // Android'de pencere zaten küçülür; iOS'ta sohbet kutusunu klavyenin üstüne kaldırmak gerekir.
  const lift = Platform.OS === 'ios' ? kbHeight : 0;

  const send = async () => {
    const content = text.trim();
    if (!content || composerDisabled) return;
    setText('');
    await onSend(content);
  };

  return (
    <View style={{ flex: 1, paddingBottom: lift }}>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null
        }
        renderItem={({ item }) => {
          const mine = item.user_id === currentUserId;
          return (
            <View style={[styles.messageRow, mine && { justifyContent: 'flex-end' }]}>
              <Pressable
                delayLongPress={350}
                onLongPress={
                  onDelete && (canDelete?.(item) ?? true)
                    ? () =>
                        Alert.alert(
                          'Mesajı sil',
                          mine
                            ? 'Bu mesaj herkesten silinsin mi?'
                            : 'Bu mesaj senin sohbetinden silinsin mi?',
                          [
                            { text: 'Vazgeç', style: 'cancel' },
                            {
                              text: 'Sil',
                              style: 'destructive',
                              onPress: () => onDelete(item),
                            },
                          ]
                        )
                    : undefined
                }
              >
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
                  <MessageText item={item} mine={mine} onOpenListing={onOpenListing} />
                )}
                <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.8)' }]}>
                  {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              </Pressable>
            </View>
          );
        }}
      />

      {composerDisabled ? (
        <View style={[styles.disabledBar, { paddingBottom: 12 + (keyboardUp ? 0 : insets.bottom) }]}>
          <Text style={styles.disabledText}>{disabledText ?? 'Mesaj gönderemezsin.'}</Text>
        </View>
      ) : (
        <View
          style={[
            styles.inputRow,
            { paddingBottom: keyboardUp ? 10 : 10 + insets.bottom },
          ]}
        >
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
      )}
    </View>
  );
}

function MessageText({
  item,
  mine,
  onOpenListing,
}: {
  item: ChatMessage;
  mine: boolean;
  onOpenListing?: (listingId: string) => void;
}) {
  const listingId = item.shared_listing?.id ?? item.listing_id;
  const title = item.shared_listing?.title?.trim();
  const lines = item.content.split('\n');

  return (
    <Text style={[styles.messageText, mine && { color: '#fff' }]}>
      {lines.map((line, i) => {
        const isLink = !!(listingId && title && (line.trim() === title || line.includes(title)));
        return (
          <Text
            key={`${item.id}-${i}`}
            onPress={isLink ? () => onOpenListing?.(listingId!) : undefined}
            style={isLink ? [styles.listingLink, mine && styles.listingLinkMine] : undefined}
          >
            {line}
            {i < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </Text>
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
  listingLink: { color: '#2563EB', fontWeight: '700', textDecorationLine: 'underline' },
  listingLinkMine: { color: '#E8F8FF' },
  shareCard: { width: 180 },
  shareImage: { width: 180, height: 180, borderRadius: 10, backgroundColor: colors.border },
  shareCaption: { marginTop: 6, fontSize: 13, color: colors.text, lineHeight: 18 },
  time: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
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
  disabledBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  disabledText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
