import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { play } from "./audio";
import { STEPS, TOTAL_STEPS, climberHeight, stepAt, type Face } from "./path";

const ART_RATIO = 1086 / 1448;

interface Props {
  /** which step Margorn is standing on (1…30) */
  step: number;
  /** how far the green goes — trails `step` while he is still walking */
  lit?: number;
  /** follow keeps the camera on him; full pulls back to the whole climb */
  view?: "follow" | "full";
  walking?: boolean;
  /** step number to light up with a burst, once */
  spark?: number | null;
  children?: React.ReactNode;
  className?: string;
}

/**
 * The painted mountain, with a camera on it.
 *
 * Ten of the thirty steps are round the back of the spiral. When the climb
 * reaches them the mountain turns — the artwork flips to its far side behind a
 * short veil — so Margorn and the steps ahead of him are always in frame.
 */
export function Mountain({
  step,
  lit = step,
  view = "follow",
  walking = false,
  spark = null,
  children,
  className = "",
}: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = scene.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const target = stepAt(step);
  const wantedFace: Face = view === "full" ? "front" : target.face;

  // The turn: hold the old side until the veil is down, then swap.
  const [face, setFace] = useState<Face>(wantedFace);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    if (face === wantedFace) return;
    setTurning(true);
    play("turn");
    const swap = window.setTimeout(() => setFace(wantedFace), 420);
    const done = window.setTimeout(() => setTurning(false), 900);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(done);
    };
  }, [wantedFace, face]);

  const worldW = box.w;
  const worldH = box.w * ART_RATIO;

  let z: number;
  let fx: number;
  let fy: number;
  let anchorX: number;
  let anchorY: number;

  if (view === "full") {
    z = worldH > 0 ? Math.min(1, box.h / worldH) : 1;
    fx = 0.5;
    fy = 0.5;
    anchorX = 0.5;
    anchorY = 0.5;
  } else {
    // Tighter the higher he gets — the summit sits near the top of the canvas,
    // so pulling in keeps the frame full of mountain rather than empty slope.
    const base = 2 + ((step - 1) / (TOTAL_STEPS - 1)) * 2.4;
    const cover = worldH > 0 ? box.h / worldH : 1;
    z = Math.max(base, cover + 0.02);
    fx = target.x / 100;
    fy = target.y / 100;
    anchorX = 0.4;
    anchorY = 0.6;
  }

  const clamp = (v: number, lo: number, hi: number) =>
    lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi);

  const tx = clamp(anchorX * box.w - fx * worldW * z, box.w - worldW * z, 0);
  const ty = clamp(anchorY * box.h - fy * worldH * z, box.h - worldH * z, 0);

  // The green artwork is shown only through the steps already climbed. Painted
  // steps are the same rock from either side, so on the far side the same
  // reveal is used, mirrored along with the image.
  const climbed = STEPS.filter((s) => s.face === "front" && s.n <= lit);
  const reveal = climbed
    .map((s) => {
      const x = face === "back" ? 100 - s.x : s.x;
      return `radial-gradient(ellipse ${s.w * 0.68}% ${s.h * 0.95}% at ${x}% ${
        s.y
      }%, #000 55%, rgba(0,0,0,0) 100%)`;
    })
    .join(", ");

  const hidden = STEPS.filter((s) => s.face === "back");
  const sparkStep = spark ? stepAt(spark) : null;

  return (
    <div ref={scene} className={`scene ${className}`}>
      <div
        className="world"
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${z})`,
          ["--travel" as string]: walking ? "1500ms" : "1100ms",
        }}
      >
        <img
          className={`face ${face === "back" ? "flipped" : ""}`}
          src="/art/mountain.jpg"
          alt="A dark mountain with a spiral of glowing steps winding to its summit"
          draggable={false}
        />

        {climbed.length > 0 && (
          <div
            className="lit"
            style={{
              WebkitMaskImage: reveal,
              maskImage: reveal,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
            aria-hidden
          >
            <img
              className={`face ${face === "back" ? "flipped" : ""}`}
              src="/art/mountain-lit.jpg"
              alt=""
              draggable={false}
            />
          </div>
        )}

        {face === "back" &&
          hidden.map((s) => (
            <div
              key={s.n}
              className={`marker ${s.n <= lit ? "done" : ""}`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.w * 1.18}%`,
                height: `${s.h * 0.9}%`,
              }}
              aria-hidden
            >
              <span>{s.n}</span>
            </div>
          ))}

        {/* One shadow over the whole far side, drawn markers included, so they
            sit in the same light as the painting. */}
        {face === "back" && <div className="far-side" aria-hidden />}

        {sparkStep && (
          <div
            key={`spark-${spark}`}
            className="spark"
            style={{
              left: `${sparkStep.x}%`,
              top: `${sparkStep.y}%`,
              width: `${sparkStep.w * 2.2}%`,
              height: `${sparkStep.w * 2.2 * (1 / ART_RATIO) * 0.55}%`,
            }}
            aria-hidden
          />
        )}

        <div
          className={`climber ${walking ? "walking" : ""}`}
          style={{
            ["--cx" as string]: `${target.x}%`,
            ["--cy" as string]: `${target.y + target.h * 0.1}%`,
            ["--ch" as string]: `${climberHeight(target)}%`,
            ["--travel" as string]: walking ? "1500ms" : "1100ms",
          }}
        >
          <img src="/art/margorn.png" alt="" draggable={false} />
        </div>
      </div>

      <div className="scene-fade" aria-hidden />
      <div className={`turn-veil ${turning ? "on" : ""}`} aria-hidden />
      {children}
    </div>
  );
}
