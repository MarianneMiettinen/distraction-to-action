import { Mountain } from "../Mountain";
import { TOTAL_STEPS } from "../path";
import { BackButton, RatioBar } from "../ui";
import { formatMinutes, formatRatio, ratios, type Journey } from "../state";

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
  const { recent, opening, all } = ratios(journey);
  const left = TOTAL_STEPS - step;

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} label="Back to the mountain" />
        <p className="eyebrow" style={{ color: "var(--muted)" }}>
          The whole climb
        </p>
        <span style={{ width: "2.9rem" }} />
      </div>

      <Mountain step={step} view="full" className="scene-fixed" />

      <div className="stack grow scroll" style={{ gap: ".9rem" }}>
        <div>
          <h2 className="serif">
            {left > 0 ? (
              <>
                Step {step}. <span className="lit-word">{left} to go.</span>
              </>
            ) : (
              <span className="lit-word">The summit.</span>
            )}
          </h2>
          <p className="meta" style={{ marginTop: ".35rem" }}>
            Green steps are days you chose {journey.pursuit || "your work"} over{" "}
            {journey.distraction || "the pull"}. They stay green.
          </p>
        </div>

        <div className="panel">
          <div className="row spread" style={{ marginBottom: ".55rem" }}>
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Last 7 days
            </p>
            <p className="meta">
              {recent.noLoss ? (
                "nothing lost"
              ) : (
                <>
                  <b style={{ color: "var(--gold-bright)", fontSize: "1rem" }}>
                    {formatRatio(recent.value)}
                  </b>{" "}
                  toward : lost
                </>
              )}
            </p>
          </div>
          <RatioBar focus={recent.focus} distract={recent.distract} />
          <div className="row" style={{ gap: "1rem", marginTop: ".6rem", flexWrap: "wrap" }}>
            <span className="row" style={{ gap: ".4rem" }}>
              <i className="swatch" style={{ background: "var(--gold)" }} />
              <span className="meta">{formatMinutes(recent.focus)} toward</span>
            </span>
            <span className="row" style={{ gap: ".4rem" }}>
              <i className="swatch" style={{ background: "var(--violet)" }} />
              <span className="meta">{formatMinutes(recent.distract)} lost</span>
            </span>
          </div>
          {opening?.value != null && recent.value != null && (
            <p className="meta" style={{ marginTop: ".6rem" }}>
              When you started it was{" "}
              <b style={{ color: "var(--parchment)" }}>{formatRatio(opening.value)}</b>.{" "}
              {recent.value > opening.value
                ? "The balance has moved your way."
                : "It has not moved yet — the steps still count."}
            </p>
          )}
        </div>

        <div className="panel">
          <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: ".5rem" }}>
            Since you began
          </p>
          <p className="meta">
            {formatMinutes(all.focus)} toward {journey.pursuit || "your work"} ·{" "}
            {journey.days.length} {journey.days.length === 1 ? "day" : "days"} logged
          </p>
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
