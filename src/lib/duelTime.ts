/** Yerel takvim günü: YYYY-MM-DD */
export function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTimeParts(startTime: string): [number, number, number] {
  const timeRaw = String(startTime);
  const timePart = (timeRaw.includes('T') ? timeRaw.split('T')[1] : timeRaw)
    .replace(/^\+/, '')
    .slice(0, 8);
  const normalized = timePart.length === 5 ? `${timePart}:00` : timePart;
  const [hs, mins, ss] = normalized.split(':');
  return [Number(hs), Number(mins), Number(ss || 0)];
}

/** Supabase date/time → yerel Date (ISO string parse Android'de bozulabiliyor). */
export function duelStartsAt(matchDate: string, startTime: string) {
  const datePart = String(matchDate).slice(0, 10);
  const [ys, ms, ds] = datePart.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const [h, mi, s] = parseTimeParts(startTime);
  if (![y, m, d, h, mi, s].every((n) => Number.isFinite(n))) return new Date(NaN);
  return new Date(y, m - 1, d, h, mi, s);
}

/** Maç başlangıcı şu andan sonra (veya eşit) mi? */
export function isDuelUpcoming(matchDate: string, startTime: string) {
  const datePart = String(matchDate).slice(0, 10);
  const today = localDateString();
  // Önce takvim günü — parse hatasında bile geçmiş günü aktif sayma.
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    if (datePart < today) return false;
    if (datePart > today) return true;
  }
  const when = duelStartsAt(matchDate, startTime);
  if (Number.isNaN(when.getTime())) return false;
  return when.getTime() >= Date.now();
}

export function isDuelPast(matchDate: string, startTime: string) {
  return !isDuelUpcoming(matchDate, startTime);
}

export function formatDuelDateTime(matchDate: string, startTime: string) {
  const when = duelStartsAt(matchDate, startTime);
  const timeRaw = String(startTime);
  const timePart = (timeRaw.includes('T') ? timeRaw.split('T')[1] : timeRaw).slice(0, 5);
  if (Number.isNaN(when.getTime())) {
    return `${String(matchDate).slice(0, 10)} • ${timePart}`;
  }
  // Farklı yıldaki maçlarda yılı da göster; yoksa "8 Ağustos" 2027'yi geçmiş sandırıyor.
  const showYear = when.getFullYear() !== new Date().getFullYear();
  const dateText = when.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(showYear ? { year: 'numeric' } : {}),
  });
  return `${dateText} • ${timePart}`;
}
