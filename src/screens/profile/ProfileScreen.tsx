import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { DuelCard } from '../../components/DuelCard';
import { PhotoLightbox } from '../../components/PhotoLightbox';
import { RoleBadges } from '../../components/RoleBadges';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import { fetchUpcomingMatches } from '../../lib/matches';
import { sendTestPush, setPushEnabled } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { Duel, Post } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [stats, setStats] = useState({ followers: 0, played: 0, won: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [upcoming, setUpcoming] = useState<Duel[]>([]);
  const [pushBusy, setPushBusy] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session) return;
    const userId = session.user.id;
    const blocked = await fetchBlockedIds(userId);
    const [followers, played, won, myPosts, matches] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase
        .from('duel_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase.from('duels').select('*', { count: 'exact', head: true }).eq('winner_id', userId),
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      fetchUpcomingMatches(userId, blocked),
    ]);
    setStats({
      followers: followers.count ?? 0,
      played: played.count ?? 0,
      won: won.count ?? 0,
    });
    setPosts((myPosts.data as Post[]) ?? []);
    setUpcoming(matches);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      fetchData();
    }, [fetchData, refreshProfile])
  );

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
    ]);
  };

  const openScreen = (fn: () => void) => {
    setDrawerOpen(false);
    setTimeout(fn, 250);
  };

  const togglePush = async (enabled: boolean) => {
    if (!session || pushBusy) return;
    setPushBusy(true);
    const error = await setPushEnabled(session.user.id, enabled);
    setPushBusy(false);
    if (error) {
      Alert.alert('Bildirimler', error);
      return;
    }
    await refreshProfile();
  };

  const pushOn = profile?.push_enabled !== false;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 24 }}
        columnWrapperStyle={{ gap: 2, paddingHorizontal: 2 }}
        ListHeaderComponent={
          <>
            <View style={styles.banner}>
              {profile?.banner_url ? (
                <Image
                  source={{ uri: profile.banner_url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : null}
              <SafeAreaView edges={['top']} style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Profil</Text>
                <Pressable
                  style={styles.menuBtn}
                  onPress={() => setDrawerOpen(true)}
                  hitSlop={8}
                >
                  <Ionicons name="menu" size={24} color="#fff" />
                </Pressable>
              </SafeAreaView>
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarBorder}>
                <Avatar
                  uri={profile?.avatar_url}
                  name={profile?.username}
                  size={92}
                  onPress={profile?.avatar_url ? () => setPhotoOpen(true) : undefined}
                />
              </View>
            </View>

            <Text style={styles.name}>{profile?.full_name || profile?.username}</Text>
            <Text style={styles.email}>@{profile?.username}</Text>
            <RoleBadges
              isAdmin={profile?.is_admin}
              isFieldOwner={profile?.is_field_owner}
              isInstructor={profile?.is_instructor}
              style={{ marginTop: 8, marginBottom: 4 }}
            />

            <View style={styles.statsCard}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.played}</Text>
                <Text style={styles.statLabel}>Maç sayısı</Text>
              </View>
              <Pressable
                style={[styles.stat, styles.statMiddle]}
                onPress={() =>
                  session &&
                  navigation.navigate('Follows', {
                    userId: session.user.id,
                    initialTab: 'followers',
                  })
                }
              >
                <Text style={[styles.statValue, { fontSize: 24, color: colors.primary }]}>
                  {stats.followers}
                </Text>
                <Text style={styles.statLabel}>Takipçi</Text>
              </Pressable>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.won}</Text>
                <Text style={styles.statLabel}>Kazanılan</Text>
              </View>
            </View>

            {upcoming.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>Katıldığın maçlar</Text>
                {upcoming.map((duel) => (
                  <DuelCard
                    key={duel.id}
                    duel={duel}
                    compact
                    onPress={() => navigation.navigate('DuelDetail', { duelId: duel.id })}
                  />
                ))}
              </View>
            ) : null}

            <Text style={styles.galleryTitle}>Paylaşımlar</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyGallery}>Henüz fotoğraf paylaşmadın.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridImage}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.gridImageInner}
              contentFit="cover"
              recyclingKey={item.id}
            />
          </Pressable>
        )}
      />

      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerBackdropWrap}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View
            style={[
              styles.drawer,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <Text style={styles.drawerTitle}>Menü</Text>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
            <DrawerItem
              icon="pricetags-outline"
              label="İlanlarım"
              onPress={() => openScreen(() => navigation.navigate('MyListings'))}
            />
            <DrawerItem
              icon="bag-check-outline"
              label="Satın Alınanlar"
              onPress={() => openScreen(() => navigation.navigate('Purchases'))}
            />
            <DrawerItem
              icon="headset-outline"
              label="Destek Ekibi"
              onPress={() => openScreen(() => navigation.navigate('Support'))}
            />
            {!profile?.is_admin ? (
              <DrawerItem
                icon="ribbon-outline"
                label="Saha / Eğitmen Başvurusu"
                onPress={() => openScreen(() => navigation.navigate('RoleRequest'))}
              />
            ) : (
              <DrawerItem
                icon="shield-outline"
                label="Admin · Başvurular"
                onPress={() => openScreen(() => navigation.navigate('AdminRoleRequests'))}
              />
            )}

            <Text style={styles.drawerSection}>Ayarlar</Text>
            <View style={styles.drawerItem}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <Text style={styles.drawerItemText}>Bildirimler</Text>
              <View style={{ flex: 1 }} />
              <Switch
                value={pushOn}
                onValueChange={togglePush}
                disabled={pushBusy}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={pushOn ? colors.primary : colors.textMuted}
              />
            </View>
            {pushOn ? (
              <DrawerItem
                icon="notifications-outline"
                label="Test bildirimi gönder"
                onPress={async () => {
                  if (!session) return;
                  const err = await sendTestPush(session.user.id);
                  Alert.alert(
                    'Bildirimler',
                    err ?? 'Gönderildi. Bildirim gelmezse uygulamayı kapatıp tekrar dene.'
                  );
                }}
              />
            ) : null}
            <DrawerItem
              icon="ban-outline"
              label="Engel listesi"
              onPress={() => openScreen(() => navigation.navigate('BlockedUsers'))}
            />
            <DrawerItem
              icon="create-outline"
              label="Profili Düzenle"
              onPress={() => openScreen(() => navigation.navigate('EditProfile'))}
            />
            <DrawerItem
              icon="log-out-outline"
              label="Hesaptan Çıkış Yap"
              destructive
              onPress={() => {
                setDrawerOpen(false);
                setTimeout(handleSignOut, 250);
              }}
            />

            <View style={{ flex: 1 }} />

            <Text style={styles.drawerSection}>Yasal</Text>
            <DrawerItem
              icon="document-text-outline"
              label="Kullanıcı Sözleşmesi"
              small
              onPress={() =>
                openScreen(() => navigation.navigate('Legal', { title: 'Kullanıcı Sözleşmesi' }))
              }
            />
            <DrawerItem
              icon="document-text-outline"
              label="Mesafeli Satış Sözleşmesi"
              small
              onPress={() =>
                openScreen(() =>
                  navigation.navigate('Legal', { title: 'Mesafeli Satış Sözleşmesi' })
                )
              }
            />
            <DrawerItem
              icon="shield-checkmark-outline"
              label="Gizlilik Politikası"
              small
              onPress={() =>
                openScreen(() => navigation.navigate('Legal', { title: 'Gizlilik Politikası' }))
              }
            />
            <DrawerItem
              icon="document-text-outline"
              label="KVKK Aydınlatma Metni"
              small
              onPress={() =>
                openScreen(() => navigation.navigate('Legal', { title: 'KVKK Aydınlatma Metni' }))
              }
            />
            <DrawerItem
              icon="document-text-outline"
              label="Teslimat ve İade Şartları"
              small
              onPress={() =>
                openScreen(() =>
                  navigation.navigate('Legal', { title: 'Teslimat ve İade Şartları' })
                )
              }
            />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PhotoLightbox
        uri={profile?.avatar_url}
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
      />
    </View>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  destructive,
  small,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  small?: boolean;
}) {
  const color = destructive ? colors.danger : colors.text;
  return (
    <Pressable style={styles.drawerItem} onPress={onPress}>
      <Ionicons name={icon} size={small ? 18 : 22} color={destructive ? colors.danger : colors.primary} />
      <Text style={[styles.drawerItemText, { color }, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  banner: {
    height: 170,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  menuBtn: { position: 'absolute', right: 16, top: 60 },
  avatarWrap: { alignItems: 'center', marginTop: -46 },
  avatarBorder: {
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.card,
    backgroundColor: colors.card,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 10 },
  email: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statMiddle: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: { fontSize: 19, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  galleryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyGallery: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
  gridImage: {
    flex: 1 / 3,
    aspectRatio: 1,
    marginBottom: 2,
  },
  gridImageInner: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  drawerBackdropWrap: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  drawer: {
    width: '78%',
    backgroundColor: colors.card,
    paddingHorizontal: 20,
  },
  drawerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginVertical: 20 },
  drawerSection: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 6,
  },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  drawerItemText: { marginLeft: 14, fontSize: 15, fontWeight: '600' },
});
