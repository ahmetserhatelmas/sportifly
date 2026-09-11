import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { pickAndUploadImage } from '../../lib/upload';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url ?? null);
  const [loading, setLoading] = useState(false);

  const changeAvatar = async () => {
    try {
      const url = await pickAndUploadImage(`avatars/${session?.user.id}`, 'avatar');
      if (url) setAvatarUrl(url);
    } catch {
      Alert.alert('Yükleme başarısız', 'Fotoğraf yüklenemedi, tekrar deneyin.');
    }
  };

  const changeBanner = async () => {
    try {
      const url = await pickAndUploadImage(`banners/${session?.user.id}`, 'banner');
      if (url) setBannerUrl(url);
    } catch {
      Alert.alert('Yükleme başarısız', 'Görsel yüklenemedi, tekrar deneyin.');
    }
  };

  const save = async () => {
    if (!session) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      })
      .eq('id', session.user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Kaydedilemedi', 'Bir hata oluştu, tekrar deneyin.');
    } else {
      await refreshProfile();
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.banner} onPress={changeBanner}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : null}
          <View style={styles.bannerOverlay}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.bannerText}>Banner değiştir</Text>
          </View>
        </Pressable>

        <View style={styles.avatarWrap}>
          <Pressable onPress={changeAvatar}>
            <Avatar uri={avatarUrl} name={profile?.username} size={92} />
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>

        <Input label="Ad Soyad" placeholder="Adın ve soyadın" value={fullName} onChangeText={setFullName} />
        <Input label="Hakkında" placeholder="Kendinden bahset..." multiline value={bio} onChangeText={setBio} />

        <Button title="Kaydet" onPress={save} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16 },
  banner: {
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  bannerText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  avatarWrap: { alignItems: 'center', marginTop: -40, marginBottom: 20 },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
