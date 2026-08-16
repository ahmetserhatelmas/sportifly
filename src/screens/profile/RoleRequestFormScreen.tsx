import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { pickDocument, PickedDocument, uploadDocument } from '../../lib/documents';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { RoleRequestRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleRequestForm'>;

const COPY: Record<
  RoleRequestRole,
  { title: string; hint: string; placeholder: string }
> = {
  field_owner: {
    title: 'Saha Sahibi Başvurusu',
    hint: 'Saha bilgilerinizi, konumunu ve varsa işletme belgenizi yazın. Tapu, ruhsat veya sözleşme PDF’i ekleyebilirsiniz.',
    placeholder:
      'Örn: Kadıköy’de 2 kapalı halı saham var. Hafta içi 18:00–23:00 arası aktif kullanılıyor. İşletme ruhsatım ekte.',
  },
  instructor: {
    title: 'Eğitmen Başvurusu',
    hint: 'Branşınızı, deneyiminizi ve verdiğiniz dersleri anlatın. Antrenörlük belgesi veya sertifika PDF’i ekleyebilirsiniz.',
    placeholder:
      'Örn: 5 yıllık tenis eğitmeniyim, TTF antrenör belgem var. Beşiktaş ve Kadıköy’de bireysel / grup ders veriyorum.',
  },
};

export function RoleRequestFormScreen({ route, navigation }: Props) {
  const { role } = route.params;
  const { session } = useAuth();
  const copy = COPY[role];

  const [description, setDescription] = useState('');
  const [file, setFile] = useState<PickedDocument | null>(null);
  const [loading, setLoading] = useState(false);

  const chooseFile = async () => {
    try {
      const picked = await pickDocument();
      if (picked) setFile(picked);
    } catch (e: any) {
      Alert.alert('Dosya seçilemedi', e.message ?? 'Tekrar deneyin.');
    }
  };

  const submit = async () => {
    if (!session) return;
    const text = description.trim();
    if (text.length < 20) {
      return Alert.alert(
        'Açıklama gerekli',
        'Lütfen en az birkaç cümlelik bir açıklama yaz (minimum 20 karakter).'
      );
    }

    setLoading(true);
    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;
      if (file) {
        const uploaded = await uploadDocument(file, session.user.id);
        attachment_url = uploaded.url;
        attachment_name = uploaded.name;
      }

      const { error } = await supabase.from('role_requests').insert({
        user_id: session.user.id,
        role,
        description: text,
        note: text,
        attachment_url,
        attachment_name,
        status: 'pending',
      });
      if (error) {
        throw new Error(
          error.message.includes('role_requests_one_pending')
            ? 'Bu rol için zaten bekleyen bir başvurun var.'
            : error.message
        );
      }

      Alert.alert(
        'Başvuru gönderildi',
        'Ekibin incelemesi sonrası onaylandığında profilinde yetkin görünecek.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Gönderilemedi', e.message ?? 'Bir hata oluştu, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>{copy.hint}</Text>

          <Text style={styles.label}>Açıklama *</Text>
          <TextInput
            style={styles.input}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Ek dosya (PDF / görsel, isteğe bağlı)</Text>
          <Pressable style={styles.fileBox} onPress={chooseFile}>
            <Ionicons
              name={file ? 'document-attach' : 'cloud-upload-outline'}
              size={22}
              color={colors.primaryDark}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fileTitle}>
                {file ? file.name : 'Dosya seç'}
              </Text>
              <Text style={styles.fileSub}>
                {file
                  ? `${file.mimeType.includes('pdf') ? 'PDF' : 'Görsel'} · dokunarak değiştir`
                  : 'PDF, JPG veya PNG · en fazla 10 MB'}
              </Text>
            </View>
            {file ? (
              <Pressable
                hitSlop={8}
                onPress={() => setFile(null)}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </Pressable>

          <Button
            title="Başvuruyu Gönder"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 140,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 14,
  },
  fileTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  fileSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  clearBtn: { marginLeft: 8 },
});
