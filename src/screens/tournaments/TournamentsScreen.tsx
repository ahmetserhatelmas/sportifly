import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export function TournamentsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.pageTitle}>Turnuvalar</Text>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="trophy-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Çok Yakında...</Text>
        <Text style={styles.subtitle}>
          Turnuva özelliği üzerinde çalışıyoruz. Çok yakında şehrindeki turnuvalara katılabilecek
          ve kendi turnuvanı düzenleyebileceksin.
        </Text>
      </View>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: -60 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
});
