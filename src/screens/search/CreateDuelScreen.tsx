import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { DateTimeField } from '../../components/DateTimeField';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { CITIES, getDistricts } from '../../data/locations';
import { localDateString } from '../../lib/duelTime';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { DuelLevel, LEVEL_LABELS, SPORTS } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateDuel'>;

const PLAYER_OPTIONS = Array.from({ length: 11 }, (_, i) => String(i + 2)); // 2..12
const LEVEL_OPTIONS = Object.keys(LEVEL_LABELS) as DuelLevel[];

export function CreateDuelScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [tab, setTab] = useState<0 | 1>(0);
  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [title, setTitle] = useState('');
  const [rules, setRules] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<string | null>(null);
  const [level, setLevel] = useState<DuelLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const districts = useMemo(() => (city ? getDistricts(city) : []), [city]);

  const create = async () => {
    if (!session) return;
    if (!title.trim()) return Alert.alert('Eksik bilgi', 'Lütfen bir başlık girin.');
    if (!date || !time) return Alert.alert('Eksik bilgi', 'Maç tarihi ve başlangıç saatini seçin.');
    if (!city || !district) return Alert.alert('Eksik bilgi', 'İl ve ilçe seçin.');
    if (!maxPlayers) return Alert.alert('Eksik bilgi', 'Maksimum oyuncu sayısını seçin.');
    if (!level) return Alert.alert('Eksik bilgi', 'Oynayış seviyenizi seçin.');

    setLoading(true);
    try {
      const matchDate = localDateString(date);
      const startTime = time.toTimeString().slice(0, 5);

      const { data, error } = await supabase
        .from('duels')
        .insert({
          creator_id: session.user.id,
          sport,
          title: title.trim(),
          description: rules.trim() || null,
          city,
          district,
          match_date: matchDate,
          start_time: startTime,
          max_players: Number(maxPlayers),
          level,
        })
        .select('id')
        .single();
      if (error) throw error;

      await supabase.from('duel_participants').insert({
        duel_id: data.id,
        user_id: session.user.id,
      });

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Oluşturulamadı', e.message ?? 'Bir hata oluştu, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.title}>Yeni Düello Oluştur</Text>
          <Text style={styles.subtitle}>Rakibini bul ve sahaya çık.</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => setTab(0)}>
          <Text style={[styles.tabText, tab === 0 && styles.tabActive]}>Maç Bilgileri</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setTab(1)}>
          <Text style={[styles.tabText, tab === 1 && styles.tabActive]}>Oyuncu Bilgileri</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {tab === 0 ? (
            <>
              <Text style={styles.sectionLabel}>Spor Branşı</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 20 }}
              >
                {SPORTS.map((s) => (
                  <Chip key={s} label={s} selected={sport === s} onPress={() => setSport(s)} />
                ))}
              </ScrollView>

              <Input
                label="Başlık"
                placeholder="Örn: Acıbadem 5v5 Dostluk Maçı"
                value={title}
                onChangeText={setTitle}
              />
              <Input
                label="Kurallar"
                placeholder="Maç hakkında kısa bilgiler..."
                multiline
                value={rules}
                onChangeText={setRules}
              />

              <View style={styles.row}>
                <DateTimeField
                  label="Maç Tarihi"
                  placeholder="Seçiniz"
                  mode="date"
                  value={date}
                  onChange={setDate}
                  style={{ marginRight: 12 }}
                />
                <DateTimeField
                  label="Başlangıç Saati"
                  placeholder="00:00"
                  mode="time"
                  value={time}
                  onChange={setTime}
                />
              </View>
            </>
          ) : (
            <>
              <View style={[styles.row, { marginBottom: 16 }]}>
                <Select
                  placeholder="İl seçiniz"
                  value={city}
                  options={CITIES}
                  onSelect={(value) => {
                    setCity(value);
                    setDistrict(null);
                  }}
                  style={{ flex: 1, marginRight: 12 }}
                />
                <Select
                  placeholder="İlçe seçiniz"
                  value={district}
                  options={districts}
                  onSelect={setDistrict}
                  disabled={!city}
                  style={{ flex: 1 }}
                />
              </View>

              <Select
                placeholder="Maximum oyuncu sayısı seçiniz"
                value={maxPlayers}
                options={PLAYER_OPTIONS}
                onSelect={setMaxPlayers}
                renderLabel={(v) => `${v} oyuncu`}
                style={{ marginBottom: 16 }}
              />

              <Select
                placeholder="Oynayış seviyenizi seçiniz"
                value={level}
                options={LEVEL_OPTIONS}
                onSelect={(v) => setLevel(v as DuelLevel)}
                renderLabel={(v) => LEVEL_LABELS[v as DuelLevel]}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Düello oluştur" onPress={create} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  tabActive: { color: colors.primary },
  form: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  row: { flexDirection: 'row' },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
