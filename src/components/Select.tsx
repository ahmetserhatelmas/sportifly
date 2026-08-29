import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  placeholder: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  renderLabel?: (value: string) => string;
  searchable?: boolean;
};

function foldTr(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function Select({
  placeholder,
  value,
  options,
  onSelect,
  disabled,
  style,
  renderLabel,
  searchable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const showSearch = searchable ?? options.length > 8;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const filtered = useMemo(() => {
    const term = foldTr(query.trim());
    if (!term) return options;
    return options.filter((item) => {
      const label = renderLabel ? renderLabel(item) : item;
      return foldTr(label).includes(term) || foldTr(item).includes(term);
    });
  }, [options, query, renderLabel]);

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          setQuery('');
          setOpen(true);
        }}
        style={[styles.trigger, disabled && { opacity: 0.5 }, style]}
      >
        <Text style={[styles.triggerText, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {value ? (renderLabel ? renderLabel(value) : value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            {showSearch ? (
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Ara..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.search}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>Sonuç bulunamadı.</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                >
                  <Text
                    style={[styles.optionText, item === value && { color: colors.primary, fontWeight: '700' }]}
                  >
                    {renderLabel ? renderLabel(item) : item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: colors.card,
  },
  triggerText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: '70%',
    paddingVertical: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  optionText: { fontSize: 15, color: colors.text },
});
