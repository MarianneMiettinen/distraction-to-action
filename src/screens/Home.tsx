import { useEffect, useState } from "react";
import { Mountain } from "../Mountain";
import { loop, play, stop } from "../audio";
import { OrnateButton, RatioBar, SoundButton } from "../ui";
import { TOTAL_STEPS } from "../path";
import {
  formatMinutes,
  formatRatio,
  logFor,
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
  onAbout,
  step,
}: {
  journey: Journey;
  step: number;
  climb: Climb | null;
  onClimbEnd: () => void;
  onLog: () => void;
  onPath: () => void;
  onAbout: () => void;
}) {
  // While a climb is playing, the camera starts where he was and walks up.
  const [shown, setShown] = useState(step);
  const [lit, setLit] = useState(step);
  const [walking, setWalking] = useState(false);
  const [spark, setSpark] = useState<number | null>(null);
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (!climb) {
      setShown(step);
      setLit(step);
      return;
    }

    const timers: number[] = [];
    setSpark(null);

    if (!climb.moved) {
      setShown(climb.to);
      setLit(climb.to);
      setCaption("No step today. The mountain keeps your place.");
      play("noStep");
      timers.push(window.setTimeout(onClimbEnd, 2600));
    } else {
      // He walks first; the step only lights once he is standing on it.
      setShown(climb.from);
      setLit(climb.from);
      setWalking(true);
      loop("walk");
      timers.push(window.setTimeout(() => setShown(climb.to), 60));
      timers.push(
        window.setTimeout(() => {
          setLit(climb.to);
          setSpark(climb.to);
          setWalking(false);
          stop("walk");
          play(climb.returned ? "returned" : "step");
          setCaption(
            climb.to === TOTAL_STEPS
              ? "The summit."
              : climb.returned
              ? `Step ${climb.to}. Back on the mountain.`
              : `Step ${climb.to}. ${LINES[climb.to % LINES.length]}`
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

  return (
    <div className="screen">
      <Mountain
        className="grow"
        step={shown}
        lit={lit}
        walking={walking}
        spark={spark}
      >
        <div className="scene-badge">
          <p className="eyebrow">
            Step {lit} of {TOTAL_STEPS}
          </p>
          {todays && (
            <p className="meta" style={{ fontSize: ".72rem" }}>
              Today · {formatMinutes(todays.focusMin)}
            </p>
          )}
        </div>

        {caption && (
          <div className="scene-caption">
            <p className="serif" style={{ fontSize: "1.05rem", margin: 0 }}>
              {caption}
            </p>
          </div>
        )}
      </Mountain>

      <div className="stack" style={{ gap: ".4rem" }}>
        <div className="row spread" style={{ gap: ".6rem", alignItems: "baseline" }}>
          <p className="meta" style={{ minWidth: 0 }}>
            {recent.noLoss ? (
              <>
                <b style={{ color: "var(--gold-bright)", fontSize: "1rem" }}>
                  {formatMinutes(recent.focus)}
                </b>{" "}
                toward {trim(journey.pursuit)}, none lost
              </>
            ) : (
              <>
                <b style={{ color: "var(--gold-bright)", fontSize: "1rem" }}>
                  {formatRatio(recent.value)}
                </b>{" "}
                {recent.value === null
                  ? "nothing logged yet"
                  : `on ${trim(journey.pursuit)} for every hour lost`}
              </>
            )}
          </p>
          {opening?.value != null && recent.value != null && (
            <p className="meta" style={{ flex: "none", fontSize: ".72rem" }}>
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

      <div className="row spread">
        <button type="button" className="link" onClick={onPath}>
          See the whole climb
        </button>
        <button type="button" className="link" onClick={onAbout}>
          Attributions
        </button>
        <SoundButton />
      </div>
    </div>
  );
}

const trim = (s: string) => (s.length > 22 ? `${s.slice(0, 21)}…` : s || "it");
