import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors, radius } from '../../theme';
import { Profile, RoleRequest, RoleRequestStatus } from '../../types';

type Row = RoleRequest & { profiles: Profile | null };

type Tab = 'pending' | 'all';

const ROLE_LABEL = {
  field_owner: 'Saha Sahibi',
  instructor: 'Eğitmen',
} as const;

const STATUS_META: Record<RoleRequestStatus, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: '#D97706' },
  accepted: { label: 'Onaylandı', color: colors.primary },
  rejected: { label: 'Reddedildi', color: colors.danger },
};

export function AdminRoleRequestsScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    let q = supabase
      .from('role_requests')
      .select('*, profiles!role_requests_user_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (tab === 'pending') q = q.eq('status', 'pending');

    const { data, error } = await q;
    if (error) {
      console.warn('Admin başvurular:', error.message);
      setRows([]);
      return;
    }
    setRows((data as Row[]) ?? []);
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      fetchRows();
    }, [fetchRows])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  const decide = (item: Row, decision: 'accepted' | 'rejected') => {
    const roleName = ROLE_LABEL[item.role];
    const userName = item.profiles?.username ?? 'kullanıcı';
    Alert.alert(
      decision === 'accepted' ? 'Başvuruyu onayla' : 'Başvuruyu reddet',
      decision === 'accepted'
        ? `@${userName} için ${roleName} yetkisi verilecek. Emin misin?`
        : `@${userName} başvurusu reddedilecek. Emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: decision === 'accepted' ? 'Onayla' : 'Reddet',
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setBusyId(item.id);
            const { error } = await supabase.rpc('admin_review_role_request', {
              p_request_id: item.id,
              p_decision: decision,
            });
            setBusyId(null);
            if (error) {
              Alert.alert('İşlem başarısız', error.message);
              return;
            }
            fetchRows();
          },
        },
      ]
    );
  };

  if (!profile?.is_admin) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon="lock-closed-outline"
          title="Yetkisiz erişim"
          subtitle="Bu ekran yalnızca admin hesapları için."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>Bekleyen</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'all' && styles.tabActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Tümü</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {rows.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title={tab === 'pending' ? 'Bekleyen başvuru yok' : 'Henüz başvuru yok'}
            subtitle="Yeni başvurular burada listelenir."
          />
        ) : (
          rows.map((item) => {
            const status = STATUS_META[item.status];
            const busy = busyId === item.id;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Avatar
                    uri={item.profiles?.avatar_url}
                    name={item.profiles?.username}
                    size={42}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.username}>@{item.profiles?.username ?? '—'}</Text>
                    <Text style={styles.fullName}>
                      {item.profiles?.full_name || 'İsimsiz'}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: status.color + '22' }]}>
                    <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.roleRow}>
                  <Ionicons
                    name={item.role === 'field_owner' ? 'business-outline' : 'school-outline'}
                    size={16}
                    color={colors.primaryDark}
                  />
                  <Text style={styles.roleText}>{ROLE_LABEL[item.role]}</Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Text style={styles.description}>
                  {item.description || item.note || 'Açıklama yok'}
                </Text>

                {item.attachment_url ? (
                  <Pressable
                    style={styles.fileBtn}
                    onPress={() => Linking.openURL(item.attachment_url!)}
                  >
                    <Ionicons name="document-attach-outline" size={18} color={colors.primaryDark} />
                    <Text style={styles.fileText} numberOfLines={1}>
                      {item.attachment_name || 'Ek dosyayı aç'}
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.textMuted} />
                  </Pressable>
                ) : null}

                {item.status === 'pending' ? (
                  <View style={styles.actions}>
                    <Button
                      title="Reddet"
                      variant="danger"
                      onPress={() => decide(item, 'rejected')}
                      loading={busy}
                      style={{ flex: 1, height: 44 }}
                    />
                    <Button
                      title="Onayla"
                      onPress={() => decide(item, 'accepted')}
                      loading={busy}
                      style={{ flex: 1, height: 44, marginLeft: 10 }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 15, fontWeight: '800', color: colors.text },
  fullName: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '800' },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  roleText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    flex: 1,
  },
  date: { fontSize: 12, color: colors.textMuted },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  fileBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileText: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  actions: { flexDirection: 'row', marginTop: 14 },
});
