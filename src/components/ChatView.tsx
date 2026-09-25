import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  LayoutChangeEvent,
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

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

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
  // Klavyenin üst kenarı (ekran koordinatı); kapalıyken null.
  const [kbTop, setKbTop] = useState<number | null>(null);
  const [lift, setLift] = useState(0);
  const rootRef = useRef<View>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKbTop(e.endCoordinates.screenY)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbTop(null)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const keyboardUp = kbTop !== null;

  // Kutunun alt kenarı klavyenin altında kalıyorsa farkı kadar kaldır. iOS'ta pencere hiç
  // küçülmez; Android edge-to-edge modunda da küçülmüyor. Pencerenin küçüldüğü cihazlarda
  // fark sıfır çıkar, ikinci kez kaldırılmaz. Yükseklik hesabı yerine gerçek konum ölçülür.
  const measureLift = useCallback(() => {
    if (kbTop === null) {
      setLift(0);
      return;
    }
    rootRef.current?.measureInWindow((_x, y, _w, h) => {
      setLift(Math.max(0, Math.round(y + h - kbTop)));
    });
  }, [kbTop]);

  useEffect(() => {
    measureLift();
  }, [measureLift]);

  const onRootLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (kbTop !== null) measureLift();
    },
    [kbTop, measureLift]
  );

  // Ters liste için diziyi her render'da değil, mesajlar değişince bir kez çevir.
  const data = useMemo(() => [...messages].reverse(), [messages]);

  const confirmDelete = useCallback(
    (item: ChatMessage, mine: boolean) => {
      if (!onDelete) return;
      Alert.alert(
        'Mesajı sil',
        mine ? 'Bu mesaj herkesten silinsin mi?' : 'Bu mesaj senin sohbetinden silinsin mi?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: () => onDelete(item) },
        ]
      );
    },
    [onDelete]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.user_id === currentUserId;
      const deletable = !!onDelete && (canDelete?.(item) ?? true);
      return (
        <MessageBubble
          item={item}
          mine={mine}
          deletable={deletable}
          onOpenPost={onOpenPost}
          onOpenListing={onOpenListing}
          onLongPress={confirmDelete}
        />
      );
    },
    [currentUserId, onDelete, canDelete, onOpenPost, onOpenListing, confirmDelete]
  );

  return (
    <View ref={rootRef} style={{ flex: 1, paddingBottom: lift }} onLayout={onRootLayout}>
      {data.length === 0 && emptyText ? (
        <View style={styles.emptyWrap} pointerEvents="none">
          <Text style={styles.empty}>{emptyText}</Text>
        </View>
      ) : null}
      <FlatList
        data={data}
        inverted
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16 }}
        initialNumToRender={16}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderItem}
      />

      {composerDisabled ? (
        <View style={[styles.disabledBar, { paddingBottom: 12 + (keyboardUp ? 0 : insets.bottom) }]}>
          <Text style={styles.disabledText}>{disabledText ?? 'Mesaj gönderemezsin.'}</Text>
        </View>
      ) : (
        <Composer onSend={onSend} bottomPad={keyboardUp ? 10 : 10 + insets.bottom} />
      )}
    </View>
  );
}

const keyExtractor = (item: ChatMessage) => item.id;

// Yazı kutusu kendi state'ini tutar: her tuşta mesaj listesi yeniden çizilmez.
const Composer = React.memo(function Composer({
  onSend,
  bottomPad,
}: {
  onSend: (content: string) => Promise<void> | void;
  bottomPad: number;
}) {
  const [text, setText] = useState('');

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await onSend(content);
  };

  return (
    <View style={[styles.inputRow, { paddingBottom: bottomPad }]}>
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
  );
});

const MessageBubble = React.memo(function MessageBubble({
  item,
  mine,
  deletable,
  onOpenPost,
  onOpenListing,
  onLongPress,
}: {
  item: ChatMessage;
  mine: boolean;
  deletable: boolean;
  onOpenPost?: (postId: string) => void;
  onOpenListing?: (listingId: string) => void;
  onLongPress: (item: ChatMessage, mine: boolean) => void;
}) {
  return (
    <View style={[styles.messageRow, mine && { justifyContent: 'flex-end' }]}>
      <Pressable
        style={styles.bubbleWrap}
        delayLongPress={350}
        onLongPress={deletable ? () => onLongPress(item, mine) : undefined}
      >
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          {!mine && item.profiles?.username ? (
            <Text style={styles.sender}>{item.profiles.username}</Text>
          ) : null}
          {item.shared_post ? (
            <Pressable onPress={() => onOpenPost?.(item.shared_post!.id)} style={styles.shareCard}>
              <Image
                source={{ uri: item.shared_post.image_url }}
                style={styles.shareImage}
                contentFit="cover"
                recyclingKey={item.id}
              />
              {item.shared_post.caption ? (
                <Text style={[styles.shareCaption, mine && { color: '#fff' }]} numberOfLines={2}>
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
            {formatTime(item.created_at)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

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

  // Bağlantı yoksa tek Text yeter; satır satır bölmek gereksiz iş.
  if (!listingId || !title) {
    return <Text style={[styles.messageText, mine && { color: '#fff' }]}>{item.content}</Text>;
  }

  const lines = item.content.split('\n');
  return (
    <Text style={[styles.messageText, mine && { color: '#fff' }]}>
      {lines.map((line, i) => {
        const isLink = line.trim() === title || line.includes(title);
        return (
          <Text
            key={`${item.id}-${i}`}
            onPress={isLink ? () => onOpenListing?.(listingId) : undefined}
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
  emptyWrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  bubbleWrap: {
    maxWidth: '78%',
  },
  bubble: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  sender: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, marginBottom: 2 },
  messageText: { fontSize: 15, color: colors.text, lineHeight: 20, flexShrink: 0 },
  listingLink: { color: '#2563EB', fontWeight: '700', textDecorationLine: 'underline' },
  listingLinkMine: { color: '#E8F8FF' },
  shareCard: { width: 180 },
  shareImage: { width: 180, height: 180, borderRadius: 10, backgroundColor: colors.border },
  shareCaption: { marginTop: 6, fontSize: 13, color: colors.text, lineHeight: 18 },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
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
