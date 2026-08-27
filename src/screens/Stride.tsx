import { useEffect } from "react";
import { play } from "../audio";

/**
 * The beat between logging and the mountain: a push-in on Margorn facing you,
 * so the step reads as something he does rather than a number changing.
 * Tapping skips it.
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
    const t = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen stride" onClick={onDone}>
      <div className={`stride-stage ${moved ? "" : "still"}`}>
        <img
          className="stride-face"
          src="/art/margorn-front.jpg"
          alt=""
          draggable={false}
        />
        <span className="stride-vignette" aria-hidden />
        <span className="stride-flare" aria-hidden />
      </div>
      <h1 className="stride-word" aria-live="polite">
        {moved ? "He takes the step." : "He holds his ground."}
      </h1>
    </div>
  );
}
