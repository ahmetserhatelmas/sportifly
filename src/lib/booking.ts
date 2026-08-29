import { localDateString } from './duelTime';

/** ISO: 1=Pzt … 7=Paz */
export const WEEKDAYS = [
  { iso: 1, label: 'Pzt' },
  { iso: 2, label: 'Sal' },
  { iso: 3, label: 'Çar' },
  { iso: 4, label: 'Per' },
  { iso: 5, label: 'Cum' },
  { iso: 6, label: 'Cmt' },
  { iso: 7, label: 'Paz' },
] as const;

export const ALL_WEEKDAYS = WEEKDAYS.map((d) => d.iso);
export const BOOKING_HORIZON_DAYS = 7;

export function isoWeekday(date: Date) {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

export function parseOpenDays(value: number[] | null | undefined) {
  const days = (value ?? []).filter((n) => n >= 1 && n <= 7);
  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : [...ALL_WEEKDAYS];
}

export function formatOpenDays(value: number[] | null | undefined) {
  const days = parseOpenDays(value);
  if (days.length === 7) return 'Her gün';
  return WEEKDAYS.filter((d) => days.includes(d.iso)).map((d) => d.label).join(', ');
}

/** Bugünden itibaren en fazla 1 hafta, yalnızca açık günler. */
export function bookingDates(openDays: number[] | null | undefined, horizon = BOOKING_HORIZON_DAYS) {
  const allowed = new Set(parseOpenDays(openDays));
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < horizon; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (allowed.has(isoWeekday(d))) out.push(d);
  }
  return out;
}

export function dateChipLabel(date: Date) {
  const day = WEEKDAYS.find((d) => d.iso === isoWeekday(date))?.label ?? '';
  return `${day} ${date.getDate()}`;
}

export const HOUR_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 6;
  return String(h).padStart(2, '0');
});

export function hourLabel(hour: number | string) {
  const h = Number(hour);
  return `${String(h).padStart(2, '0')}:00`;
}

/** 10 → "10:00–11:00" */
export function hourRangeLabel(hour: number | string) {
  const h = Number(hour);
  return `${hourLabel(h)}–${hourLabel(h + 1)}`;
}

export function parseHour(value: string | number | null | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** "08:00:00" / "08:00" → 8 */
export function slotHour(slotTime: string) {
  return Number(String(slotTime).slice(0, 2));
}

export function generateSlots(
  openHour: number,
  closeHour: number,
  date: string,
  opts?: { includePast?: boolean }
) {
  const slots: number[] = [];
  const end = Math.max(openHour, closeHour);
  for (let h = openHour; h < end; h++) slots.push(h);

  const today = localDateString();
  if (!opts?.includePast && date === today) {
    const nowH = new Date().getHours();
    return slots.filter((h) => h > nowH);
  }
  return slots;
}

export function formatSlot(date: string | null | undefined, time: string | null | undefined) {
  if (!date) return null;
  const [y, m, d] = String(date).slice(0, 10).split('-');
  const when = new Date(Number(y), Number(m) - 1, Number(d));
  const dateText = Number.isNaN(when.getTime())
    ? String(date).slice(0, 10)
    : when.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  const timeText = time ? String(time).slice(0, 5) : '';
  return timeText ? `${dateText} • ${timeText}` : dateText;
}
