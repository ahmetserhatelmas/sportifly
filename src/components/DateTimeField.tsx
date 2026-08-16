import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button } from './Button';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  placeholder: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (value: Date) => void;
  style?: ViewStyle;
};

function format(value: Date, mode: 'date' | 'time') {
  if (mode === 'time') {
    return value.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return value.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DateTimeField({ label, placeholder, mode, value, onChange, style }: Props) {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  const openPicker = () => {
    setTemp(value ?? new Date());
    setShow(true);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={openPicker}>
        <Text style={[styles.fieldText, !value && { color: colors.placeholder }]}>
          {value ? format(value, mode) : placeholder}
        </Text>
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={temp}
          mode={mode}
          is24Hour
          minimumDate={mode === 'date' ? new Date() : undefined}
          onValueChange={(_event, date) => {
            setShow(false);
            onChange(date);
          }}
          onDismiss={() => setShow(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShow(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={temp}
                mode={mode}
                display="spinner"
                is24Hour
                locale="tr-TR"
                minimumDate={mode === 'date' ? new Date() : undefined}
                onValueChange={(_event, date) => setTemp(date)}
              />
              <Button
                title="Tamam"
                onPress={() => {
                  onChange(temp);
                  setShow(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  fieldText: { fontSize: 15, color: colors.text },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
});
