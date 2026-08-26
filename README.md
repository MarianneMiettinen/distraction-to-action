# Distraction to Action

A thirty-step climb. You name one or two things that pull you away and one or
two that deserve your hours; every day you give any time at all to the second
kind, Margorn gains ground and the step he reaches turns from purple to green.
Steps already climbed stay green. Nothing ever pushes him back down.

The point is not a productivity dashboard. It is visible evidence that
deliberate choices are accumulating — and that the ratio of time given to time
lost is moving the right way.

Turning up daily for a little beats three big days and a week of nothing: the
climb counts days, not hours.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5183.

```bash
npm run build
```

Everything lives in `localStorage` — no account, no backend, nothing leaves the
device.

## How the mountain works

The mountain is one painting, and Margorn was painted onto step 1 of it. Two
things had to be true that the painting alone could not do: he has to move, and
the steps have to change colour. `tools/prepare_assets.py` handles both:

- it clones the slope over the painted climber and cuts him into his own sprite,
  so the app can place him on any step;
- it generates a second copy of the mountain with the purple crystals hue-rotated
  to green. The app reveals that copy through ellipse masks at the steps already
  climbed, so a completed step keeps the original brushwork instead of being
  covered by a flat CSS shape.

Ten of the thirty steps are round the back of the spiral. The mountain turns to
follow the climb, and can be turned by hand — swipe it, or use the arrows on
either side — so the far side is never hidden. Turning flips the artwork to its
mirrored side behind a short veil and holds it in shadow, with drawn markers
standing in for the crystals the painting does not show. The camera is a single
GPU transform on one layer, so the walk stays smooth.

Step coordinates in `src/path.ts` were measured by clustering the purple pixels
of the painting, not estimated by eye.

The mountain is always thirty steps because its crystals are painted and
numbered. A longer challenge therefore means Margorn covers a fraction of a step
each day rather than a whole one — he still moves every single day, which is the
part that matters. `src/state.ts` holds that mapping.

Re-run the asset pipeline after editing anything in `design/`:

```bash
python tools/prepare_assets.py
```

`tools/shots.mjs` drives headless Chrome to capture the app in seeded states
(mid-climb, far side, summit) — useful for checking visuals without logging
thirty real days.

## Attributions

Margorn, the mountain, the thirty steps and the ring are drawings by Marianne
Miettinen, polished with AI.

Background photograph by [Scott Webb](https://unsplash.com/@scottwebb?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
on [Unsplash](https://unsplash.com/photos/a-black-and-white-photo-of-a-marble-surface-UjupleczBOY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).
