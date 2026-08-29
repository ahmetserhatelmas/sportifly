import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { Stars } from '../../components/Stars';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedIds } from '../../lib/chatModeration';
import {
  bookingDates,
  dateChipLabel,
  formatOpenDays,
  formatSlot,
  generateSlots,
  hourRangeLabel,
  parseHour,
  parseOpenDays,
  slotHour,
} from '../../lib/booking';
import { localDateString } from '../../lib/duelTime';
import { pushBookerAfterDecision, pushOwnerAfterBooking } from '../../lib/push';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Listing, ListingReview, Purchase } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const { session } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [busy, setBusy] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedHours, setBookedHours] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: listingData }, { data: reviewData }, { data: purchaseData }] =
      await Promise.all([
        supabase.from('listings').select('*, profiles(*)').eq('id', listingId).single(),
        supabase
          .from('listing_reviews')
          .select('*, profiles(*)')
          .eq('listing_id', listingId)
          .order('created_at', { ascending: false }),
        supabase
          .from('purchases')
          .select('*, profiles(*)')
          .eq('listing_id', listingId)
          .order('created_at', { ascending: false }),
      ]);
    const blocked = session?.user.id
      ? await fetchBlockedIds(session.user.id)
      : new Set<string>();
    setListing((listingData as Listing) ?? null);
    setReviews(((reviewData as ListingReview[]) ?? []).filter((r) => !blocked.has(r.user_id)));
    setPurchases((purchaseData as Purchase[]) ?? []);
    setLoaded(true);
  }, [listingId, session?.user.id]);

  const fetchBooked = useCallback(async (date: Date) => {
    const { data } = await supabase.rpc('listing_booked_slots', {
      p_listing_id: listingId,
      p_date: localDateString(date),
    });
    setBookedHours(
      ((data as { slot_time: string }[] | null) ?? []).map((r) => slotHour(r.slot_time))
    );
  }, [listingId]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      if (selectedDate) fetchBooked(selectedDate);
    }, [fetchAll, fetchBooked, selectedDate])
  );

  if (!loaded) return <SafeAreaView style={styles.safe} />;
  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="ban-outline" title="Bu ilan kullanılamıyor" />
      </SafeAreaView>
    );
  }

  const isField = listing.type === 'field';
  const isOwner = listing.owner_id === session?.user.id;
  const avg =
    reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const myReview = reviews.find((r) => r.user_id === session?.user.id);
  // RLS gereği: sahibi tüm talepleri, kullanıcı yalnızca kendi taleplerini görür
  const myPurchases = purchases.filter((p) => p.user_id === session?.user.id);
  const canReview = myPurchases.some((p) => p.status === 'accepted');
  const openHour = parseHour(listing.open_hour, 8);
  const closeHour = parseHour(listing.close_hour, 22);
  const openDays = parseOpenDays(listing.open_days);
  const upcomingDates = bookingDates(openDays);
  const viewDate = selectedDate ?? (isOwner ? upcomingDates[0] ?? null : null);
  const dateStr = viewDate ? localDateString(viewDate) : null;
  const availableHours = dateStr
    ? generateSlots(openHour, closeHour, dateStr, { includePast: isOwner })
    : [];

  const hourPurchases = (hour: number) =>
    purchases.filter(
      (p) =>
        p.slot_date?.slice(0, 10) === dateStr &&
        p.slot_time &&
        slotHour(p.slot_time) === hour &&
        p.status !== 'rejected'
    );

  const sendRequest = async () => {
    if (!session) return;
    if (!selectedDate || selectedHour == null) {
      Alert.alert('Saat seç', 'Önce bir tarih, sonra müsait bir saat seç.');
      return;
    }
    if (!upcomingDates.some((d) => localDateString(d) === localDateString(selectedDate))) {
      Alert.alert('Tarih', 'Yalnızca önümüzdeki 1 hafta ve ilanın açık günleri seçilebilir.');
      return;
    }
    setBusy(true);
    const { data: created, error } = await supabase
      .from('purchases')
      .insert({
        user_id: session.user.id,
        listing_id: listingId,
        slot_date: localDateString(selectedDate),
        slot_time: `${String(selectedHour).padStart(2, '0')}:00:00`,
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) {
      Alert.alert(
        'İşlem başarısız',
        error.code === '23505'
          ? 'Bu saat az önce doldu, başka bir saat seç.'
          : error.message?.includes('hafta')
            ? 'En fazla 1 hafta sonrası için talep atılabilir.'
            : error.message?.includes('müsait')
              ? 'Bu günde ilan müsait değil.'
              : 'Bir hata oluştu, tekrar deneyin.'
      );
      if (selectedDate) fetchBooked(selectedDate);
    } else {
      if (created?.id) void pushOwnerAfterBooking(created.id);
      setSelectedHour(null);
      fetchAll();
      if (selectedDate) fetchBooked(selectedDate);
      Alert.alert(
        'Talebin gönderildi',
        'İlan sahibinin telefonuna bildirim gitti. Onayladığında sen de haberdar olursun.'
      );
    }
  };

  const cancelRequest = (purchase: Purchase) => {
    Alert.alert('Talebi İptal Et', 'Bu saat talebini iptal etmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.from('purchases').delete().eq('id', purchase.id);
          setBusy(false);
          if (error) {
            Alert.alert('İşlem başarısız', 'Bir hata oluştu, tekrar deneyin.');
          } else {
            fetchAll();
            if (selectedDate) fetchBooked(selectedDate);
          }
        },
      },
    ]);
  };

  const decideRequest = async (purchase: Purchase, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('purchases')
      .update({ status })
      .eq('id', purchase.id);
    if (error) {
      Alert.alert('İşlem başarısız', 'Bir hata oluştu, tekrar deneyin.');
    } else {
      void pushBookerAfterDecision(purchase.id);
      fetchAll();
      if (selectedDate) fetchBooked(selectedDate);
    }
  };

  const sendReview = async () => {
    if (!session || myRating === 0) {
      Alert.alert('Puan gerekli', 'Lütfen 1-5 arası yıldız seçin.');
      return;
    }
    setSendingReview(true);
    const { error } = await supabase.from('listing_reviews').upsert(
      {
        listing_id: listingId,
        user_id: session.user.id,
        rating: myRating,
        comment: myComment.trim() || null,
      },
      { onConflict: 'listing_id,user_id' }
    );
    setSendingReview(false);
    if (error) {
      Alert.alert(
        'Gönderilemedi',
        'Puanlama yapabilmek için talebinin ilan sahibi tarafından onaylanmış olması gerekir.'
      );
    } else {
      setMyRating(0);
      setMyComment('');
      fetchAll();
    }
  };

  const pickDate = (d: Date) => {
    setSelectedDate(d);
    setSelectedHour(null);
    fetchBooked(d);
  };

  const ownerScheduleBlock = () => {
    if (!isOwner) return null;
    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingTitle}>
          {isField ? 'Saha takvimi' : 'Ders takvimi'}
        </Text>
        <Text style={styles.bookingHint}>
          Önümüzdeki 7 gün · {formatOpenDays(openDays)}. Boş, bekleyen talep ve dolu saatleri buradan görürsün.
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.legendText}>Boş</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FEF3C7' }]} />
            <Text style={styles.legendText}>Bekliyor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FEE2E2' }]} />
            <Text style={styles.legendText}>Dolu</Text>
          </View>
        </View>
        {upcomingDates.length === 0 ? (
          <Text style={styles.noSlots}>Bu hafta açık gün yok.</Text>
        ) : (
          <View style={styles.dateGrid}>
            {upcomingDates.map((d) => {
              const key = localDateString(d);
              const selected = dateStr === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => pickDate(d)}
                  style={[styles.dateChip, selected && styles.dateChipSelected]}
                >
                  <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                    {dateChipLabel(d)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {viewDate ? (
          availableHours.length === 0 ? (
            <Text style={styles.noSlots}>Bu günde saat aralığı yok.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {availableHours.map((h) => {
                const rows = hourPurchases(h);
                const accepted = rows.find((p) => p.status === 'accepted');
                const pending = rows.filter((p) => p.status === 'pending');
                const isPast =
                  dateStr === localDateString() && h <= new Date().getHours();
                const state = accepted ? 'full' : pending.length > 0 ? 'pending' : isPast ? 'past' : 'empty';
                const who = accepted?.profiles?.username ?? pending[0]?.profiles?.username;
                const label =
                  state === 'full'
                    ? `Dolu${who ? ` · ${who}` : ''}`
                    : state === 'pending'
                      ? pending.length > 1
                        ? `Bekliyor · ${pending.length} talep`
                        : `Bekliyor${who ? ` · ${who}` : ''}`
                      : isPast
                        ? 'Geçti'
                        : 'Boş';
                return (
                  <Pressable
                    key={h}
                    onPress={() => {
                      if (accepted) {
                        Alert.alert(hourRangeLabel(h), `${who ?? 'Kullanıcı'} bu saati aldı.`);
                      } else if (pending.length > 0) {
                        Alert.alert(
                          hourRangeLabel(h),
                          pending.map((p) => p.profiles?.username ?? 'Kullanıcı').join(', ') +
                            ' onay bekliyor. Aşağıdaki gelen taleplerden karar verebilirsin.'
                        );
                      }
                    }}
                    style={[
                      styles.slot,
                      styles.ownerSlot,
                      state === 'full' && styles.slotFull,
                      state === 'pending' && styles.slotPending,
                      state === 'past' && styles.slotPast,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        state === 'full' && { color: colors.danger },
                        state === 'pending' && { color: '#B45309' },
                        state === 'past' && { color: colors.textMuted },
                      ]}
                    >
                      {hourRangeLabel(h)}
                    </Text>
                    <Text
                      style={[
                        styles.slotStatus,
                        state === 'full' && { color: colors.danger },
                        state === 'pending' && { color: '#B45309' },
                        state === 'past' && { color: colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )
        ) : null}
      </View>
    );
  };

  const bookingBlock = () => {
    if (isOwner) return null;
    return (
      <View style={styles.bookingCard}>
        <Text style={styles.bookingTitle}>
          {isField ? 'Saat seç ve kirala' : 'Saat seç ve ders talep et'}
        </Text>
        <Text style={styles.bookingHint}>
          Her seans 1 saat. Yalnızca önümüzdeki 7 gün ve açık günler ({formatOpenDays(openDays)})
          seçilebilir. İlan sahibi onaylayınca o saat başkasına kapanır.
        </Text>
        {upcomingDates.length === 0 ? (
          <Text style={styles.noSlots}>Bu hafta müsait gün yok.</Text>
        ) : (
          <View style={styles.dateGrid}>
            {upcomingDates.map((d) => {
              const key = localDateString(d);
              const selected = dateStr === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setSelectedDate(d);
                    setSelectedHour(null);
                    fetchBooked(d);
                  }}
                  style={[styles.dateChip, selected && styles.dateChipSelected]}
                >
                  <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                    {dateChipLabel(d)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {selectedDate ? (
          availableHours.length === 0 ? (
            <Text style={styles.noSlots}>Bu günde müsait saat kalmadı.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {availableHours.map((h) => {
                const taken = bookedHours.includes(h);
                const mine = myPurchases.some(
                  (p) =>
                    p.slot_date?.slice(0, 10) === dateStr &&
                    p.slot_time &&
                    slotHour(p.slot_time) === h &&
                    p.status !== 'rejected'
                );
                const selected = selectedHour === h;
                return (
                  <Pressable
                    key={h}
                    disabled={taken && !mine}
                    onPress={() => setSelectedHour(mine ? null : h)}
                    style={[
                      styles.slot,
                      selected && styles.slotSelected,
                      taken && styles.slotTaken,
                      mine && styles.slotMine,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selected && styles.slotTextSelected,
                        taken && !mine && styles.slotTextTaken,
                      ]}
                    >
                      {hourRangeLabel(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )
        ) : (
          <Text style={styles.noSlots}>Saatleri görmek için önce tarih seç.</Text>
        )}
        <Button
          title={
            selectedHour != null
              ? `${hourRangeLabel(selectedHour)} için ${isField ? 'kiralama' : 'ders'} talebi`
              : isField
                ? 'Kiralama Talebi Gönder'
                : 'Ders Talebi Gönder'
          }
          onPress={sendRequest}
          loading={busy}
          style={{ marginTop: 8 }}
        />
        {myPurchases.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.mySlotsLabel}>Taleplerin</Text>
            {myPurchases.map((p) => (
              <View key={p.id} style={styles.mySlotRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mySlotWhen}>
                    {formatSlot(p.slot_date, p.slot_time) ??
                      new Date(p.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text
                    style={[
                      styles.mySlotStatus,
                      p.status === 'accepted' && { color: colors.primaryDark },
                      p.status === 'rejected' && { color: colors.danger },
                    ]}
                  >
                    {p.status === 'pending'
                      ? 'Onay bekliyor'
                      : p.status === 'accepted'
                        ? 'Onaylandı'
                        : 'Reddedildi'}
                  </Text>
                </View>
                {p.status === 'pending' && (
                  <Pressable onPress={() => cancelRequest(p)} hitSlop={8}>
                    <Text style={styles.cancelLink}>İptal</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={styles.hero} />
        ) : null}

        <View style={styles.body}>
          <Text style={styles.sport}>{listing.sport}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.ratingRow}>
            <Stars rating={avg} size={16} />
            <Text style={styles.ratingText}>
              {avg > 0 ? avg.toFixed(1) : '—'} ({reviews.length} değerlendirme)
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {listing.city}, {listing.district}
            </Text>
          </View>

          <Pressable
            style={styles.ownerRow}
            onPress={() => navigation.navigate('UserProfile', { userId: listing.owner_id })}
          >
            <Avatar uri={listing.profiles?.avatar_url} name={listing.profiles?.username} size={36} />
            <Text style={styles.ownerName}>{listing.profiles?.username}</Text>
          </Pressable>

          {listing.description ? (
            <Text style={styles.description}>{listing.description}</Text>
          ) : null}

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>{isField ? 'Kiralama Ücreti' : 'Ders Ücreti'}</Text>
            <Text style={styles.price}>
              {Number(listing.price).toLocaleString('tr-TR')} ₺
              <Text style={styles.priceUnit}> /saat</Text>
            </Text>
          </View>

          {ownerScheduleBlock()}
          {bookingBlock()}

          {isOwner && (
            <Button
              title="İlanı Düzenle"
              variant="outline"
              onPress={() =>
                navigation.navigate('CreateListing', { type: listing.type, listingId: listing.id })
              }
              style={{ marginTop: 16 }}
            />
          )}

          {isOwner && (
            <Button
              title="İlanı Sil"
              variant="danger"
              onPress={() =>
                Alert.alert('İlanı Sil', 'Bu ilan kalıcı olarak silinecek. Emin misin?', [
                  { text: 'Vazgeç', style: 'cancel' },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                      const { error } = await supabase
                        .from('listings')
                        .delete()
                        .eq('id', listingId);
                      if (error) Alert.alert('Silinemedi', 'Bir hata oluştu, tekrar deneyin.');
                      else navigation.goBack();
                    },
                  },
                ])
              }
              style={{ marginTop: 16 }}
            />
          )}

          {isOwner && (
            <>
              <Text style={styles.sectionTitle}>Gelen Talepler</Text>
              {purchases.length === 0 ? (
                <Text style={styles.noReviews}>Henüz talep yok.</Text>
              ) : (
                purchases.map((p) => (
                  <View key={p.id} style={styles.requestCard}>
                    <Avatar uri={p.profiles?.avatar_url} name={p.profiles?.username} size={36} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.requestUser}>{p.profiles?.username}</Text>
                      <Text style={styles.requestDate}>
                        {formatSlot(p.slot_date, p.slot_time) ??
                          new Date(p.created_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    {p.status === 'pending' ? (
                      <View style={{ flexDirection: 'row' }}>
                        <Pressable
                          style={[styles.decisionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => decideRequest(p, 'accepted')}
                        >
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </Pressable>
                        <Pressable
                          style={[styles.decisionBtn, { backgroundColor: colors.danger, marginLeft: 8 }]}
                          onPress={() => decideRequest(p, 'rejected')}
                        >
                          <Ionicons name="close" size={18} color="#fff" />
                        </Pressable>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              p.status === 'accepted' ? colors.primarySoft : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: p.status === 'accepted' ? colors.primaryDark : colors.danger,
                          }}
                        >
                          {p.status === 'accepted' ? 'Onaylandı' : 'Reddedildi'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Değerlendirmeler</Text>

          {!isOwner && !myReview && canReview && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Deneyimini puanla</Text>
              <Stars rating={myRating} size={28} onChange={setMyRating} />
              <Input
                placeholder="Yorumun (isteğe bağlı)"
                value={myComment}
                onChangeText={setMyComment}
                containerStyle={{ marginTop: 12, marginBottom: 12 }}
              />
              <Button title="Gönder" onPress={sendReview} loading={sendingReview} />
            </View>
          )}

          {!isOwner && !myReview && !canReview && (
            <View style={styles.reviewLocked}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <Text style={styles.reviewLockedText}>
                Puanlama ve yorum, {isField ? 'kiralama' : 'ders'} talebin ilan sahibi tarafından
                onaylandıktan sonra açılır.
              </Text>
            </View>
          )}

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Henüz değerlendirme yapılmamış.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.review}>
                <Pressable
                  style={styles.reviewHeader}
                  onPress={() => navigation.navigate('UserProfile', { userId: r.user_id })}
                >
                  <Avatar uri={r.profiles?.avatar_url} name={r.profiles?.username} size={30} />
                  <Text style={styles.reviewUser}>{r.profiles?.username}</Text>
                  <Stars rating={r.rating} size={13} />
                </Pressable>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
  body: { padding: 16 },
  sport: { fontSize: 13, fontWeight: '700', color: colors.primary },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { marginLeft: 8, fontSize: 13, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaText: { marginLeft: 6, fontSize: 14, color: colors.textSecondary },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  ownerName: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: colors.text },
  description: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 14 },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  priceLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  price: { fontSize: 20, fontWeight: '800', color: colors.text },
  priceUnit: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    ...shadow.card,
  },
  bookingTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  bookingHint: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dateChip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dateChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  dateChipTextSelected: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  slot: {
    width: '48%',
    marginBottom: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotTaken: { opacity: 0.4 },
  slotMine: { borderColor: colors.primary, backgroundColor: colors.primarySoft, opacity: 1 },
  ownerSlot: { height: 52, paddingHorizontal: 8 },
  slotPending: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  slotFull: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  slotPast: { opacity: 0.45 },
  slotText: { fontSize: 13, fontWeight: '700', color: colors.text },
  slotStatus: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  slotTextSelected: { color: '#fff' },
  slotTextTaken: { textDecorationLine: 'line-through', color: colors.textMuted },
  noSlots: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  mySlotsLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  mySlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mySlotWhen: { fontSize: 13, fontWeight: '600', color: colors.text },
  mySlotStatus: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cancelLink: { fontSize: 13, fontWeight: '700', color: colors.danger },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 28, marginBottom: 12 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  requestUser: { fontSize: 14, fontWeight: '700', color: colors.text },
  requestDate: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  decisionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  reviewForm: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    ...shadow.card,
  },
  reviewFormTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  reviewLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  reviewLockedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  noReviews: { fontSize: 14, color: colors.textMuted },
  review: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewUser: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: colors.text },
  reviewComment: { marginTop: 8, fontSize: 14, color: colors.textSecondary, lineHeight: 19 },
});
