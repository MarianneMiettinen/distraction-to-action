import { useState } from "react";
import { BackButton, OrnateButton } from "../ui";
import { formatMinutes, logFor, today, type Journey } from "../state";

const STEPS_MIN = [15, 30, 60, 120];

function Counter({
  tone,
  eyebrow,
  title,
  value,
  onAdd,
  onClear,
  note,
}: {
  tone: "good" | "bad";
  eyebrow: string;
  title: string;
  value: number;
  onAdd: (m: number) => void;
  onClear: () => void;
  note?: string;
}) {
  const color = tone === "good" ? "var(--gold-bright)" : "var(--violet-soft)";
  return (
    <section className={`panel ${tone}`}>
      <p className="eyebrow" style={{ color }}>
        {eyebrow}
      </p>
      <h3
        className="serif"
        style={{ fontSize: "1.15rem", margin: ".2rem 0 .7rem", fontWeight: 500 }}
      >
        {title}
      </h3>

      <div className="row spread" style={{ marginBottom: ".7rem" }}>
        <span className="tally" style={{ color: value ? color : "var(--faint)" }}>
          {formatMinutes(value)}
        </span>
        {value > 0 && (
          <button type="button" className="chip ghost" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="chips">
        {STEPS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            className="chip"
            onClick={() => onAdd(m)}
            aria-label={`Add ${formatMinutes(m)} to ${title}`}
          >
            +{m < 60 ? `${m} min` : `${m / 60} h`}
          </button>
        ))}
      </div>

      {note && (
        <p className="meta" style={{ marginTop: ".6rem", color }}>
          {note}
        </p>
      )}
    </section>
  );
}

export function Log({
  journey,
  onCancel,
  onSubmit,
}: {
  journey: Journey;
  onCancel: () => void;
  onSubmit: (focusMin: number, distractMin: number) => void;
}) {
  const [focus, setFocus] = useState(0);
  const [distract, setDistract] = useState(0);
  const existing = logFor(journey, today());

  const goalHit = focus > 0 && focus + (existing?.focusMin ?? 0) >= journey.dailyGoalMin;

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onCancel} label="Back to the mountain" />
        <p className="eyebrow" style={{ color: "var(--muted)" }}>
          {existing ? "Add to today" : "Today"}
        </p>
        <span style={{ width: "2.9rem" }} />
      </div>

      <div className="stack grow scroll">
        <Counter
          tone="good"
          eyebrow="Toward what matters"
          title={journey.pursuit || "Your work"}
          value={focus}
          onAdd={(m) => setFocus((v) => Math.min(v + m, 24 * 60))}
          onClear={() => setFocus(0)}
          note={
            goalHit
              ? "That is a good day by your own measure."
              : focus > 0
              ? "Any time at all moves Margorn one step."
              : undefined
          }
        />

        <Counter
          tone="bad"
          eyebrow="Lost to the pull"
          title={journey.distraction || "Your distraction"}
          value={distract}
          onAdd={(m) => setDistract((v) => Math.min(v + m, 24 * 60))}
          onClear={() => setDistract(0)}
          note={
            distract > 0
              ? "Worth knowing. It costs you nothing on the climb."
              : undefined
          }
        />

        {existing && (
          <p className="meta" style={{ textAlign: "center" }}>
            Already logged today: {formatMinutes(existing.focusMin)} toward,{" "}
            {formatMinutes(existing.distractMin)} lost.
          </p>
        )}
      </div>

      <div className="row center">
        <OrnateButton
          wide
          disabled={focus === 0 && distract === 0}
          onClick={() => onSubmit(focus, distract)}
        >
          {focus > 0 ? "Take the step" : "Log the day"}
        </OrnateButton>
      </div>
    </div>
  );
}
