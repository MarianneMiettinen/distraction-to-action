import { useEffect, useState, type ReactNode } from "react";
import { onSoundChange, play, soundOn, toggleSound, wakeAudio } from "./audio";

export function OrnateButton({
  children,
  onClick,
  disabled,
  wide,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn ${wide ? "btn-wide" : ""}`}
      onClick={() => {
        wakeAudio();
        play("tap");
        onClick?.();
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => {
        play("back");
        onClick();
      }}
      aria-label={label}
    />
  );
}

export function SoundButton() {
  const [on, setOn] = useState(soundOn);
  useEffect(() => onSoundChange(setOn), []);
  return (
    <button
      type="button"
      className={`sound-btn ${on ? "" : "muted"}`}
      onClick={() => setOn(toggleSound())}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
    />
  );
}

export function StoneCard({
  children,
  lit,
  className = "",
}: {
  children: ReactNode;
  lit?: boolean;
  className?: string;
}) {
  return <div className={`card ${lit ? "card-lit" : ""} ${className}`}>{children}</div>;
}

export function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="dots" role="img" aria-label={`Question ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <i className={`dot-line ${i < current ? "on" : ""}`} />}
          <i className={`dot ${i < current ? "on" : ""}`} />
        </span>
      ))}
    </div>
  );
}

/** Deliberate time against lost time, as one bar you can read in a glance. */
export function RatioBar({ focus, distract }: { focus: number; distract: number }) {
  const total = focus + distract;
  const good = total > 0 ? (focus / total) * 100 : 0;
  return (
    <div className="ratio-bar" aria-hidden>
      <i className="good" style={{ width: `${good}%` }} />
      <i className="bad" style={{ width: `${100 - good}%` }} />
    </div>
  );
}
