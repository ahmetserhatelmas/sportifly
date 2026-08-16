import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { DuelCard } from '../../components/DuelCard';
import { EmptyState } from '../../components/EmptyState';
import { RoleBadges } from '../../components/RoleBadges';
import { Select } from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { CITIES, getDistricts } from '../../data/locations';
import { isDuelUpcoming, localDateString } from '../../lib/duelTime';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius, shadow } from '../../theme';
import { Duel, Profile, SPORTS } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'duels' | 'people';

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, session } = useAuth();
  const [mode, setMode] = useState<Mode>('duels');

  const [duels, setDuels] = useState<Duel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sport, setSport] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchDuels = useCallback(async () => {
    let q = supabase
      .from('duels')
      .select('*, profiles!duels_creator_id_fkey(*), duel_participants(user_id)')
      .gte('match_date', localDateString())
      .order('match_date', { ascending: true })
      .limit(100);

    if (sport) q = q.eq('sport', sport);
    if (city) q = q.eq('city', city);
    if (district) q = q.eq('district', district);

    const { data, error } = await q;
    if (error) {
      setDuels([]);
      return;
    }
    setDuels(
      (data ?? [])
        .filter((d: any) => isDuelUpcoming(d.match_date, d.start_time))
        .map((d: any) => ({
          ...d,
          participant_count: d.duel_participants?.length ?? 0,
          joined_by_me:
            d.duel_participants?.some((p: any) => p.user_id === session?.user.id) ?? false,
        }))
    );
  }, [sport, city, district, session?.user.id]);

  const searchPeople = useCallback(
    async (text: string) => {
      const term = text
        .trim()
        .replace(/^@/, '')
        .replace(/[%_,.()]/g, '');
      if (term.length < 2) {
        setPeople([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .order('username', { ascending: true })
        .limit(30);

      if (!error) setPeople((data as Profile[]) ?? []);
      setSearching(false);
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      if (mode === 'duels') fetchDuels();
    }, [fetchDuels, mode])
  );

  useEffect(() => {
    if (mode !== 'people') return;
    const t = setTimeout(() => searchPeople(query), 300);
    return () => clearTimeout(t);
  }, [query, mode, searchPeople]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (mode === 'duels') await fetchDuels();
    else await searchPeople(query);
    setRefreshing(false);
  };

  const districts = useMemo(() => (city ? getDistricts(city) : []), [city]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Merhaba, {profile?.username ?? 'sporcu'}</Text>
          <Text style={styles.subGreeting}>
            {mode === 'duels' ? 'Bugün hangi maça çıkıyorsun?' : 'Kullanıcı adına göre ara'}
          </Text>
        </View>
      </View>

      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, mode === 'duels' && styles.modeTabActive]}
          onPress={() => setMode('duels')}
        >
          <Text style={[styles.modeTabText, mode === 'duels' && styles.modeTabTextActive]}>
            Düellolar
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, mode === 'people' && styles.modeTabActive]}
          onPress={() => setMode('people')}
        >
          <Text style={[styles.modeTabText, mode === 'people' && styles.modeTabTextActive]}>
            Kişiler
          </Text>
        </Pressable>
      </View>

      {mode === 'duels' ? (
        <>
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip label="Hepsi" selected={!sport} onPress={() => setSport(null)} />
              {SPORTS.map((s) => (
                <Chip key={s} label={s} selected={sport === s} onPress={() => setSport(s)} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filters}>
            <Select
              placeholder="İl seçiniz"
              value={city}
              options={CITIES}
              onSelect={(value) => {
                setCity(value);
                setDistrict(null);
              }}
              style={{ flex: 1, marginRight: 8, height: 42 }}
            />
            <Select
              placeholder="İlçe seçiniz"
              value={district}
              options={districts}
              onSelect={setDistrict}
              disabled={!city}
              style={{ flex: 1, height: 42 }}
            />
            {(city || district) && (
              <Pressable
                onPress={() => {
                  setCity(null);
                  setDistrict(null);
                }}
                style={styles.clearBtn}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={duels}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title="Aktif düello bulunamadı"
                subtitle="Filtreleri değiştirmeyi dene veya kendi düellonu oluştur."
              />
            }
            renderItem={({ item }) => (
              <DuelCard
                duel={item}
                onPress={() => navigation.navigate('DuelDetail', { duelId: item.id })}
              />
            )}
          />

          <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateDuel')}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.fabText}>Düello Oluştur</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı adı veya isim yaz..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>

          <FlatList
            data={people}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title={
                  query.trim().length < 2
                    ? 'Kişi ara'
                    : searching
                      ? 'Aranıyor...'
                      : 'Sonuç bulunamadı'
                }
                subtitle={
                  query.trim().length < 2
                    ? 'En az 2 karakter yazarak kullanıcı adına veya isme göre ara.'
                    : 'Farklı bir kullanıcı adı dene.'
                }
              />
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.personCard}
                onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
              >
                <Avatar uri={item.avatar_url} name={item.username} size={48} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.personName}>@{item.username}</Text>
                  {item.full_name ? (
                    <Text style={styles.personFull}>{item.full_name}</Text>
                  ) : null}
                  <RoleBadges
                    isAdmin={item.is_admin}
                    isFieldOwner={item.is_field_owner}
                    isInstructor={item.is_instructor}
                    style={{ marginTop: 6, justifyContent: 'flex-start' }}
                  />
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  modeTabActive: { backgroundColor: colors.card, ...shadow.card },
  modeTabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modeTabTextActive: { color: colors.primary },
  chips: { paddingHorizontal: 16, paddingBottom: 12 },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  clearBtn: { marginLeft: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    ...shadow.card,
  },
  personName: { fontSize: 15, fontWeight: '800', color: colors.text },
  personFull: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
});
