import { useEffect } from "react";
import { play } from "../audio";

/**
 * The beat between logging and the mountain: Margorn strides toward you and
 * fills the frame, so the step reads as something he does rather than a number
 * changing. Tapping skips it.
 */
export function Stride({
  moved,
  onDone,
}: {
  moved: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    // A blank day keeps its sound for the red step itself, on the mountain.
    if (moved) play("walk");
    const t = window.setTimeout(onDone, 1250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen stride" onClick={onDone}>
      <div className="stride-stage">
        <span className="stride-glow" aria-hidden />
        <img
          className={`stride-figure ${moved ? "" : "still"}`}
          src="/art/margorn.png"
          alt=""
          draggable={false}
        />
      </div>
      <h1 className="stride-word" aria-live="polite">
        {moved ? "He takes the step." : "He holds his ground."}
      </h1>
    </div>
  );
}
