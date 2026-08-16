import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  rating: number;
  size?: number;
  onChange?: (rating: number) => void;
};

export function Stars({ rating, size = 16, onChange }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const icon = rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
        const star = (
          <Ionicons
            key={i}
            name={icon}
            size={size}
            color={colors.star}
            style={{ marginRight: 2 }}
          />
        );
        if (!onChange) return star;
        return (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
