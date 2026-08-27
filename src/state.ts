import { TOTAL_STEPS } from "./path";

export interface DayLog {
  /** YYYY-MM-DD, local time */
  date: string;
  focusMin: number;
  distractMin: number;
}

/** How long the climb runs. The mountain always has thirty steps; a longer
 *  challenge simply means Margorn covers less ground each day. */
export type Duration = 14 | 30 | 60 | 90;

export const DURATIONS: {
  days: Duration;
  label: string;
  pace: string;
}[] = [
  { days: 14, label: "2 weeks", pace: "About two steps a day" },
  { days: 30, label: "1 month", pace: "One step a day" },
  { days: 60, label: "2 months", pace: "A step every other day" },
  { days: 90, label: "3 months", pace: "A step every third day" },
];

export interface Journey {
  /** what pulls you away — one or two things */
  distractions: string[];
  /** what deserves the hours — one or two things */
  pursuits: string[];
  totalDays: Duration;
  startDate: string;
  days: DayLog[];
  onboarded: boolean;
  summitSeen: boolean;
}

const KEY = "distraction-to-action.v1";

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const EMPTY: Journey = {
  distractions: [""],
  pursuits: [""],
  totalDays: 30,
  startDate: today(),
  days: [],
  onboarded: false,
  summitSeen: false,
};

/** Earlier builds stored one distraction and one pursuit as plain strings. */
interface LegacyJourney {
  distraction?: string;
  pursuit?: string;
}

export function load(): Journey {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<Journey> & LegacyJourney;
    const days = saved.days ?? [];
    return {
      ...EMPTY,
      ...saved,
      distractions: saved.distractions ?? [saved.distraction ?? ""],
      pursuits: saved.pursuits ?? [saved.pursuit ?? ""],
      totalDays: saved.totalDays ?? 30,
      startDate: saved.startDate ?? days[0]?.date ?? today(),
      days,
    };
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

export const sortedDays = (j: Journey) =>
  [...j.days].sort((a, b) => a.date.localeCompare(b.date));

/** Days that earned ground: any deliberate time at all counts. */
export const daysMoved = (j: Journey) =>
  j.days.filter((d) => d.focusMin > 0).length;

/**
 * Where Margorn stands, as a fraction between painted steps. Day zero is step
 * one; finishing the challenge is step thirty, whatever its length.
 */
export function stepPosition(j: Journey): number {
  const span = Math.max(j.totalDays - 1, 1);
  const pos = 1 + (daysMoved(j) * (TOTAL_STEPS - 1)) / span;
  return Math.min(Math.max(pos, 1), TOTAL_STEPS);
}

/** The highest step actually reached — the green goes this far. */
export const litStep = (j: Journey) => Math.floor(stepPosition(j));

export const atSummit = (j: Journey) => stepPosition(j) >= TOTAL_STEPS;

/**
 * A blank day leaves the step ahead burning red until you come back to it —
 * the day is marked on the mountain, but nothing is taken away.
 */
export function missedStep(j: Journey): number | null {
  const last = sortedDays(j).pop();
  if (!last || last.focusMin > 0) return null;
  return Math.min(Math.floor(stepPosition(j)) + 1, TOTAL_STEPS);
}

export const daysLeft = (j: Journey) =>
  Math.max(j.totalDays - 1 - daysMoved(j), 0);

/** Calendar date a given step falls on, from the day the climb began. */
export function dateForStep(j: Journey, step: number): Date {
  const span = Math.max(j.totalDays - 1, 1);
  const offset = Math.round(((step - 1) * span) / (TOTAL_STEPS - 1));
  const d = new Date(`${j.startDate}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d;
}

export const labelFor = (items: string[]) =>
  items.filter((s) => s.trim()).join(" & ");

/** Keeps at most two named things, dropping blanks and stray whitespace. */
export const tidy = (items: string[]) =>
  items.map((s) => s.trim()).filter(Boolean).slice(0, 2);

export interface PathLabel {
  step: number;
  text: string;
  strong?: boolean;
}

/** The day the climb began, then each step where a new month starts. */
export function pathLabels(j: Journey): PathLabel[] {
  const start = dateForStep(j, 1);
  const out: PathLabel[] = [
    { step: 1, text: formatDay(start), strong: true },
  ];
  let month = start.getMonth();
  for (let n = 2; n <= TOTAL_STEPS; n++) {
    const d = dateForStep(j, n);
    if (d.getMonth() !== month) {
      out.push({ step: n, text: formatMonth(d) });
      month = d.getMonth();
    }
  }
  return out;
}

export interface Ratio {
  focus: number;
  distract: number;
  /** minutes of deliberate work per minute lost, or null when nothing is logged */
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
  const sorted = sortedDays(j);
  return {
    recent: tally(sorted.slice(-7)),
    opening: sorted.length >= 6 ? tally(sorted.slice(0, 5)) : null,
    all: tally(sorted),
  };
}

/** Longest run of consecutive calendar days with deliberate time on them. */
export function longestRun(j: Journey): number {
  const moved = sortedDays(j).filter((d) => d.focusMin > 0);
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const d of moved) {
    const day = new Date(`${d.date}T12:00:00`).getTime() / 86_400_000;
    run = previous !== null && Math.round(day - previous) === 1 ? run + 1 : 1;
    previous = day;
    if (run > best) best = run;
  }
  return best;
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

/**
 * The interface is written in English, so its dates are too — spelled out here
 * rather than left to the visitor's locale, which would put Finnish month
 * abbreviations on an otherwise English mountain.
 */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const formatDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const formatMonth = (d: Date) => MONTHS[d.getMonth()];
