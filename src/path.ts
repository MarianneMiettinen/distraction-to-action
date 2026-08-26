/**
 * Where the thirty steps sit on the painted mountain.
 *
 * Coordinates are percentages of the artwork, measured off the painting itself
 * (the purple crystals were located by clustering their pixels, so these line up
 * exactly with the brushwork rather than being eyeballed).
 *
 * Twenty of the steps are painted on the face we can see. The other ten are
 * round the back of the spiral, so they live on the mirrored view of the same
 * artwork and are drawn as markers instead — see Mountain.tsx.
 */

export type Face = "front" | "back";

export interface Step {
  n: number;
  /** centre, as a % of the artwork */
  x: number;
  y: number;
  /** size of the crystal, as a % of the artwork */
  w: number;
  h: number;
  face: Face;
}

const IMG_W = 1448;
const IMG_H = 1086;

/** n, cx, cy, box width, box height — the last four in artwork pixels. */
const PAINTED: [number, number, number, number, number][] = [
  [1, 217, 915, 168, 60],
  [2, 382.5, 876.3, 105, 57],
  [3, 500.2, 854.1, 99, 50],
  [4, 609.4, 833.1, 91, 50],
  [5, 709.8, 808.4, 91, 50],
  [6, 797.4, 781.5, 84, 48],
  [7, 885.4, 747.2, 83, 48],
  [8, 967.4, 716.8, 80, 46],
  [9, 1045.9, 685.3, 76, 47],
  [10, 1123.3, 641.4, 73, 46],
  [11, 1188.7, 603.5, 68, 47],
  [12, 1255.4, 564.0, 63, 42],
  [20, 520.8, 357.8, 70, 36],
  [21, 602.0, 355.7, 69, 38],
  [22, 677.0, 347.2, 74, 39],
  [23, 749.3, 330.6, 77, 40],
  [24, 825.0, 303.2, 78, 41],
  [28, 606.2, 199.4, 85, 38],
  [29, 684.3, 175.4, 80, 39],
  [30, 749.3, 141.3, 60, 35],
];

const front = new Map<number, Step>();
for (const [n, cx, cy, bw, bh] of PAINTED) {
  front.set(n, {
    n,
    x: (cx / IMG_W) * 100,
    y: (cy / IMG_H) * 100,
    w: (bw / IMG_W) * 100,
    h: (bh / IMG_H) * 100,
    face: "front",
  });
}

/** A point on the front face, as it appears once the mountain has turned. */
function mirrored(n: number) {
  const s = front.get(n)!;
  return { x: 100 - s.x, y: s.y, w: s.w, h: s.h };
}

/**
 * Lays the hidden steps along an arc on the far side, running from where the
 * climber disappeared to where he reappears. Bow pushes the arc downhill so it
 * curves like the rest of the spiral instead of cutting straight across.
 */
function arc(from: number, to: number, ns: number[], bow: number): Step[] {
  const a = mirrored(from);
  const b = mirrored(to);
  const span = ns.length + 1;
  return ns.map((n, i) => {
    const t = (i + 1) / span;
    return {
      n,
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t + bow * Math.sin(Math.PI * t),
      w: a.w + (b.w - a.w) * t,
      h: a.h + (b.h - a.h) * t,
      face: "back" as Face,
    };
  });
}

const hidden = [
  ...arc(12, 20, [13, 14, 15, 16, 17, 18, 19], 3.2),
  ...arc(24, 28, [25, 26, 27], 1.6),
];

export const TOTAL_STEPS = 30;

export const STEPS: Step[] = [...front.values(), ...hidden].sort(
  (a, b) => a.n - b.n
);

export const stepAt = (n: number): Step =>
  STEPS[Math.round(Math.min(Math.max(n, 1), TOTAL_STEPS)) - 1];

/**
 * Where Margorn stands for a fractional position — on a longer challenge he
 * covers part of a step a day, so he needs to stand between the crystals.
 * Positions never interpolate across the fold: rounding the far side of the
 * mountain is a jump, not a slide.
 */
export function pointAt(pos: number): Step {
  const clamped = Math.min(Math.max(pos, 1), TOTAL_STEPS);
  const low = Math.floor(clamped);
  const t = clamped - low;
  const a = stepAt(low);
  if (t < 0.001 || low >= TOTAL_STEPS) return a;
  const b = stepAt(low + 1);
  if (b.face !== a.face) return t < 0.5 ? a : b;
  return {
    n: a.n,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
    face: a.face,
  };
}

/** How tall Margorn stands on a given step — smaller the higher he climbs. */
export const climberHeight = (s: Step) => s.h * 3.15;

/** First and last painted step on each side, for framing a manual spin. */
export const faceRange = (face: Face) => {
  const on = STEPS.filter((s) => s.face === face);
  return { first: on[0], last: on[on.length - 1] };
};
