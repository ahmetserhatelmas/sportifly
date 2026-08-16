import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

const LEGAL_TEXTS: Record<string, string> = {
  'Kullanıcı Sözleşmesi':
    'Bu sözleşme, Sportifly uygulamasını kullanan tüm üyeler için geçerlidir. ' +
    'Uygulamayı kullanarak platform kurallarına uymayı, diğer kullanıcılara saygılı davranmayı ' +
    've paylaştığınız içeriklerden sorumlu olduğunuzu kabul etmiş olursunuz.\n\n' +
    '(Bu alan yayına alınmadan önce hukuk danışmanınız tarafından hazırlanan nihai metin ile değiştirilmelidir.)',
  'Mesafeli Satış Sözleşmesi':
    'Saha kiralama ve ders satın alma işlemleri, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ' +
    'kapsamındaki mesafeli satış hükümlerine tabidir. Satın alınan hizmetlerin iptal ve iade koşulları ' +
    'ilan sahibinin belirttiği şartlara ve yürürlükteki mevzuata göre uygulanır.\n\n' +
    '(Bu alan yayına alınmadan önce hukuk danışmanınız tarafından hazırlanan nihai metin ile değiştirilmelidir.)',
  'Gizlilik Politikası':
    'Sportifly, kişisel verilerinizi 6698 sayılı KVKK kapsamında işler. Hesap bilgileriniz, ' +
    'paylaşımlarınız ve konum tercihleriniz yalnızca uygulama deneyiminizi iyileştirmek amacıyla kullanılır ' +
    've üçüncü taraflarla izniniz olmadan paylaşılmaz.\n\n' +
    '(Bu alan yayına alınmadan önce hukuk danışmanınız tarafından hazırlanan nihai metin ile değiştirilmelidir.)',
};

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
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
