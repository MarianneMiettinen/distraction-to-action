import { TOTAL_STEPS } from "./path";

export interface DayLog {
  /** YYYY-MM-DD, local time */
  date: string;
  focusMin: number;
  distractMin: number;
}

export interface Journey {
  distraction: string;
  pursuit: string;
  dailyGoalMin: number;
  days: DayLog[];
  onboarded: boolean;
  summitSeen: boolean;
}

const KEY = "distraction-to-action.v1";

export const EMPTY: Journey = {
  distraction: "",
  pursuit: "",
  dailyGoalMin: 30,
  days: [],
  onboarded: false,
  summitSeen: false,
};

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function load(): Journey {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Journey>;
    return { ...EMPTY, ...parsed, days: parsed.days ?? [] };
  } catch {
    return EMPTY;
  }
}

export function save(j: Journey) {
  try {
    localStorage.setItem(KEY, JSON.stringify(j));
  } catch {
    /* private mode — the session still works, it just won't be remembered */
  }
}

/** One entry per calendar day; logging again tops up the same day. */
export function addTime(
  j: Journey,
  focusMin: number,
  distractMin: number
): Journey {
  const date = today();
  const days = [...j.days];
  const i = days.findIndex((d) => d.date === date);
  if (i >= 0) {
    days[i] = {
      date,
      focusMin: days[i].focusMin + focusMin,
      distractMin: days[i].distractMin + distractMin,
    };
  } else {
    days.push({ date, focusMin, distractMin });
  }
  return { ...j, days };
}

export const logFor = (j: Journey, date: string) =>
  j.days.find((d) => d.date === date);

/** Days that earned a step: any deliberate time at all counts. */
export const daysMoved = (j: Journey) =>
  j.days.filter((d) => d.focusMin > 0).length;

/** Step 1 is where you stand before the first day is logged. */
export const currentStep = (j: Journey) =>
  Math.min(daysMoved(j) + 1, TOTAL_STEPS);

export const atSummit = (j: Journey) => currentStep(j) >= TOTAL_STEPS;

export interface Ratio {
  focus: number;
  distract: number;
  /** hours of deliberate work per hour lost, or null when nothing is logged */
  value: number | null;
  /** nothing was lost at all — a ratio would be a meaningless huge number */
  noLoss: boolean;
}

function tally(days: DayLog[]): Ratio {
  const focus = days.reduce((s, d) => s + d.focusMin, 0);
  const distract = days.reduce((s, d) => s + d.distractMin, 0);
  if (focus === 0 && distract === 0)
    return { focus, distract, value: null, noLoss: false };
  if (distract === 0) return { focus, distract, value: null, noLoss: true };
  return { focus, distract, value: focus / distract, noLoss: false };
}

/** Recent form, and what it looked like at the start — the "am I improving?" answer. */
export function ratios(j: Journey) {
  const sorted = [...j.days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = tally(sorted.slice(-7));
  const opening = sorted.length >= 6 ? tally(sorted.slice(0, 5)) : null;
  return { recent, opening, all: tally(sorted) };
}

export function formatMinutes(min: number): string {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatRatio(v: number | null): string {
  if (v === null) return "—";
  if (v >= 10) return `${Math.round(v)}×`;
  return `${v.toFixed(1)}×`;
}
