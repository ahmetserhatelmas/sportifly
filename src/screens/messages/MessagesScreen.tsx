import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  blockUser,
  fetchBlockedIds,
  fetchHiddenMessageIds,
  fetchHiddenPartners,
  fetchMutedPartners,
  hideConversation,
  muteConversation,
  reportUser,
  unmuteConversation,
} from '../../lib/chatModeration';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Profile } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

type Row = {
  profile: Profile;
  unread: number;
  lastMessage: string;
  lastAt: string;
  muted: boolean;
};

type DmRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export function MessagesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [menuRow, setMenuRow] = useState<Row | null>(null);
  const openSwipeRef = useRef<Swipeable | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;

    const [{ data: messages }, hiddenIds, hides, mutes, blocked] = await Promise.all([
      supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at, read_at')
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .order('created_at', { ascending: false })
        .limit(500),
      fetchHiddenMessageIds(me),
      fetchHiddenPartners(me),
      fetchMutedPartners(me),
      fetchBlockedIds(me),
    ]);

    const msgs = ((messages as DmRow[]) ?? []).filter((m) => !hiddenIds.has(m.id));
    if (msgs.length === 0) {
      setRows([]);
      return;
    }

    const partnerIds = [
      ...new Set(msgs.map((m) => (m.sender_id === me ? m.receiver_id : m.sender_id))),
    ];

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', partnerIds);
    const profileMap = new Map(((profiles as Profile[]) ?? []).map((p) => [p.id, p]));
    const byPartner = new Map<string, Row>();

    for (const m of msgs) {
      const partnerId = m.sender_id === me ? m.receiver_id : m.sender_id;
      if (blocked.has(partnerId)) continue;
      if (byPartner.has(partnerId)) continue;
      const hiddenAt = hides.get(partnerId);
      if (hiddenAt && m.created_at <= hiddenAt) continue;
      const profile = profileMap.get(partnerId);
      if (!profile) continue;
      byPartner.set(partnerId, {
        profile,
        unread: 0,
        lastMessage: m.content,
        lastAt: m.created_at,
        muted: mutes.has(partnerId),
      });
    }

    for (const m of msgs) {
      if (m.receiver_id === me && !m.read_at) {
        const row = byPartner.get(m.sender_id);
        if (row) row.unread += 1;
      }
    }

    setRows(
      [...byPartner.values()].sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      )
    );
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [fetchThreads])
  );

  const closeMenu = () => setMenuRow(null);

  const runMute = async (row: Row) => {
    if (!session) return;
    const { error } = row.muted
      ? await unmuteConversation(session.user.id, row.profile.id)
      : await muteConversation(session.user.id, row.profile.id);
    if (error) {
      Alert.alert('Sessize al', 'İşlem yapılamadı.');
      return;
    }
    fetchThreads();
  };

  const confirmBlock = (row: Row) => {
    if (!session) return;
    Alert.alert('Engelle', `${row.profile.username} engellensin mi? Sana mesaj atamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          const { error } = await blockUser(session.user.id, row.profile.id);
          if (error) {
            Alert.alert('Engelleme', 'İşlem yapılamadı.');
            return;
          }
          fetchThreads();
        },
      },
    ]);
  };

  const runReport = async (row: Row) => {
    if (!session) return;
    const { error } = await reportUser(session.user.id, row.profile.id);
    if (error) {
      Alert.alert('Rapor', 'Rapor gönderilemedi.');
      return;
    }
    Alert.alert('Teşekkürler', 'Raporun iletildi.');
  };

  const confirmHide = (row: Row) => {
    if (!session) return;
    Alert.alert(
      'Sohbeti sil',
      'Sohbet yalnızca senden silinir. Karşı tarafta durmaya devam eder.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const { error } = await hideConversation(session.user.id, row.profile.id);
            if (error) {
              Alert.alert('Sohbet', 'Sohbet silinemedi.');
              return;
            }
            fetchThreads();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.profile.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Henüz mesajın yok"
            subtitle="Birini takip edip profilinden mesaj atabilirsin; gelen sohbetler burada görünür."
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            onOpen={() =>
              navigation.navigate('DirectChat', {
                userId: item.profile.id,
                username: item.profile.username,
              })
            }
            onMenu={() => setMenuRow(item)}
            onSwipeOpen={(ref) => {
              if (openSwipeRef.current && openSwipeRef.current !== ref) {
                openSwipeRef.current.close();
              }
              openSwipeRef.current = ref;
            }}
          />
        )}
      />

      <Modal
        visible={!!menuRow}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.sheetWrap}>
          <Pressable style={styles.sheetBackdrop} onPress={closeMenu} />
          {menuRow ? (
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{menuRow.profile.username}</Text>
              <SheetBtn
                label={menuRow.muted ? 'Sesi aç' : 'Sessize al'}
                onPress={() => {
                  closeMenu();
                  runMute(menuRow);
                }}
              />
              <SheetBtn
                label="Engelle"
                onPress={() => {
                  closeMenu();
                  confirmBlock(menuRow);
                }}
              />
              <SheetBtn
                label="Raporla"
                onPress={() => {
                  closeMenu();
                  runReport(menuRow);
                }}
              />
              <SheetBtn
                label="Sohbeti sil"
                danger
                onPress={() => {
                  closeMenu();
                  confirmHide(menuRow);
                }}
              />
              <SheetBtn label="Vazgeç" onPress={closeMenu} />
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SheetBtn({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.sheetBtn} onPress={onPress}>
      <Text style={[styles.sheetBtnText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

function ConversationRow({
  item,
  onOpen,
  onMenu,
  onSwipeOpen,
}: {
  item: Row;
  onOpen: () => void;
  onMenu: () => void;
  onSwipeOpen: (ref: Swipeable) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={28}
      onSwipeableWillOpen={() => {
        if (swipeRef.current) onSwipeOpen(swipeRef.current);
      }}
      renderRightActions={() => (
        <Pressable
          style={styles.swipeMenu}
          onPress={() => {
            swipeRef.current?.close();
            onMenu();
          }}
        >
          <Ionicons name="menu" size={22} color="#fff" />
        </Pressable>
      )}
    >
      <Pressable style={styles.row} onPress={onOpen}>
        <Avatar uri={item.profile.avatar_url} name={item.profile.username} size={46} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.name, item.unread > 0 && styles.nameUnread]}>
            {item.profile.username}
          </Text>
          <Text
            style={[styles.preview, item.unread > 0 && styles.previewUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        {item.muted ? (
          <Ionicons
            name="notifications-off-outline"
            size={18}
            color={colors.textMuted}
            style={{ marginRight: 8 }}
          />
        ) : null}
        {item.unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  sheetWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  sheetBtn: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
  swipeMenu: {
    width: 56,
    marginBottom: 10,
    marginLeft: 8,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  nameUnread: { fontWeight: '800' },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
