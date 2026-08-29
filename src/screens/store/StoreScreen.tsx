import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { Stars } from '../../components/Stars';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Listing, ListingType } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function StoreScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, session } = useAuth();
  const [tab, setTab] = useState<ListingType>('field');
  const [listings, setListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const canCreate =
    !!profile?.is_admin ||
    (tab === 'field' ? !!profile?.is_field_owner : !!profile?.is_instructor);

  const fetchListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(*), listing_reviews(rating)')
      .eq('type', tab)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const blocked = session?.user.id
        ? await fetchBlockedIds(session.user.id)
        : new Set<string>();
      setListings(
        data
          .filter((l: any) => !blocked.has(l.owner_id))
          .map((l: any) => {
          const ratings = l.listing_reviews?.map((r: any) => r.rating) ?? [];
          return {
            ...l,
            review_count: ratings.length,
            avg_rating: ratings.length
              ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
              : 0,
          };
        })
      );
    }
  }, [tab, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.pageTitle}>Mağaza</Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'field' && styles.tabActive]}
          onPress={() => setTab('field')}
        >
          <Text style={[styles.tabText, tab === 'field' && styles.tabTextActive]}>Sahalar</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'lesson' && styles.tabActive]}
          onPress={() => setTab('lesson')}
        >
          <Text style={[styles.tabText, tab === 'lesson' && styles.tabTextActive]}>Dersler</Text>
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'field' ? 'business-outline' : 'school-outline'}
            title={tab === 'field' ? 'Henüz saha ilanı yok' : 'Henüz ders ilanı yok'}
            subtitle={
              canCreate
                ? 'İlk ilanı sen oluştur!'
                : 'İlanları buradan inceleyip satın alabilirsin.'
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImageFallback]}>
                <Ionicons
                  name={item.type === 'field' ? 'business-outline' : 'school-outline'}
                  size={32}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardSport}>{item.sport}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.cardMeta}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.cardMetaText}>
                  {item.city}, {item.district}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Stars rating={item.avg_rating ?? 0} size={13} />
                  <Text style={styles.reviewCount}>({item.review_count})</Text>
                </View>
                <Text style={styles.price}>
                  {Number(item.price).toLocaleString('tr-TR')} ₺
                  <Text style={styles.priceUnit}>{item.type === 'field' ? '/saat' : '/ders'}</Text>
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {canCreate ? (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('CreateListing', { type: tab })}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>İlan Oluştur</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.fab, styles.fabMuted]}
          onPress={() => navigation.navigate('RoleRequest')}
        >
          <Ionicons name="ribbon-outline" size={20} color="#fff" />
          <Text style={styles.fabText}>
            {tab === 'field' ? 'Saha Sahibi Ol' : 'Eğitmen Ol'}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.card, ...shadow.card },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardImage: { width: 104, height: 116, backgroundColor: colors.border },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  cardBody: { flex: 1, padding: 12 },
  cardSport: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardMetaText: { marginLeft: 4, fontSize: 12, color: colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reviewCount: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text },
  priceUnit: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 52,
    ...shadow.card,
    shadowOpacity: 0.2,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 },
  fabMuted: { backgroundColor: colors.textSecondary },
});
