import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedProfiles, unblockUser } from '../../lib/chatModeration';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Profile } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BlockedUsers'>;

export function BlockedUsersScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [people, setPeople] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!session) return;
    setPeople(await fetchBlockedProfiles(session.user.id));
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const removeBlock = (person: Profile) => {
    if (!session || busyId) return;
    Alert.alert('Engeli kaldır', `@${person.username} engeli kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        onPress: async () => {
          setBusyId(person.id);
          const { error } = await unblockUser(session.user.id, person.id);
          setBusyId(null);
          if (error) {
            Alert.alert('Engel', 'İşlem yapılamadı.');
            return;
          }
          setPeople((prev) => prev.filter((p) => p.id !== person.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="ban-outline"
            title="Engellenen yok"
            subtitle="Birini engellediğinde burada görünür."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.person}
              onPress={() => navigation.push('UserProfile', { userId: item.id })}
            >
              <Avatar uri={item.avatar_url} name={item.username} size={46} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.full_name || item.username}</Text>
                <Text style={styles.subName}>@{item.username}</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.unblock}
              onPress={() => removeBlock(item)}
              disabled={busyId === item.id}
            >
              <Text style={styles.unblockText}>Kaldır</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  subName: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  unblock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  unblockText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
