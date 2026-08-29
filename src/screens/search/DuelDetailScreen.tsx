import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { duelStartsAt, isDuelPast } from '../../lib/duelTime';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Duel, LEVEL_LABELS, Profile } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DuelDetail'>;

type Participant = { user_id: string; profiles: Profile };

export function DuelDetailScreen({ route, navigation }: Props) {
  const { duelId } = route.params;
  const { session } = useAuth();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchDuel = useCallback(async () => {
    const [{ data: duelData }, { data: partData }, blocked] = await Promise.all([
      supabase
        .from('duels')
        .select('*, profiles!duels_creator_id_fkey(*)')
        .eq('id', duelId)
        .single(),
      supabase.from('duel_participants').select('user_id, profiles(*)').eq('duel_id', duelId),
      session?.user.id ? fetchBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
    ]);
    setDuel((duelData as Duel) ?? null);
    setParticipants((partData as unknown as Participant[]) ?? []);
    setBlockedIds(blocked);
    setLoaded(true);
  }, [duelId, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDuel();
    }, [fetchDuel])
  );

  if (!loaded) {
    return <SafeAreaView style={styles.safe} />;
  }

  if (!duel) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="ban-outline" title="Bu düello kullanılamıyor" />
      </SafeAreaView>
    );
  }

  const joined = participants.some((p) => p.user_id === session?.user.id);
  const visibleParticipants = participants.filter(
    (p) => !blockedIds.has(p.user_id) && p.profiles
  );
  const isCreator = duel.creator_id === session?.user.id;
  const isFull = participants.length >= duel.max_players;
  const isExpired = isDuelPast(duel.match_date, duel.start_time);

  const join = async () => {
    if (!session) return;
    setBusy(true);
    const { error } = await supabase
      .from('duel_participants')
      .insert({ duel_id: duelId, user_id: session.user.id });
    setBusy(false);
    if (error) {
      const message = error.message.includes('kontenjan')
        ? 'Kontenjan doldu, bu düelloya katılamazsın.'
        : 'Bir hata oluştu, tekrar deneyin.';
      Alert.alert('Katılamadın', message);
      fetchDuel();
    } else {
      fetchDuel();
    }
  };

  const leave = async () => {
    if (!session) return;
    setBusy(true);
    await supabase
      .from('duel_participants')
      .delete()
      .match({ duel_id: duelId, user_id: session.user.id });
    setBusy(false);
    fetchDuel();
  };

  const matchAt = duelStartsAt(duel.match_date, duel.start_time);
  const dateText = Number.isNaN(matchAt.getTime())
    ? String(duel.match_date).slice(0, 10)
    : matchAt.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={styles.card}>
          <View style={styles.sportRow}>
            <Text style={styles.sport}>{duel.sport}</Text>
            {isExpired ? (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>Tarihi Geçmiş</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{duel.title}</Text>
          {duel.description ? <Text style={styles.description}>{duel.description}</Text> : null}

          <View style={styles.infoGrid}>
            <InfoRow icon="location-outline" text={`${duel.city}, ${duel.district}`} />
            <InfoRow icon="calendar-outline" text={`${dateText} • ${String(duel.start_time).slice(0, 5)}`} />
            <InfoRow icon="people-outline" text={`${participants.length} / ${duel.max_players} oyuncu`} />
            <InfoRow icon="speedometer-outline" text={LEVEL_LABELS[duel.level]} />
            <InfoRow icon="person-outline" text={`Kurucu: ${duel.profiles?.username}`} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Katılımcılar</Text>
        <View style={styles.card}>
          {visibleParticipants.map((p) => (
            <Pressable
              key={p.user_id}
              style={styles.participant}
              onPress={() => navigation.navigate('UserProfile', { userId: p.user_id })}
            >
              <Avatar uri={p.profiles?.avatar_url} name={p.profiles?.username} size={38} />
              <Text style={styles.participantName}>{p.profiles?.username}</Text>
              {p.user_id === duel.creator_id && (
                <View style={styles.creatorBadge}>
                  <Text style={styles.creatorBadgeText}>Kurucu</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {joined && (
          <Button
            title="Maç Sohbeti"
            variant="outline"
            onPress={() => navigation.navigate('DuelChat', { duelId, title: duel.title })}
            style={{ marginTop: 16 }}
          />
        )}

        {!joined && (
          <Button
            title={
              isExpired ? 'Tarihi geçmiş' : isFull ? 'Kontenjan doldu' : 'Düelloya Katıl'
            }
            onPress={join}
            disabled={isFull || isExpired}
            loading={busy}
            style={{ marginTop: 16 }}
          />
        )}

        {joined && !isCreator && !isExpired && (
          <Button title="Düellodan Ayrıl" variant="danger" onPress={leave} loading={busy} style={{ marginTop: 12 }} />
        )}

        {isCreator && !isExpired && (
          <Button
            title="Düelloyu İptal Et"
            variant="danger"
            onPress={() =>
              Alert.alert(
                'Düelloyu İptal Et',
                'Düello tüm katılımcılar için silinecek. Emin misin?',
                [
                  { text: 'Vazgeç', style: 'cancel' },
                  {
                    text: 'İptal Et',
                    style: 'destructive',
                    onPress: async () => {
                      const { error } = await supabase.from('duels').delete().eq('id', duelId);
                      if (error) Alert.alert('Silinemedi', 'Bir hata oluştu, tekrar deneyin.');
                      else navigation.goBack();
                    },
                  },
                ]
              )
            }
            style={{ marginTop: 12 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadow.card,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sport: { fontSize: 13, fontWeight: '700', color: colors.primary },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expiredBadgeText: { fontSize: 11, fontWeight: '800', color: colors.danger },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  infoGrid: { marginTop: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  infoText: { marginLeft: 10, fontSize: 14, color: colors.text },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  participant: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  participantName: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  creatorBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creatorBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});
