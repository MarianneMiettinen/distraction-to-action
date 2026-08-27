import { useEffect, useState } from "react";
import { Mountain } from "../Mountain";
import { loop, play, stop } from "../audio";
import { OrnateButton, RatioBar, ScreenTitle, SoundButton } from "../ui";
import { TOTAL_STEPS } from "../path";
import {
  daysLeft,
  daysMoved,
  formatMinutes,
  formatRatio,
  litStep,
  logFor,
  missedStep,
  pathLabels,
  ratios,
  today,
  type Journey,
} from "../state";

export interface Climb {
  from: number;
  to: number;
  focusAdded: number;
  /** false when the day was logged with no deliberate time */
  moved: boolean;
  /** the last day logged was a blank one — this is a return, not a streak */
  returned: boolean;
  /** today had already been logged with time on it before this */
  topUp: boolean;
}

const LINES = [
  "You chose it. That is the whole trick.",
  "One more than yesterday.",
  "The ring is a little lighter up here.",
  "Small, and it still counted.",
  "That is how the distance closes.",
  "Nobody saw it. It still moved you.",
  "Steady beats sudden.",
];

/**
 * The whole climb, and the only home: the mountain entire, what today did to
 * it, and every way on from here.
 */
export function Home({
  journey,
  climb,
  onClimbEnd,
  onLog,
  onRecords,
  onEdit,
  onAbout,
  step,
}: {
  journey: Journey;
  step: number;
  climb: Climb | null;
  onClimbEnd: () => void;
  onLog: () => void;
  onRecords: () => void;
  onEdit: () => void;
  onAbout: () => void;
}) {
  // While a climb is playing, he starts where he was and walks up.
  const [shown, setShown] = useState(step);
  const [lit, setLit] = useState(Math.floor(step));
  const [walking, setWalking] = useState(false);
  const [spark, setSpark] = useState<number | null>(null);
  const [tone, setTone] = useState<"green" | "red" | "blue">("green");
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (!climb) {
      setShown(step);
      setLit(Math.floor(step));
      return;
    }

    const timers: number[] = [];
    const landed = Math.floor(climb.to);
    setSpark(null);

    if (!climb.moved) {
      setShown(climb.to);
      setLit(landed);
      if (climb.topUp && climb.focusAdded > 0) {
        // Today's step was already taken; more time is still worth saying.
        setCaption(
          `Another ${formatMinutes(climb.focusAdded)}. Already on step ${landed} today.`
        );
      } else {
        // The step ahead catches fire and waits there for you.
        const ahead = missedStep(journey);
        setTone("red");
        setCaption("No step today. The one ahead is waiting.");
        timers.push(
          window.setTimeout(() => {
            if (ahead) setSpark(ahead);
            play("noStep");
          }, 350)
        );
      }
      timers.push(window.setTimeout(onClimbEnd, 3000));
    } else {
      setShown(climb.from);
      setLit(Math.floor(climb.from));
      setWalking(true);
      loop("walk");
      timers.push(window.setTimeout(() => setShown(climb.to), 60));
      timers.push(
        window.setTimeout(() => {
          const gained = landed > Math.floor(climb.from);
          setLit(landed);
          setWalking(false);
          stop("walk");
          if (gained) {
            // Coming back off a blank day lights the red step blue instead.
            setTone(climb.returned ? "blue" : "green");
            setSpark(landed);
            play(climb.returned ? "returned" : "step");
          }
          setCaption(
            climb.to >= TOTAL_STEPS
              ? "The summit."
              : climb.returned
              ? `Step ${landed}. Back on the mountain.`
              : gained
              ? `Step ${landed}. ${LINES[landed % LINES.length]}`
              : "Ground gained. The next step is close."
          );
        }, 1500)
      );
      timers.push(window.setTimeout(onClimbEnd, 3600));
    }

    return () => {
      timers.forEach(window.clearTimeout);
      stop("walk");
      setWalking(false);
      setCaption(null);
      setSpark(null);
      setTone("green");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climb]);

  const { recent, opening } = ratios(journey);
  const todays = logFor(journey, today());
  const busy = climb !== null;
  const pursuit = journey.pursuits[0]?.trim() || "your work";
  const dayNumber = Math.min(daysMoved(journey) + 1, journey.totalDays);
  const remaining = daysLeft(journey);
  const here = litStep(journey);

  return (
    <div className="screen">
      <header className="row spread home-head">
        <div>
          <ScreenTitle>Home — The Whole Climb</ScreenTitle>
          <p className="meta home-day">
            Day {dayNumber} of {journey.totalDays} ·{" "}
            {remaining > 0
              ? `${remaining} ${remaining === 1 ? "day" : "days"} to go`
              : "the summit"}
          </p>
        </div>
        <SoundButton />
      </header>

      <div className="grow row center scene-slot">
        <Mountain
          className="scene-fit"
          view="full"
          step={shown}
          lit={lit}
          walking={walking}
          spark={spark}
          sparkTone={tone}
          missed={missedStep(journey)}
          labels={pathLabels(journey)}
          spinnable={!busy}
        >
          <div className="scene-badge">
            <p className="eyebrow">
              Step {lit} of {TOTAL_STEPS}
            </p>
            {todays && (
              <p className="meta scene-today">
                Today · {formatMinutes(todays.focusMin)}
              </p>
            )}
          </div>

          <div className="scene-caption" aria-live="polite">
            {caption && <p className="serif scene-line">{caption}</p>}
          </div>
        </Mountain>
      </div>

      <div className="stack ratio-strip">
        {/* One sentence, so it wraps without leaving a hole beside it. */}
        <p className="meta ratio-line">
          {recent.noLoss ? (
            <>
              <b className="figure">{formatMinutes(recent.focus)}</b> toward{" "}
              {pursuit}, none lost
            </>
          ) : (
            <>
              <b className="figure">{formatRatio(recent.value)}</b>{" "}
              {recent.value === null
                ? "nothing logged yet"
                : `on ${pursuit} for every hour lost`}
            </>
          )}
          {opening?.value != null && recent.value != null && (
            <span className="ratio-then">
              {" "}
              — {recent.value >= opening.value ? "up from" : "was"}{" "}
              {formatRatio(opening.value)}
            </span>
          )}
        </p>
        <RatioBar focus={recent.focus} distract={recent.distract} />
      </div>

      <div className="row center">
        <OrnateButton onClick={onLog} disabled={busy} wide>
          {todays ? "Add to today" : "Log today"}
        </OrnateButton>
      </div>

      <nav className="nav-row" aria-label="Elsewhere in the climb">
        <OrnateButton onClick={onRecords} disabled={busy} small>
          Records
        </OrnateButton>
        <OrnateButton onClick={onEdit} disabled={busy} small>
          Change tracking
        </OrnateButton>
      </nav>

      <div className="row center">
        <button type="button" className="link" onClick={onAbout}>
          Attributions
        </button>
        <span className="sr-only">
          Step {here} of {TOTAL_STEPS}.
        </span>
      </div>
    </div>
  );
}
