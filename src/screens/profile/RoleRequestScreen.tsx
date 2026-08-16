import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { RoleRequest, RoleRequestRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleRequest'>;

const ROLE_META: Record<
  RoleRequestRole,
  { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  field_owner: {
    title: 'Saha Sahibi',
    subtitle: 'Açıklama ve belge ekleyerek ayrı başvur. Onay sonrası saha ilanı açabilirsin.',
    icon: 'business-outline',
  },
  instructor: {
    title: 'Eğitmen',
    subtitle: 'Deneyimini ve sertifikanı ekleyerek ayrı başvur. Onay sonrası ders ilanı açabilirsin.',
    icon: 'school-outline',
  },
};

export function RoleRequestScreen({ navigation }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState<RoleRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    if (!session) return;
    await refreshProfile();
    const { data } = await supabase
      .from('role_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setRequests((data as RoleRequest[]) ?? []);
  }, [session, refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const hasRole = (role: RoleRequestRole) =>
    role === 'field_owner' ? !!profile?.is_field_owner : !!profile?.is_instructor;

  const latestFor = (role: RoleRequestRole) => requests.find((r) => r.role === role);

  const statusLabel = (role: RoleRequestRole) => {
    if (hasRole(role)) return { text: 'Yetkin var', color: colors.primary };
    const req = latestFor(role);
    if (!req) return null;
    if (req.status === 'pending') return { text: 'İnceleniyor', color: '#D97706' };
    if (req.status === 'rejected') return { text: 'Reddedildi — yeniden başvurabilirsin', color: colors.danger };
    if (req.status === 'accepted') return { text: 'Onaylandı', color: colors.primary };
    return null;
  };

  const canRequest = (role: RoleRequestRole) => {
    if (hasRole(role)) return false;
    const req = latestFor(role);
    return !req || req.status === 'rejected';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Her yetki için ayrı başvuru yapılır. Açıklama yazıp PDF veya görsel belge
          ekleyebilirsin; ekibimiz inceleyip onaylar.
        </Text>

        {(Object.keys(ROLE_META) as RoleRequestRole[]).map((role) => {
          const meta = ROLE_META[role];
          const status = statusLabel(role);
          const open = canRequest(role);
          return (
            <Pressable
              key={role}
              style={styles.card}
              disabled={!open}
              onPress={() => navigation.navigate('RoleRequestForm', { role })}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name={meta.icon} size={22} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{meta.title}</Text>
                  <Text style={styles.cardSub}>{meta.subtitle}</Text>
                </View>
                {open ? (
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                ) : null}
              </View>
              {status ? (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>
              ) : (
                <Text style={styles.cta}>Başvuruya devam et →</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  intro: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '700', flex: 1 },
  cta: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
