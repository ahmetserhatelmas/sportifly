import { localDateString } from './duelTime';

export const HOUR_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 6;
  return String(h).padStart(2, '0');
});

export function hourLabel(hour: number | string) {
  const h = Number(hour);
  return `${String(h).padStart(2, '0')}:00`;
}

export function parseHour(value: string | number | null | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** "08:00:00" / "08:00" → 8 */
export function slotHour(slotTime: string) {
  return Number(String(slotTime).slice(0, 2));
}

export function generateSlots(openHour: number, closeHour: number, date: string) {
  const slots: number[] = [];
  const end = Math.max(openHour, closeHour);
  for (let h = openHour; h < end; h++) slots.push(h);

  const today = localDateString();
  if (date === today) {
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
