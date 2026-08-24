import type { Hub } from "./types";

export const DEFAULT_WORK_START_HOUR = 8;
export const DEFAULT_WORK_END_HOUR = 18;

// Offered in the picker when the browser won't enumerate the IANA database
// (Intl.supportedValuesOf is missing on older Safari). Not meant to be
// exhaustive — an admin can always type a zone id by hand.
const FALLBACK_TIME_ZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Africa/Johannesburg",
  "UTC",
];

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function supportedTimeZones(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  try {
    const all = intl.supportedValuesOf?.("timeZone");
    if (all && all.length > 0) return all;
  } catch {
    // Fall through to the curated list.
  }
  return FALLBACK_TIME_ZONES;
}

// The browser's own zone, used to preselect something sensible when an admin
// adds their first location.
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

// Minutes this zone is ahead of UTC right now — negative for the Americas.
// Derived by reading the zone's wall clock and diffing it against UTC rather
// than parsing an offset string, so half- and quarter-hour zones (India
// +5:30, Nepal +5:45, Chatham +12:45) come out exactly, and daylight saving
// is accounted for because it's computed at `now` rather than in the
// abstract.
export function zoneOffsetMinutes(
  timeZone: string,
  now: Date = new Date(),
): number | null {
  try {
    const p = partsFor(timeZone, now);
    const wallAsUtc = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour) % 24,
      Number(p.minute),
    );
    if (Number.isNaN(wallAsUtc)) return null;
    // The parts carry no seconds, so compare against a whole minute or the
    // current seconds leak into the result as error.
    const nowToMinute = Math.floor(now.getTime() / 60000) * 60000;
    return Math.round((wallAsUtc - nowToMinute) / 60000);
  } catch {
    return null;
  }
}

// Order a set of locations east to west by their live UTC offset — furthest
// ahead first — so reading down the column follows the day as it actually
// travels: it begins in Sydney, reaches India, then Europe, then the Americas
// last. Ties break on name so same-offset locations keep a stable order, and
// anything whose zone we can't resolve sinks to the bottom rather than
// disturbing the sequence.
export function sortHubsByOffset(hubs: Hub[], now: Date = new Date()): Hub[] {
  return [...hubs].sort((a, b) => {
    const oa = zoneOffsetMinutes(a.timeZone, now);
    const ob = zoneOffsetMinutes(b.timeZone, now);
    if (oa === null && ob === null) return a.name.localeCompare(b.name);
    // Unresolvable zones sink regardless of direction.
    if (oa === null) return 1;
    if (ob === null) return -1;
    return ob - oa || a.name.localeCompare(b.name);
  });
}

function partsFor(
  timeZone: string,
  now: Date,
): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) out[part.type] = part.value;
  return out;
}

// "Mon 3:42 pm" — weekday included because the whole point is that the other
// office may not be on the same day as you.
export function hubClock(hub: Hub, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: hub.timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(now);
  } catch {
    return "—";
  }
}

// Local hour, 0–23. Built from formatToParts rather than a formatted string
// so an "hour: 24" quirk at midnight can't leak through.
export function hubHour(hub: Hub, now: Date = new Date()): number | null {
  try {
    const hour = Number(partsFor(hub.timeZone, now).hour);
    if (Number.isNaN(hour)) return null;
    return hour % 24;
  } catch {
    return null;
  }
}

// The calendar date currently in force at this location, as YYYY-MM-DD.
export function hubDate(hub: Hub, now: Date = new Date()): string | null {
  try {
    const p = partsFor(hub.timeZone, now);
    if (!p.year || !p.month || !p.day) return null;
    return `${p.year}-${p.month}-${p.day}`;
  } catch {
    return null;
  }
}

// Is it a reasonable hour to expect a reply? Ranges that wrap past midnight
// (start 22, end 6) are handled.
export function isWithinWorkHours(hub: Hub, now: Date = new Date()): boolean {
  const hour = hubHour(hub, now);
  if (hour === null) return true;
  const start = hub.workStartHour ?? DEFAULT_WORK_START_HOUR;
  const end = hub.workEndHour ?? DEFAULT_WORK_END_HOUR;
  if (start === end) return true;
  return start < end
    ? hour >= start && hour < end
    : hour >= start || hour < end;
}

// Whole calendar days `hub` is ahead of `reference`. Sydney rolls over about
// fifteen hours before Chicago, so for much of the day this is +1 — which is
// exactly the thing that trips people up when they read a due date.
export function hubDayOffset(
  hub: Hub,
  reference: Hub,
  now: Date = new Date(),
): number | null {
  const a = hubDate(hub, now);
  const b = hubDate(reference, now);
  if (!a || !b) return null;
  const diff =
    new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
  return Math.round(diff / 86400000);
}

export function dayOffsetLabel(offset: number): string {
  if (offset === 0) return "";
  if (offset === 1) return "a day ahead";
  if (offset === -1) return "a day behind";
  return offset > 0 ? `${offset} days ahead` : `${Math.abs(offset)} days behind`;
}

// Current UTC offset, e.g. "GMT+11" — shown next to a zone id in the admin
// picker so an admin can sanity-check they've chosen the right one.
export function timeZoneOffsetLabel(
  timeZone: string,
  now: Date = new Date(),
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}
