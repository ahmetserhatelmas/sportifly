import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { duelStartsAt, formatDuelDateTime, isDuelPast } from '../../lib/duelTime';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Duel, Listing } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MyDuel = Duel & { is_creator: boolean };

export function MyListingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [tab, setTab] = useState<'listings' | 'duels'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [duels, setDuels] = useState<MyDuel[]>([]);

  const fetchAll = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;

    const [{ data: myListings }, { data: created }, { data: joined }] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('owner_id', uid)
        .order('created_at', { ascending: false }),
      supabase.from('duels').select('*').eq('creator_id', uid),
      supabase.from('duel_participants').select('duels(*)').eq('user_id', uid),
    ]);

    setListings((myListings as Listing[]) ?? []);

    const map = new Map<string, MyDuel>();
    for (const d of (created as Duel[]) ?? []) {
      map.set(d.id, { ...d, is_creator: true });
    }
    for (const row of (joined as any[]) ?? []) {
      const d = row.duels as Duel | null;
      if (d && !map.has(d.id)) map.set(d.id, { ...d, is_creator: false });
    }
    setDuels(
      [...map.values()].sort(
        (a, b) =>
          duelStartsAt(b.match_date, b.start_time).getTime() -
          duelStartsAt(a.match_date, a.start_time).getTime()
      )
    );
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const deleteListing = (listing: Listing) => {
    Alert.alert('İlanı Sil', `"${listing.title}" ilanını silmek istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('listings').delete().eq('id', listing.id);
          if (error) Alert.alert('Silinemedi', 'Bir hata oluştu, tekrar deneyin.');
          else fetchAll();
        },
      },
    ]);
  };

  const deleteDuel = (duel: MyDuel) => {
    Alert.alert('Düelloyu İptal Et', `"${duel.title}" düellosunu iptal etmek istediğine emin misin? Tüm katılımcılar için silinir.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('duels').delete().eq('id', duel.id);
          if (error) Alert.alert('Silinemedi', 'Bir hata oluştu, tekrar deneyin.');
          else fetchAll();
        },
      },
    ]);
  };

  const leaveDuel = (duel: MyDuel) => {
    if (!session) return;
    Alert.alert('Düellodan Ayrıl', `"${duel.title}" düellosundan ayrılmak istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('duel_participants')
            .delete()
            .match({ duel_id: duel.id, user_id: session.user.id });
          fetchAll();
        },
      },
    ]);
  };

  const activeDuels = duels.filter((d) => !isDuelPast(d.match_date, d.start_time));
  const pastDuels = duels.filter((d) => isDuelPast(d.match_date, d.start_time));

  const renderDuel = (duel: MyDuel, past: boolean) => (
    <Pressable
      key={duel.id}
      style={styles.card}
      onPress={() => navigation.navigate('DuelDetail', { duelId: duel.id })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardSport}>{duel.sport}</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {duel.title}
        </Text>
        <Text style={styles.cardMeta}>
          {duel.city}, {duel.district} • {formatDuelDateTime(duel.match_date, duel.start_time)}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: past ? '#FEE2E2' : colors.primarySoft },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: past ? colors.danger : colors.primaryDark },
              ]}
            >
              {past ? 'Tarihi Geçmiş' : 'Aktif'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.background, marginLeft: 6 }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {duel.is_creator ? 'Kurucusun' : 'Katılımcısın'}
            </Text>
          </View>
        </View>
      </View>
      {!past && (
        <Pressable
          style={styles.deleteBtn}
          hitSlop={6}
          onPress={() => (duel.is_creator ? deleteDuel(duel) : leaveDuel(duel))}
        >
          <Ionicons
            name={duel.is_creator ? 'trash-outline' : 'exit-outline'}
            size={20}
            color={colors.danger}
          />
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'listings' && styles.tabActive]}
          onPress={() => setTab('listings')}
        >
          <Text style={[styles.tabText, tab === 'listings' && styles.tabTextActive]}>
            Saha & Ders
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'duels' && styles.tabActive]}
          onPress={() => setTab('duels')}
        >
          <Text style={[styles.tabText, tab === 'duels' && styles.tabTextActive]}>Düellolar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'listings' ? (
          listings.length === 0 ? (
            <EmptyState
              icon="pricetags-outline"
              title="Henüz ilanın yok"
              subtitle="Mağaza sekmesinden saha veya ders ilanı oluşturabilirsin."
            />
          ) : (
            listings.map((l) => (
              <Pressable
                key={l.id}
                style={styles.card}
                onPress={() => navigation.navigate('ListingDetail', { listingId: l.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSport}>{l.sport}</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {l.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {l.type === 'field' ? 'Saha Kiralama' : 'Ders'} • {l.city}, {l.district} •{' '}
                    {Number(l.price).toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
                <Pressable style={styles.deleteBtn} hitSlop={6} onPress={() => deleteListing(l)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </Pressable>
            ))
          )
        ) : duels.length === 0 ? (
          <EmptyState
            icon="flash-outline"
            title="Henüz düellon yok"
            subtitle="Arama sekmesinden düello oluşturabilir veya katılabilirsin."
          />
        ) : (
          <>
            {activeDuels.length > 0 && <Text style={styles.sectionTitle}>Aktif</Text>}
            {activeDuels.map((d) => renderDuel(d, false))}
            {pastDuels.length > 0 && (
              <Text style={[styles.sectionTitle, activeDuels.length > 0 && { marginTop: 16 }]}>
                Tarihi Geçmiş
              </Text>
            )}
            {pastDuels.map((d) => renderDuel(d, true))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.card, ...shadow.card },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  cardSport: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
