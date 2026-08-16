import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { formatSlot } from '../../lib/booking';
import { Listing } from '../../types';

type Purchase = {
  id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  listing_id: string;
  slot_date: string | null;
  slot_time: string | null;
  listings: Listing | null;
};

const STATUS_LABELS = {
  pending: 'Onay bekliyor',
  accepted: 'Onaylandı',
  rejected: 'Reddedildi',
} as const;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PurchasesScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const fetchPurchases = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('purchases')
      .select('id, created_at, status, listing_id, slot_date, slot_time, listings(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setPurchases((data as unknown as Purchase[]) ?? []);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, [fetchPurchases])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="bag-outline"
            title="Henüz satın alım yok"
            subtitle="Kiraladığın sahalar ve aldığın dersler burada listelenecek."
          />
        }
        renderItem={({ item }) => {
          const listing = item.listings;
          const listingId = listing?.id ?? item.listing_id;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => {
                if (listingId) navigation.navigate('ListingDetail', { listingId });
              }}
            >
              <View style={styles.icon}>
                <Ionicons
                  name={listing?.type === 'field' ? 'business-outline' : 'school-outline'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{listing?.title ?? 'İlan'}</Text>
                <Text style={styles.meta}>
                  {listing?.type === 'field' ? 'Saha Kiralama' : 'Ders'} •{' '}
                  {formatSlot(item.slot_date, item.slot_time) ??
                    new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'accepted' && { backgroundColor: colors.primarySoft },
                    item.status === 'rejected' && { backgroundColor: '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'accepted' && { color: colors.primaryDark },
                      item.status === 'rejected' && { color: colors.danger },
                    ]}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>
                  {Number(listing?.price ?? 0).toLocaleString('tr-TR')} ₺
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
});
