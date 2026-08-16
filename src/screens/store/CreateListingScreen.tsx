import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { useAuth } from '../../context/AuthContext';
import { CITIES, getDistricts } from '../../data/locations';
import { pickAndUploadImage } from '../../lib/upload';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { HOUR_OPTIONS, hourLabel, parseHour } from '../../lib/booking';
import { SPORTS } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateListing'>;

export function CreateListingScreen({ route, navigation }: Props) {
  const { type } = route.params;
  const { session, profile, refreshProfile } = useAuth();
  const isField = type === 'field';
  const hasPermission =
    !!profile?.is_admin ||
    (isField ? !!profile?.is_field_owner : !!profile?.is_instructor);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (profile && !hasPermission) {
      Alert.alert(
        'Yetki gerekli',
        isField
          ? 'Saha ilanı açmak için saha sahibi yetkisine ihtiyacın var.'
          : 'Ders ilanı açmak için eğitmen yetkisine ihtiyacın var.',
        [
          { text: 'Başvur', onPress: () => navigation.replace('RoleRequest') },
          { text: 'Vazgeç', style: 'cancel', onPress: () => navigation.goBack() },
        ]
      );
    }
  }, [profile, hasPermission, isField, navigation]);

  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [openHour, setOpenHour] = useState('08');
  const [closeHour, setCloseHour] = useState('22');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [commissionAccepted, setCommissionAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const districts = useMemo(() => (city ? getDistricts(city) : []), [city]);

  const pickImage = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadImage('listings', 'listing');
      if (url) setImageUrl(url);
    } catch {
      Alert.alert('Yükleme başarısız', 'Görsel yüklenemedi, tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    if (!session) return;
    if (!hasPermission) {
      return Alert.alert(
        'Yetki gerekli',
        isField
          ? 'Saha ilanı için saha sahibi olmalısın.'
          : 'Ders ilanı için eğitmen olmalısın.'
      );
    }
    if (!title.trim()) return Alert.alert('Eksik bilgi', 'Lütfen bir başlık girin.');
    if (!city || !district) return Alert.alert('Eksik bilgi', 'İl ve ilçe seçimi zorunludur.');
    const priceNumber = Number(price.replace(',', '.'));
    if (!price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      return Alert.alert('Eksik bilgi', isField ? 'Saha kiralama ücretini girin.' : 'Ders ücretini girin.');
    }
    if (!commissionAccepted) {
      return Alert.alert('Onay gerekli', 'İlan verebilmek için komisyon bilgilendirmesini onaylamalısınız.');
    }
    const open = parseHour(openHour, 8);
    const close = parseHour(closeHour, 22);
    if (open >= close) {
      return Alert.alert('Saat aralığı', 'Kapanış saati açılıştan sonra olmalı.');
    }

    setLoading(true);
    const { error } = await supabase.from('listings').insert({
      owner_id: session.user.id,
      type,
      title: title.trim(),
      description: description.trim() || null,
      sport,
      city,
      district,
      price: priceNumber,
      commission_accepted: true,
      image_url: imageUrl,
      open_hour: open,
      close_hour: close,
    });
    setLoading(false);

    if (error) {
      Alert.alert(
        'Oluşturulamadı',
        error.message.includes('policy') || error.code === '42501'
          ? 'Bu tür ilan için yetkin yok. Profil menüsünden başvuru gönderebilirsin.'
          : 'Bir hata oluştu, tekrar deneyin.'
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.preview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.primary} />
                <Text style={styles.imagePlaceholderText}>
                  {uploading ? 'Yükleniyor...' : 'Kapak görseli ekle (isteğe bağlı)'}
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.sectionLabel}>Spor Branşı</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {SPORTS.map((s) => (
              <Chip key={s} label={s} selected={sport === s} onPress={() => setSport(s)} />
            ))}
          </ScrollView>

          <Input
            label="Başlık"
            placeholder={isField ? 'Örn: Yıldız Halı Saha' : 'Örn: Bireysel Tenis Dersi'}
            value={title}
            onChangeText={setTitle}
          />
          <Input
            label="Açıklama"
            placeholder={isField ? 'Saha hakkında bilgiler...' : 'Ders içeriği ve deneyiminiz...'}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.row}>
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

          <Input
            label={isField ? 'Saha Kiralama Ücreti (₺/saat)' : 'Ders Ücreti (₺/ders)'}
            placeholder="Örn: 750"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            containerStyle={{ marginTop: 16 }}
          />

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
            {isField ? 'Saha müsaitlik saatleri' : 'Ders verilebilecek saatler'}
          </Text>
          <View style={styles.row}>
            <Select
              placeholder="Açılış"
              value={openHour}
              options={HOUR_OPTIONS.filter((h) => Number(h) < parseHour(closeHour, 22))}
              onSelect={setOpenHour}
              renderLabel={(v) => `Açılış ${hourLabel(v)}`}
              style={{ flex: 1, marginRight: 12 }}
            />
            <Select
              placeholder="Kapanış"
              value={closeHour}
              options={HOUR_OPTIONS.filter((h) => Number(h) > parseHour(openHour, 8))}
              onSelect={setCloseHour}
              renderLabel={(v) => `Kapanış ${hourLabel(v)}`}
              style={{ flex: 1 }}
            />
          </View>

          <Pressable style={styles.checkboxRow} onPress={() => setCommissionAccepted((v) => !v)}>
            <View style={[styles.checkbox, commissionAccepted && styles.checkboxChecked]}>
              {commissionAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              İlan üzerinden yapılan satışlardan Sportifly'ın belirli bir oranda komisyon (pay)
              alacağını okudum ve kabul ediyorum.
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isField ? 'Saha İlanı Oluştur' : 'Ders İlanı Oluştur'}
            onPress={create}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  form: { padding: 16, paddingBottom: 32 },
  imagePicker: { marginBottom: 20 },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { marginTop: 8, color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary },
  checkboxText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
