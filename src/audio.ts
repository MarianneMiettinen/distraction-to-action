/**
 * Sound, kept deliberately small: one ambient loop and a handful of one-shots.
 *
 * The note button turns the *music* on and off. Effects are feedback — a step
 * landing, a hand on stone — so they keep playing either way; silencing them
 * along with the soundtrack would take the response out of the interface.
 *
 * The music file is several megabytes, so it is only fetched once it is wanted,
 * and browsers block autoplay before a gesture anyway.
 */

const SFX = {
  tap: "/sounds/home-button.mp3",
  back: "/sounds/metalcrow-metal-blade-on-stone-scratch-113504.mp3",
  walk: "/sounds/blendertimer-person-walking-on-gravel-loop-528372.mp3",
  step: "/sounds/dragon-studio-elemental-spell-impact-light-478379-GREEN-STEP.mp3",
  noStep: "/sounds/freesound_community-fire-breath-6922-RED-STEP.mp3",
  returned: "/sounds/universfield-spell-casting-229208-BLUE-STEP.mp3",
  turn: "/sounds/freesound_community-stoneblockdragwoodgrind-82327.mp3",
  ring: "/sounds/dragon-studio-elemental-magic-spell-impact-393917-RING-FALLS1.mp3",
  flare: "/sounds/rescopicsound-elemental-magic-spell-impact-outgoing-228342.mp3",
} as const;

export type Sfx = keyof typeof SFX;

const VOLUME: Partial<Record<Sfx, number>> = {
  tap: 0.35,
  back: 0.3,
  walk: 0.45,
  step: 0.5,
  noStep: 0.3,
  returned: 0.45,
  turn: 0.4,
  ring: 0.6,
  flare: 0.45,
};

/**
 * Several clips open with silence — the fire breath sits on 1.4s of nothing.
 * Starting past it keeps the sound on the same beat as what you just did.
 * (Measured with `node tools/check-audio.mjs`.)
 */
const START: Partial<Record<Sfx, number>> = {
  tap: 0.22,
  back: 0.18,
  noStep: 1.3,
  returned: 0.08,
  turn: 0.08,
};

// The other track in /music (luis_humanoide, Middle-Earth inspired) is the
// alternative — swap this line to use it.
const MUSIC = "/music/grand_project-wonders-of-the-earth-550792.mp3";
const KEY = "distraction-to-action.sound";

let musicOn = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();

const clips = new Map<Sfx, HTMLAudioElement>();
let music: HTMLAudioElement | null = null;
const listeners = new Set<(on: boolean) => void>();

function clip(name: Sfx) {
  let el = clips.get(name);
  if (!el) {
    el = new Audio(SFX[name]);
    el.volume = VOLUME[name] ?? 0.4;
    clips.set(name, el);
  }
  return el;
}

export function play(name: Sfx) {
  const el = clip(name);
  const from = START[name] ?? 0;
  try {
    el.currentTime = from;
  } catch {
    /* not seekable yet; it will start from the top this once */
  }
  void el.play().catch(() => {
    /* no gesture yet, or the file is still loading */
  });
}

export function loop(name: Sfx) {
  const el = clip(name);
  el.loop = true;
  void el.play().catch(() => {});
}

export function stop(name: Sfx) {
  const el = clips.get(name);
  if (!el) return;
  el.pause();
  try {
    el.currentTime = START[name] ?? 0;
  } catch {
    /* ignore */
  }
}

function startMusic() {
  if (!music) {
    music = new Audio(MUSIC);
    music.loop = true;
    // Sits under the effects rather than competing with them.
    music.volume = 0.12;
  }
  void music.play().catch(() => {});
}

export function musicPlaying() {
  return musicOn;
}

export function toggleMusic() {
  musicOn = !musicOn;
  try {
    localStorage.setItem(KEY, musicOn ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (musicOn) startMusic();
  else music?.pause();
  play("tap");
  listeners.forEach((fn) => fn(musicOn));
  return musicOn;
}

/** Browsers need a gesture before any of this is allowed to make a noise. */
export function wakeAudio() {
  if (musicOn) startMusic();
}

export function onMusicChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
