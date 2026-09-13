import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEGAL_TEXTS } from '../../legal/documents';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

export function LegalScreen({ route }: Props) {
  const { title } = route.params;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{LEGAL_TEXTS[title] ?? 'İçerik hazırlanıyor.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
