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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { supabase } from '../../lib/supabase';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Zayıf şifre', 'Şifreniz en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim().toLowerCase() },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Kayıt başarısız', error.message);
    } else {
      Alert.alert(
        'Kayıt tamamlandı',
        'E-posta doğrulaması açıksa gelen kutunuzu kontrol edin, ardından giriş yapabilirsiniz.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Aramıza katıl</Text>
          <Text style={styles.subtitle}>Yeni bir hesap oluştur ve rakibini bul.</Text>

          <Input
            label="Kullanıcı Adı"
            placeholder="ahmet_y"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <Input
            label="E-posta"
            placeholder="ornek@mail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Şifre"
            placeholder="En az 6 karakter"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>
              Zaten hesabın var mı? <Text style={styles.footerLink}>Giriş Yap</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  container: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6, marginBottom: 32 },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: '700' },
});
