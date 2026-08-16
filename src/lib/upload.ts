import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { supabase } from './supabase';

export type UploadKind = 'avatar' | 'banner' | 'post' | 'listing';

const PRESETS: Record<UploadKind, { maxWidth: number; quality: number; aspect?: [number, number] }> = {
  avatar: { maxWidth: 512, quality: 0.72, aspect: [1, 1] },
  banner: { maxWidth: 1280, quality: 0.72, aspect: [16, 9] },
  post: { maxWidth: 1080, quality: 0.7, aspect: [1, 1] },
  listing: { maxWidth: 1080, quality: 0.72 },
};

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject
    );
  });
}

/**
 * Galeriden görsel seçer, boyut/kalite sıkıştırır, Supabase Storage'a JPEG olarak yükler.
 * Seed Unsplash fotoğrafları CDN'den optimize gelir; ham telefon fotoğrafları sıkıştırılmazsa
 * birkaç MB olup yavaş açılır — bu yüzden yüklemeden önce küçültüyoruz.
 */
export async function pickAndUploadImage(
  folder: string,
  kind: UploadKind = 'post'
): Promise<string | null> {
  const preset = PRESETS[kind];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: preset.aspect,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  return uploadImageUri(result.assets[0].uri, folder, kind, result.assets[0].width);
}

/** Zaten seçilmiş bir URI'yi sıkıştırıp yükler (CreatePost gibi akışlar için). */
export async function uploadImageUri(
  uri: string,
  folder: string,
  kind: UploadKind = 'post',
  knownWidth?: number
): Promise<string> {
  const { maxWidth, quality } = PRESETS[kind];
  let width = knownWidth;
  if (!width) {
    try {
      width = (await getImageSize(uri)).width;
    } catch {
      width = maxWidth + 1;
    }
  }

  const actions: ImageManipulator.Action[] =
    width > maxWidth ? [{ resize: { width: maxWidth } }] : [];

  const manipulated = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const arrayBuffer = await fetch(manipulated.uri).then((res) => res.arrayBuffer());

  const { error } = await supabase.storage.from('media').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}
