import { useEffect, useState } from "react";
import { Mountain } from "../Mountain";
import { loop, play, stop } from "../audio";
import { OrnateButton, RatioBar, SoundButton } from "../ui";
import { TOTAL_STEPS } from "../path";
import {
  daysMoved,
  formatMinutes,
  formatRatio,
  logFor,
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

export function Home({
  journey,
  climb,
  onClimbEnd,
  onLog,
  onPath,
  onRecords,
  onAbout,
  step,
}: {
  journey: Journey;
  step: number;
  climb: Climb | null;
  onClimbEnd: () => void;
  onLog: () => void;
  onPath: () => void;
  onRecords: () => void;
  onAbout: () => void;
}) {
  // While a climb is playing, the camera starts where he was and walks up.
  const [shown, setShown] = useState(step);
  const [lit, setLit] = useState(Math.floor(step));
  const [walking, setWalking] = useState(false);
  const [spark, setSpark] = useState<number | null>(null);
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
        setCaption("No step today. The mountain keeps your place.");
        play("noStep");
      }
      timers.push(window.setTimeout(onClimbEnd, 2600));
    } else {
      // He walks first; the step only lights once he is standing on it.
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climb]);

  const { recent, opening } = ratios(journey);
  const todays = logFor(journey, today());
  const busy = climb !== null;
  // The strip has one line to work with, so it names the first pursuit rather
  // than truncating both.
  const pursuit = journey.pursuits[0]?.trim() || "your work";
  const dayNumber = Math.min(daysMoved(journey) + 1, journey.totalDays);

  return (
    <div className="screen">
      <header className="row spread home-head">
        <div>
          <h1 className="eyebrow app-name">Distraction to Action</h1>
          <p className="meta home-day">
            Day {dayNumber} of {journey.totalDays}
          </p>
        </div>
        <SoundButton />
      </header>

      <Mountain
        className="grow"
        step={shown}
        lit={lit}
        walking={walking}
        spark={spark}
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

      <div className="stack ratio-strip">
        <div className="row spread ratio-line">
          <p className="meta">
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
          </p>
          {opening?.value != null && recent.value != null && (
            <p className="meta ratio-then">
              {recent.value >= opening.value ? "up from" : "was"}{" "}
              {formatRatio(opening.value)}
            </p>
          )}
        </div>
        <RatioBar focus={recent.focus} distract={recent.distract} />
      </div>

      <div className="row center">
        <OrnateButton onClick={onLog} disabled={busy} wide>
          {todays ? "Add to today" : "Log today"}
        </OrnateButton>
      </div>

      <nav className="nav-row" aria-label="Elsewhere in the climb">
        <OrnateButton onClick={onPath} disabled={busy} small>
          The whole climb
        </OrnateButton>
        <OrnateButton onClick={onRecords} disabled={busy} small>
          Records
        </OrnateButton>
      </nav>

      <div className="row center">
        <button type="button" className="link" onClick={onAbout}>
          Attributions
        </button>
      </div>
    </div>
  );
}
