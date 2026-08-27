import { BackButton, RatioBar, ScreenTitle } from "../ui";
import { TOTAL_STEPS } from "../path";
import {
  daysMoved,
  formatMinutes,
  formatRatio,
  labelFor,
  litStep,
  longestRun,
  ratios,
  sortedDays,
  type Journey,
} from "../state";

interface Rune {
  id: string;
  title: string;
  earned: string;
  locked: string;
  mark: string;
  tone: "gold" | "green" | "violet" | "blue";
  won: boolean;
}

function runes(j: Journey): Rune[] {
  const days = sortedDays(j);
  const moved = days.filter((d) => d.focusMin > 0);
  const returned = days.some(
    (d, i) => i > 0 && days[i - 1].focusMin === 0 && d.focusMin > 0
  );
  const tipped = days.some((d) => d.focusMin > d.distractMin && d.focusMin > 0);
  const clear = days.some((d) => d.focusMin > 0 && d.distractMin === 0);
  const run = longestRun(j);
  const step = litStep(j);

  return [
    {
      id: "first",
      title: "First Step",
      earned: "You logged a day that counted",
      locked: "Log any deliberate time",
      mark: "I",
      tone: "gold",
      won: moved.length >= 1,
    },
    {
      id: "return",
      title: "The Return",
      earned: "You came back after a blank day",
      locked: "Come back after a blank day",
      mark: "↺",
      tone: "blue",
      won: returned,
    },
    {
      id: "tipped",
      title: "Scales Tipped",
      earned: "A day where the work outweighed the pull",
      locked: "Out-work the pull for one day",
      mark: "⚖",
      tone: "gold",
      won: tipped,
    },
    {
      id: "clear",
      title: "Clear Air",
      earned: "A day given entirely to the work",
      locked: "A day with nothing lost",
      mark: "○",
      tone: "green",
      won: clear,
    },
    {
      id: "three",
      title: "Three in a Row",
      earned: "Three days running",
      locked: "Turn up three days running",
      mark: "III",
      tone: "violet",
      won: run >= 3,
    },
    {
      id: "seven",
      title: "Seven in a Row",
      earned: "A full week without missing",
      locked: "Turn up seven days running",
      mark: "VII",
      tone: "violet",
      won: run >= 7,
    },
    {
      id: "half",
      title: "Halfway",
      earned: "Past the middle of the mountain",
      locked: `Reach step ${Math.ceil(TOTAL_STEPS / 2)}`,
      mark: "△",
      tone: "green",
      won: step >= Math.ceil(TOTAL_STEPS / 2),
    },
    {
      id: "summit",
      title: "The Ring",
      earned: "You carried it to the top and let it go",
      locked: "Reach the summit",
      mark: "✦",
      tone: "gold",
      won: step >= TOTAL_STEPS,
    },
  ];
}

/**
 * One column a day: gold for time given, violet for time lost. Stacked rather
 * than overlaid, because the thing worth seeing is the gold taking over the
 * column — two overlapping areas just turn to mud where they cross.
 */
function Trace({ journey }: { journey: Journey }) {
  const all = sortedDays(journey);
  const days = all.slice(-30);
  if (days.length < 2) return null;

  const W = 100;
  const H = 40;
  const slot = W / days.length;
  const bar = Math.min(slot * 0.66, 3.4);
  const peak = Math.max(60, ...days.map((d) => d.focusMin + d.distractMin));
  const scale = (v: number) => (v / peak) * H;

  const totals = days.reduce(
    (a, d) => ({ f: a.f + d.focusMin, b: a.b + d.distractMin }),
    { f: 0, b: 0 }
  );

  return (
    <figure className="trace">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Day by day over the last ${days.length} days: ${formatMinutes(
          totals.f
        )} given, ${formatMinutes(totals.b)} lost.`}
      >
        {days.map((d, i) => {
          const x = i * slot + (slot - bar) / 2;
          const good = scale(d.focusMin);
          const bad = scale(d.distractMin);
          const blank = d.focusMin + d.distractMin === 0;
          return (
            <g key={d.date}>
              {blank ? (
                <rect
                  x={x}
                  y={H - 0.5}
                  width={bar}
                  height={0.5}
                  fill="rgba(236,229,216,0.18)"
                />
              ) : (
                <>
                  <rect
                    x={x}
                    y={H - good - bad}
                    width={bar}
                    height={bad}
                    fill="rgba(139,92,246,0.72)"
                  />
                  <rect
                    x={x}
                    y={H - good}
                    width={bar}
                    height={good}
                    fill="var(--gold)"
                  />
                </>
              )}
            </g>
          );
        })}
        <rect x="0" y={H - 0.16} width={W} height="0.16" fill="rgba(236,229,216,0.16)" />
      </svg>
      <figcaption className="row spread trace-foot">
        <span className="meta">
          {days.length === all.length ? "Day 1" : `${days.length} days back`}
        </span>
        <span className="meta">Today</span>
      </figcaption>
    </figure>
  );
}

export function Records({
  journey,
  onBack,
}: {
  journey: Journey;
  onBack: () => void;
}) {
  const { recent, opening, all } = ratios(journey);
  const marks = runes(journey);
  const won = marks.filter((m) => m.won).length;
  const run = longestRun(journey);
  const moved = daysMoved(journey);
  const pursuit = labelFor(journey.pursuits) || "your work";

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} label="Back to the mountain" />
        <ScreenTitle>Records</ScreenTitle>
        <span className="spacer" />
      </div>

      <div className="stack grow scroll records">
        <div className="figures">
          <Figure value={String(moved)} label={moved === 1 ? "day climbed" : "days climbed"} />
          <Figure value={String(run)} label="longest run" />
          <Figure value={formatMinutes(all.focus)} label={`toward ${pursuit}`} wide />
        </div>

        <section className="card-panel">
          <div className="row spread panel-head">
            <h2 className="eyebrow screen-title">Last 7 days</h2>
            <p className="meta">
              {recent.noLoss ? (
                "nothing lost"
              ) : (
                <>
                  <b className="figure">{formatRatio(recent.value)}</b> toward : lost
                </>
              )}
            </p>
          </div>
          <RatioBar focus={recent.focus} distract={recent.distract} />
          <div className="row keys">
            <span className="row key">
              <i className="swatch gold" />
              <span className="meta">{formatMinutes(recent.focus)} toward</span>
            </span>
            <span className="row key">
              <i className="swatch violet" />
              <span className="meta">{formatMinutes(recent.distract)} lost</span>
            </span>
          </div>
          {opening?.value != null && recent.value != null && (
            <p className="meta panel-note">
              When you started it was{" "}
              <b className="plain">{formatRatio(opening.value)}</b>.{" "}
              {recent.value > opening.value
                ? "The balance has moved your way."
                : "It has not moved yet — the steps still count."}
            </p>
          )}
        </section>

        {journey.days.length >= 2 ? (
          <section className="card-panel">
            <h2 className="eyebrow screen-title panel-head">Day by day</h2>
            <Trace journey={journey} />
          </section>
        ) : (
          <section className="card-panel empty">
            <p className="meta">
              Log a second day and the shape of the climb starts showing up
              here.
            </p>
          </section>
        )}

        <section>
          <div className="row spread panel-head">
            <h2 className="eyebrow screen-title">Marks earned</h2>
            <p className="meta">
              {won} of {marks.length}
            </p>
          </div>
          <ul className="runes">
            {marks.map((m) => (
              <li key={m.id} className={`rune ${m.tone} ${m.won ? "won" : ""}`}>
                <span className="rune-mark" aria-hidden>
                  {m.mark}
                </span>
                <span className="rune-body">
                  <span className="rune-title">{m.title}</span>
                  <span className="meta rune-note">
                    {m.won ? m.earned : m.locked}
                  </span>
                </span>
                <span className="sr-only">
                  {m.won ? "Earned." : "Not yet earned."}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Figure({
  value,
  label,
  wide,
}: {
  value: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <div className={`figure-cell card-cell ${wide ? "wide" : ""}`}>
      <p className="figure-value">{value}</p>
      <p className="meta figure-label">{label}</p>
    </div>
  );
}
