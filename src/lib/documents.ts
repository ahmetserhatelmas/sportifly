import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';

export type PickedDocument = {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
};

const ALLOWED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function pickDocument(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? guessMime(asset.name);
  if (!ALLOWED.has(mimeType)) {
    throw new Error('Sadece PDF veya görsel dosya ekleyebilirsin.');
  }
  if (asset.size != null && asset.size > MAX_BYTES) {
    throw new Error('Dosya en fazla 10 MB olabilir.');
  }

  return {
    uri: asset.uri,
    name: asset.name,
    mimeType,
    size: asset.size ?? null,
  };
}

export async function uploadDocument(
  doc: PickedDocument,
  userId: string,
  folder = 'role-requests'
): Promise<{ url: string; name: string }> {
  const ext = doc.name.includes('.')
    ? doc.name.split('.').pop()!.toLowerCase()
    : mimeExt(doc.mimeType);
  const safeName = doc.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const path = `${folder}/${userId}/${Date.now()}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;

  const arrayBuffer = await fetch(doc.uri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage.from('media').upload(path, arrayBuffer, {
    contentType: doc.mimeType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, name: doc.name };
}

function guessMime(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function mimeExt(mime: string) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  return 'jpg';
}
