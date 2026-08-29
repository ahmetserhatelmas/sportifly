import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const EAS_PROJECT_ID = '7aba8c51-6da2-4092-ae50-8a131cc593db';

async function loadNotifications() {
  return import('expo-notifications');
}

function isAndroidExpoGo() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

export async function setPushEnabled(userId: string, enabled: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update(enabled ? { push_enabled: true } : { push_enabled: false, expo_push_token: null })
    .eq('id', userId);
  if (error) return error;
  if (enabled) await registerPushToken(userId);
  return null;
}

export async function registerPushToken(userId: string) {
  // Android Expo Go (SDK 53+) remote token alamaz. iOS Expo Go ve APK/TestFlight alır.
  if (isAndroidExpoGo() || !Device.isDevice) return;

  try {
    const { data: prefs } = await supabase
      .from('profiles')
      .select('push_enabled')
      .eq('id', userId)
      .maybeSingle();
    if ((prefs as { push_enabled?: boolean } | null)?.push_enabled === false) return;

    const Notifications = await loadNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reservations', {
        name: 'Rezervasyonlar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#52C5B6',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      EAS_PROJECT_ID;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;

    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
  } catch {
    // Native modül yoksa uygulamayı düşürme.
  }
}

export async function sendExpoPush(payload: { token: string; title: string; body: string } | null) {
  if (!payload?.token) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        channelId: 'reservations',
        priority: 'high',
      }),
    });
  } catch {
    // Ağ yoksa sessizce geç; uygulama içi mesaj yine gider.
  }
}

async function pushToProfile(userId: string, title: string, body: string) {
  const { data } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', userId)
    .maybeSingle();
  const token = (data as { expo_push_token?: string } | null)?.expo_push_token;
  if (!token) return;
  await sendExpoPush({ token, title, body });
}

export async function pushOwnerAfterBooking(purchaseId: string) {
  const { data } = await supabase.rpc('push_after_booking', { p_purchase_id: purchaseId });
  const payload = data as { token?: string; title?: string; body?: string } | null;
  if (payload?.token && payload.title && payload.body) {
    await sendExpoPush({ token: payload.token, title: payload.title, body: payload.body });
    return;
  }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('slot_date, slot_time, listings(owner_id, title, type)')
    .eq('id', purchaseId)
    .maybeSingle();
  const listingRaw = (purchase as { listings?: { owner_id: string; title: string; type: string } | { owner_id: string; title: string; type: string }[] } | null)
    ?.listings;
  const listing = Array.isArray(listingRaw) ? listingRaw[0] : listingRaw;
  if (!listing?.owner_id) return;
  const when =
    purchase && (purchase as { slot_date?: string; slot_time?: string }).slot_date
      ? ` · ${(purchase as { slot_date: string }).slot_date} • ${String((purchase as { slot_time?: string }).slot_time ?? '').slice(0, 5)}`
      : '';
  await pushToProfile(
    listing.owner_id,
    listing.type === 'field' ? 'Yeni kiralama talebi' : 'Yeni ders talebi',
    `${listing.title}${when}`
  );
}

export async function pushBookerAfterDecision(purchaseId: string) {
  const { data } = await supabase.rpc('push_after_decision', { p_purchase_id: purchaseId });
  const payload = data as { token?: string; title?: string; body?: string } | null;
  if (payload?.token && payload.title && payload.body) {
    await sendExpoPush({ token: payload.token, title: payload.title, body: payload.body });
    return;
  }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('user_id, status, slot_date, slot_time, listings(title)')
    .eq('id', purchaseId)
    .maybeSingle();
  if (!purchase) return;
  const row = purchase as {
    user_id: string;
    status: string;
    slot_date?: string;
    slot_time?: string;
    listings?: { title: string } | { title: string }[];
  };
  const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;
  const when = row.slot_date
    ? ` · ${row.slot_date} • ${String(row.slot_time ?? '').slice(0, 5)}`
    : '';
  await pushToProfile(
    row.user_id,
    row.status === 'accepted' ? 'Talebin onaylandı' : 'Talebin reddedildi',
    `${listing?.title ?? ''}${when}`
  );
}
