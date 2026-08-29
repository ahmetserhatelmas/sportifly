import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuelDateTime } from '../lib/duelTime';
import { colors, shadow } from '../theme';
import { Duel } from '../types';
import { Avatar } from './Avatar';

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Futbol: 'football-outline',
  Basketbol: 'basketball-outline',
  Voleybol: 'baseball-outline',
  Tenis: 'tennisball-outline',
  'Masa Tenisi': 'tennisball-outline',
  Badminton: 'tennisball-outline',
};

export function DuelCard({
  duel,
  onPress,
  compact,
}: {
  duel: Duel;
  onPress: () => void;
  compact?: boolean;
}) {
  const count = duel.participant_count ?? 0;
  const ratio = Math.min(count / duel.max_players, 1);
  const initials = (duel.profiles?.username ?? '?').slice(0, 2).toUpperCase();
  const full = count >= duel.max_players;

  if (compact) {
    return (
      <Pressable style={styles.compact} onPress={onPress}>
        <View style={styles.sportIcon}>
          <Ionicons
            name={SPORT_ICONS[duel.sport] ?? 'trophy-outline'}
            size={16}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {duel.title}
          </Text>
          <Text style={styles.compactMeta} numberOfLines={1}>
            {formatDuelDateTime(duel.match_date, duel.start_time)} · {count}/{duel.max_players}
          </Text>
        </View>
        {full ? (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>Dolu</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.sportRow}>
          <View style={styles.sportIcon}>
            <Ionicons
              name={SPORT_ICONS[duel.sport] ?? 'trophy-outline'}
              size={16}
              color={colors.primary}
            />
          </View>
          <Text style={styles.sportName}>{duel.sport}</Text>
        </View>
        <View style={styles.countRow}>
          {full ? (
            <View style={[styles.fullBadge, { marginRight: 8 }]}>
              <Text style={styles.fullBadgeText}>Dolu</Text>
            </View>
          ) : null}
          <Ionicons name="people" size={15} color={colors.textSecondary} />
          <Text style={styles.countText}>
            {count} / {duel.max_players}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{duel.title}</Text>
      {duel.description ? (
        <Text style={styles.description} numberOfLines={1}>
          {duel.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {duel.city}, {duel.district}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatDuelDateTime(duel.match_date, duel.start_time)}</Text>
          </View>
        </View>
        <View style={styles.creator}>
          <Text style={styles.creatorName}>{duel.profiles?.username}</Text>
          <Avatar uri={duel.profiles?.avatar_url} name={initials} size={32} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sportRow: { flexDirection: 'row', alignItems: 'center' },
  sportIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sportName: { fontSize: 14, fontWeight: '700', color: colors.primary },
  countRow: { flexDirection: 'row', alignItems: 'center' },
  countText: { marginLeft: 4, fontSize: 13, fontWeight: '700', color: colors.text },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { marginLeft: 6, fontSize: 13, color: colors.textSecondary },
  creator: { flexDirection: 'row', alignItems: 'center' },
  creatorName: { fontSize: 12, color: colors.textSecondary, marginRight: 8 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  compactTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  compactMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  fullBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fullBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
});
