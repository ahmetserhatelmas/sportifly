import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  isAdmin?: boolean | null;
  isFieldOwner?: boolean | null;
  isInstructor?: boolean | null;
  style?: object;
};

export function RoleBadges({ isAdmin, isFieldOwner, isInstructor, style }: Props) {
  if (!isAdmin && !isFieldOwner && !isInstructor) return null;

  return (
    <View style={[styles.row, style]}>
      {isAdmin ? (
        <View style={[styles.badge, styles.badgeAdmin]}>
          <Text style={[styles.badgeText, styles.badgeAdminText]}>Admin</Text>
        </View>
      ) : null}
      {isFieldOwner ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Saha Sahibi</Text>
        </View>
      ) : null}
      {isInstructor ? (
        <View style={[styles.badge, styles.badgeAlt]}>
          <Text style={styles.badgeText}>Eğitmen</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeAlt: { backgroundColor: '#E8EEF9' },
  badgeAdmin: { backgroundColor: '#1F2430' },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  badgeAdminText: { color: '#fff' },
});
