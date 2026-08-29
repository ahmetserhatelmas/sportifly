import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

export function PhotoLightbox({
  uri,
  visible,
  onClose,
}: {
  uri?: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!uri) {
      setNatural(null);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (w, h) => {
        if (!cancelled && w > 0 && h > 0) setNatural({ w, h });
      },
      () => {
        if (!cancelled) setNatural(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!uri) return null;

  const maxW = screenW * 0.92;
  const maxH = screenH * 0.8;
  const ratio = natural ? natural.w / natural.h : 1;
  const size =
    ratio > maxW / maxH
      ? { width: maxW, height: maxW / ratio }
      : { width: maxH * ratio, height: maxH };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <Image source={{ uri }} style={size} resizeMode="contain" />
        </Pressable>
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { position: 'absolute', top: 56, right: 20 },
});
