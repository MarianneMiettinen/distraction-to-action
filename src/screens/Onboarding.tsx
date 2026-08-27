import { BackButton, Dots, OrnateButton, SoundButton, StoneCard } from "../ui";
import { DURATIONS, type Duration } from "../state";

export function Intro({ onNext }: { onNext: () => void }) {
  return (
    <div className="screen">
      <img className="intro-art" src="/art/mountain.jpg" alt="" aria-hidden />
      <div className="grow intro-copy">
        <p className="eyebrow">Distraction to Action</p>
        <h1>
          Thirty steps out of <span className="lit-word">the noise</span>.
        </h1>
        <p className="meta lede">
          Every day you give any time at all to what matters moves you one step
          up the mountain. Nothing else moves you — and nothing ever pushes you
          back down.
        </p>
      </div>
      <div className="row center intro-cta">
        <OrnateButton onClick={onNext}>Begin</OrnateButton>
      </div>
    </div>
  );
}

export function Reveal({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} />
        <SoundButton />
      </div>

      <div className="grow reveal-frame">
        <img
          className="reveal-art"
          src="/art/margorn-front.jpg"
          alt="Margorn, a young climber holding a glowing blue sword and a golden ring on a chain"
        />
        <div className="reveal-veil" aria-hidden />
        <div className="reveal-copy">
          <p className="eyebrow">Your climber</p>
          <h1 className="reveal-name">This is Margorn.</h1>
          <p className="meta reveal-text">
            He carries the ring you are trying to be rid of. He climbs only when
            you do something that matters — however small.
          </p>
        </div>
      </div>

      <div className="row center">
        <OrnateButton onClick={onNext}>Continue</OrnateButton>
      </div>
    </div>
  );
}

function TwoThings({
  index,
  heading,
  highlight,
  hint,
  first,
  second,
  values,
  onChange,
  onNext,
  onBack,
  cta = "Continue",
}: {
  index: number;
  heading: string;
  highlight: string;
  hint: string;
  first: string;
  second: string;
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  cta?: string;
}) {
  const one = values[0] ?? "";
  const two = values[1] ?? "";
  const id = `q${index}`;

  const set = (i: number, v: string) => {
    const next = [one, two];
    next[i] = v.replace(/\n/g, "");
    onChange(next);
  };

  const advance = () => {
    if (one.trim()) onNext();
  };

  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} />
        <Dots current={index} total={3} />
        <SoundButton />
      </div>

      <h1 id={`${id}-heading`}>
        {heading} <span className="lit-word">{highlight}</span>
      </h1>
      <p className="meta">{hint}</p>

      <div className="grow settle stack">
        <StoneCard lit className="card-compact">
          <div className="fields" role="group" aria-labelledby={`${id}-heading`}>
            <label className="field-row">
              <span className="sr-only">{first}</span>
              <input
                className="field"
                value={one}
                placeholder={first}
                autoFocus
                maxLength={40}
                enterKeyHint="next"
                onChange={(e) => set(0, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && advance()}
              />
            </label>

            <label className="field-row" hidden={!one.trim()}>
              <span className="sr-only">{second}</span>
              <input
                className="field"
                value={two}
                placeholder={second}
                maxLength={40}
                enterKeyHint="done"
                onChange={(e) => set(1, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && advance()}
              />
            </label>
          </div>
        </StoneCard>
      </div>

      <div className="row center">
        <OrnateButton onClick={advance} disabled={!one.trim()}>
          {cta}
        </OrnateButton>
      </div>
    </div>
  );
}

export function AskDistractions(p: {
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <TwoThings
      index={1}
      heading="What pulls you away from what"
      highlight="matters?"
      hint="One or two. Naming more than that just blurs them."
      first="scrolling my phone"
      second="and one more (optional)"
      {...p}
    />
  );
}

export function AskPursuits(p: {
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <TwoThings
      index={2}
      heading="What do you want to give your"
      highlight="hours to?"
      hint="One or two. These are what Margorn climbs for."
      first="job applications"
      second="and one more (optional)"
      {...p}
    />
  );
}

export function AskDuration({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: Duration;
  onChange: (v: Duration) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} />
        <Dots current={3} total={3} />
        <SoundButton />
      </div>

      <h1>
        How long is the <span className="lit-word">climb?</span>
      </h1>
      <p className="meta">
        The mountain is always thirty steps. A longer challenge means Margorn
        covers less ground each day — turning up daily still moves him every
        single time.
      </p>

      <div
        className="stack grow scroll settle options"
        role="radiogroup"
        aria-label="Length of the climb"
      >
        {DURATIONS.map((d) => (
          <button
            key={d.days}
            type="button"
            role="radio"
            className="option"
            aria-checked={value === d.days}
            onClick={() => onChange(d.days)}
          >
            <span>
              <span className="option-title">{d.label}</span>
              <br />
              <span className="meta">{d.pace}</span>
            </span>
            <i className="pip" />
          </button>
        ))}
      </div>

      <div className="row center">
        <OrnateButton onClick={onNext}>Begin the climb</OrnateButton>
      </div>
    </div>
  );
}
