// Calendar-date helpers, all working in the browser's *local* timezone on
// purpose. `new Date().toISOString().slice(0, 10)` yields the UTC date, which
// is still yesterday for most of a Sydney morning — that's what makes a
// "move to tomorrow" action land back on today. Everything below goes
// through toIso() so a date is the date the person is actually living in.

export function toIso(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return toIso(new Date());
}

// Add (or subtract) whole days to a YYYY-MM-DD string. Parsed at midnight
// local so DST transitions don't shunt the result into the previous day.
export function shiftIso(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

// Whole days from today to `iso`. Negative means it's in the past.
export function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const then = new Date(`${iso}T00:00:00`).getTime();
  const now = new Date(`${todayIso()}T00:00:00`).getTime();
  return Math.round((then - now) / 86400000);
}

export function daysSince(iso: string | undefined): number | null {
  const n = daysUntil(iso);
  return n === null ? null : -n;
}

export function nowHm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

// Has this date (plus optional HH:MM) already passed on the reader's clock?
export function hasArrived(
  date: string | undefined,
  time?: string,
): boolean {
  if (!date) return false;
  const today = todayIso();
  if (date < today) return true;
  if (date > today) return false;
  return !time || time <= nowHm();
}

export function formatShort(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function formatLong(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// "today" / "tomorrow" / "in 4 days" / "3 days ago" — used for reminder
// countdowns, where a bare date reads as more work than a relative phrase.
export function countdownLabel(iso: string | undefined): string {
  const n = daysUntil(iso);
  if (n === null) return "—";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n < 0 ? `${Math.abs(n)} days ago` : `in ${n} days`;
}
