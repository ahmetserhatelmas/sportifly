import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="tennisball" size={56} color={colors.primary} />
          </View>
          <Text style={styles.appName}>SPORTIFLY</Text>
          <Text style={styles.tagline}>Rakibini bul ve sahaya çık.</Text>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Giriş Yap"
            onPress={() => navigation.navigate('Login')}
            style={{ backgroundColor: '#fff' }}
            textColor={colors.primaryDark}
          />
          <Button
            title="Kayıt Ol"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={{ borderColor: '#fff', marginTop: 12 }}
            textColor="#fff"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 24 },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  buttons: { paddingBottom: 16 },
});
