import { Mountain } from "../Mountain";
import { TOTAL_STEPS } from "../path";
import { BackButton, ScreenTitle } from "../ui";
import {
  dateForStep,
  daysLeft,
  formatDay,
  labelFor,
  litStep,
  pathLabels,
  type Journey,
} from "../state";

export function Path({
  journey,
  step,
  onBack,
  onEdit,
}: {
  journey: Journey;
  step: number;
  onBack: () => void;
  onEdit: () => void;
}) {
  const here = litStep(journey);
  const left = TOTAL_STEPS - here;
  const ends = dateForStep(journey, TOTAL_STEPS);

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} label="Back to the mountain" />
        <ScreenTitle>The whole climb</ScreenTitle>
        <span className="spacer" />
      </div>

      <Mountain
        step={step}
        view="full"
        className="scene-fixed"
        labels={pathLabels(journey)}
      />

      <div className="stack grow scroll settle path-body">
        <div>
          <h2 className="serif">
            {left > 0 ? (
              <>
                Step {here}. <span className="lit-word">{left} to go.</span>
              </>
            ) : (
              <span className="lit-word">The summit.</span>
            )}
          </h2>
          <p className="meta path-note">
            Green steps are days you chose {labelFor(journey.pursuits) || "your work"}{" "}
            over {labelFor(journey.distractions) || "the pull"}. They stay green.
          </p>
        </div>

        <div className="figures">
          <div className="figure-cell">
            <p className="figure-value">{formatDay(dateForStep(journey, 1))}</p>
            <p className="meta figure-label">set out</p>
          </div>
          <div className="figure-cell">
            <p className="figure-value">{formatDay(ends)}</p>
            <p className="meta figure-label">
              {daysLeft(journey) > 0
                ? `${daysLeft(journey)} days to go`
                : "the summit"}
            </p>
          </div>
        </div>

        <div className="row center">
          <button type="button" className="link" onClick={onEdit}>
            Change what you are tracking
          </button>
        </div>
      </div>
    </div>
  );
}
