import { BackButton, Dots, OrnateButton, SoundButton, StoneCard } from "../ui";

export function Intro({ onNext }: { onNext: () => void }) {
  return (
    <div className="screen">
      <img className="intro-art" src="/art/mountain.jpg" alt="" aria-hidden />
      <div className="grow" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.1rem" }}>
        <p className="eyebrow">Distraction to Action</p>
        <h1>
          Thirty steps out of <span className="lit-word">the noise</span>.
        </h1>
        <p className="meta" style={{ fontSize: "0.95rem", maxWidth: "26rem" }}>
          Every hour you give to what matters moves you one step up the mountain.
          Nothing else moves you — and nothing ever pushes you back down.
        </p>
      </div>
      <div className="row center" style={{ paddingBottom: "1rem" }}>
        <OrnateButton onClick={onNext}>Begin</OrnateButton>
      </div>
    </div>
  );
}

export function Reveal({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="screen">
      <div className="row">
        <BackButton onClick={onBack} />
      </div>

      <div className="grow" style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
        <img
          src="/art/margorn-front.jpg"
          alt="Margorn, a young climber holding a glowing blue sword and a golden ring on a chain"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(8,6,5,.7) 0%, transparent 25%, transparent 45%, rgba(8,6,5,.92) 95%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "1.1rem", padding: "0 1.2rem" }}>
          <p className="eyebrow">Your climber</p>
          <h2 style={{ marginTop: ".3rem" }}>This is Margorn.</h2>
          <p className="meta" style={{ marginTop: ".45rem" }}>
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

function Question({
  index,
  heading,
  highlight,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  cta = "Continue",
}: {
  index: number;
  heading: string;
  highlight: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  cta?: string;
}) {
  const id = `q${index}`;
  return (
    <div className="screen">
      <div className="row spread">
        <BackButton onClick={onBack} />
        <Dots current={index} total={3} />
        <SoundButton />
      </div>

      <label htmlFor={id}>
        <h1>
          {heading} <span className="lit-word">{highlight}</span>
        </h1>
      </label>

      <StoneCard lit className="grow" >
        <textarea
          id={id}
          className="field"
          style={{ height: "100%" }}
          value={value}
          placeholder={placeholder}
          autoFocus
          maxLength={80}
          onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (value.trim()) onNext();
            }
          }}
        />
      </StoneCard>

      <div className="row center">
        <OrnateButton onClick={onNext} disabled={!value.trim()}>
          {cta}
        </OrnateButton>
      </div>
    </div>
  );
}

export function AskDistraction(p: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Question
      index={1}
      heading="What pulls you away from what"
      highlight="matters?"
      placeholder="scrolling, TV, the news…"
      {...p}
    />
  );
}

export function AskPursuit(p: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Question
      index={2}
      heading="What do you want to give your"
      highlight="hours to?"
      placeholder="job applications, writing, training…"
      {...p}
    />
  );
}

const GOALS = [
  { min: 15, label: "15 minutes", sub: "A foot in the door" },
  { min: 30, label: "30 minutes", sub: "A real dent" },
  { min: 60, label: "1 hour", sub: "A proper session" },
  { min: 120, label: "2 hours", sub: "A deep day" },
];

export function AskGoal({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: number;
  onChange: (v: number) => void;
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
        How much in a day would feel like a <span className="lit-word">good day?</span>
      </h1>
      <p className="meta">
        Any time at all still moves Margorn. This is only the size of a day you
        would be glad about.
      </p>

      <div className="stack grow scroll" style={{ paddingTop: ".2rem" }}>
        {GOALS.map((g) => (
          <button
            key={g.min}
            type="button"
            className="option"
            aria-pressed={value === g.min}
            onClick={() => onChange(g.min)}
          >
            <span>
              <span className="serif" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                {g.label}
              </span>
              <br />
              <span className="meta">{g.sub}</span>
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
