import { useState } from "react";
import { play } from "../audio";
import { BackButton, OrnateButton, ScreenTitle } from "../ui";
import {
  formatMinutes,
  labelFor,
  logFor,
  today,
  type Journey,
} from "../state";

const HOUR = 60;
const MAX = 18 * HOUR;

function Counter({
  tone,
  eyebrow,
  title,
  value,
  onChange,
  note,
}: {
  tone: "good" | "bad";
  eyebrow: string;
  title: string;
  value: number;
  onChange: (v: number) => void;
  note?: string;
}) {
  const set = (v: number) => onChange(Math.min(Math.max(v, 0), MAX));
  const nudge = (delta: number) => {
    set(value + delta);
    play("tap");
  };

  return (
    <section className={`panel ${tone}`}>
      <p className="eyebrow tone-label">{eyebrow}</p>
      <h2 className="counter-title">{title}</h2>

      <div className="stepper" role="group" aria-label={`Time on ${title}`}>
        <button
          type="button"
          className="step-btn"
          onClick={() => nudge(-HOUR)}
          disabled={value === 0}
          aria-label={`One hour less on ${title}`}
        >
          −
        </button>

        <output className="tally" data-empty={value === 0} aria-live="polite">
          {formatMinutes(value)}
        </output>

        <button
          type="button"
          className="step-btn"
          onClick={() => nudge(HOUR)}
          disabled={value >= MAX}
          aria-label={`One hour more on ${title}`}
        >
          +
        </button>
      </div>

      <div className="chips">
        <button type="button" className="chip" onClick={() => nudge(15)}>
          +15 min
        </button>
        <button type="button" className="chip" onClick={() => nudge(30)}>
          +30 min
        </button>
        {value > 0 && (
          <button
            type="button"
            className="chip ghost"
            onClick={() => {
              set(0);
              play("back");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {note && <p className={`meta note-${tone}`}>{note}</p>}
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

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onCancel} label="Back to the mountain" />
        <ScreenTitle>{existing ? "Add to today" : "Today"}</ScreenTitle>
        <span className="spacer" />
      </div>

      <div className="stack grow scroll settle">
        <Counter
          tone="good"
          eyebrow="Toward what matters"
          title={labelFor(journey.pursuits) || "Your work"}
          value={focus}
          onChange={setFocus}
          note={
            focus > 0 ? "Any time at all moves Margorn forward." : undefined
          }
        />

        <Counter
          tone="bad"
          eyebrow="Lost to the pull"
          title={labelFor(journey.distractions) || "Your distraction"}
          value={distract}
          onChange={setDistract}
          note={
            distract > 0
              ? "Worth knowing. It costs you nothing on the climb."
              : undefined
          }
        />

        <p className="meta hint">
          Turning up every day for a little beats three big days and a week of
          nothing — the climb counts days, not hours.
        </p>

        {existing && (
          <p className="meta hint">
            Already today: {formatMinutes(existing.focusMin)} toward,{" "}
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
