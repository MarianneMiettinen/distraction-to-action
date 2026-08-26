import { useEffect, useState } from "react";
import { play } from "../audio";
import { OrnateButton } from "../ui";
import {
  daysMoved,
  formatMinutes,
  formatRatio,
  labelFor,
  ratios,
  type Journey,
} from "../state";

/** The ring goes into the magma. Two drawings, one fall between them. */
export function Summit({
  journey,
  onAgain,
  onHome,
}: {
  journey: Journey;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const { recent, opening, all } = ratios(journey);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        setPhase(1);
        play("ring");
      }, 2200),
      window.setTimeout(() => play("flare"), 4100),
      window.setTimeout(() => setPhase(2), 5200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="screen">
      <div className="summit" onClick={() => setPhase(2)}>
        <img
          src="/art/ring-held.jpg"
          alt="Margorn's hand holding the glowing golden ring above the magma"
          style={{ opacity: phase === 0 ? 1 : 0 }}
        />
        <img
          className={phase >= 1 ? "falling" : ""}
          src="/art/ring-falling.jpg"
          alt="The open hand, the ring falling away"
          style={{ opacity: phase === 0 ? 0 : 1 }}
          aria-hidden={phase === 0}
        />
        <div className="magma" aria-hidden />
        {phase >= 1 && <span className="flare" aria-hidden />}

        {phase < 2 && (
          <div className="scene-caption">
            <p className="serif scene-line">
              {phase === 0 ? "Thirty steps. The top." : "Let it go."}
            </p>
          </div>
        )}
      </div>

      {phase === 2 && (
        <>
          <div className="stack summit-copy">
            <h1>
              It is <span className="lit-word">gone.</span>
            </h1>
            <p className="meta lede">
              {formatMinutes(all.focus)} given to{" "}
              {labelFor(journey.pursuits) || "your work"} over {daysMoved(journey)}{" "}
              {daysMoved(journey) === 1 ? "day" : "days"} that counted.
              {opening?.value != null && recent.value != null && (
                <>
                  {" "}
                  You went from {formatRatio(opening.value)} to{" "}
                  {formatRatio(recent.value)}.
                </>
              )}
            </p>
          </div>

          <div className="stack summit-actions">
            <OrnateButton wide onClick={onAgain}>
              Climb again
            </OrnateButton>
            <button type="button" className="link" onClick={onHome}>
              Stay on the summit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
