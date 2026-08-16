import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { uploadImageUri } from '../../lib/upload';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export function CreatePostScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const share = async () => {
    if (!imageUri || !session) {
      Alert.alert('Görsel gerekli', 'Lütfen paylaşmak için bir fotoğraf seçin.');
      return;
    }
    setLoading(true);
    try {
      const publicUrl = await uploadImageUri(imageUri, `posts/${session.user.id}`, 'post');

      const { error } = await supabase.from('posts').insert({
        user_id: session.user.id,
        image_url: publicUrl,
        caption: caption.trim() || null,
      });
      if (error) throw error;

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Paylaşım başarısız', e.message ?? 'Bir hata oluştu, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={40} color={colors.primary} />
              <Text style={styles.placeholderText}>Fotoğraf seçmek için dokun</Text>
            </View>
          )}
        </Pressable>

        <Input
          label="Açıklama"
          placeholder="Bugünkü antrenman..."
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        <Button title="Paylaş" onPress={share} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16 },
  imagePicker: { marginBottom: 20 },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.lg },
  placeholder: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { marginTop: 10, color: colors.primaryDark, fontWeight: '600' },
});
