/**
 * Dev-only: drives headless Chrome over the DevTools protocol to capture the
 * app in real states (seeded localStorage, mid-climb, summit) so the visuals
 * can be checked without clicking through thirty days by hand.
 *
 *   node tools/shots.mjs [outDir] [--w 390] [--h 844]
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL_BASE = "http://localhost:5183";
const PORT = 9333;

const args = process.argv.slice(2);
const outDir = args[0] && !args[0].startsWith("--") ? args[0] : "./shots";
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const W = flag("w", 390);
const H = flag("h", 844);

mkdirSync(outDir, { recursive: true });
const profile = join(tmpdir(), `d2a-shots-${Date.now()}`);

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error("Chrome never came up");
}

const wsUrl = await connect();
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? {});
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const evaluate = (expression) =>
  send("Runtime.evaluate", { expression, awaitPromise: true });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: W,
  height: H,
  deviceScaleFactor: 2,
  mobile: W < 700,
});

async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(data, "base64"));
  console.log("→", name);
}

/** Builds a journey with `n` logged days, most recent today (or yesterday). */
const seed = (n, { skipToday = false, ...extra } = {}) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i - (skipToday ? 1 : 0));
    const iso = d.toISOString().slice(0, 10);
    // starts distracted, gets better — so the ratio has something to say
    const t = (n - 1 - i) / Math.max(n - 1, 1);
    days.push({
      date: iso,
      focusMin: Math.round(20 + t * 130),
      distractMin: Math.round(200 - t * 150),
    });
  }
  return JSON.stringify({
    distraction: "scrolling my phone",
    pursuit: "job applications",
    dailyGoalMin: 30,
    days,
    onboarded: true,
    summitSeen: false,
    ...extra,
  });
};

async function go(path = "/", state = null) {
  await send("Page.navigate", { url: URL_BASE + path });
  await sleep(500);
  if (state) {
    await evaluate(
      `localStorage.setItem('distraction-to-action.v1', ${JSON.stringify(state)})`
    );
    await send("Page.navigate", { url: URL_BASE + path });
  } else {
    await evaluate(`localStorage.clear()`);
    await send("Page.navigate", { url: URL_BASE + path });
  }
  await sleep(1400);
}

const click = async (selector, wait = 900) => {
  await evaluate(
    `document.querySelector(${JSON.stringify(selector)})?.click()`
  );
  await sleep(wait);
};

const clickText = async (text, wait = 900) => {
  await evaluate(
    `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(
      text
    )})?.click()`
  );
  await sleep(wait);
};

// ── onboarding ──────────────────────────────────────────────────────────────
await go("/");
await shot("01-intro");
await clickText("Begin");
await shot("02-reveal");
await clickText("Continue");
await evaluate(
  `(() => { const t = document.querySelector('textarea');
     const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
     set.call(t, 'scrolling my phone');
     t.dispatchEvent(new Event('input', { bubbles: true })); })()`
);
await sleep(400);
await shot("03-question");
await clickText("Continue");
await sleep(500);
await shot("04-goal-skipped");

// ── the climb ───────────────────────────────────────────────────────────────
await go("/", seed(1));
await shot("05-home-day1");

await go("/", seed(6));
await shot("06-home-step7");

await go("/", seed(15));
await shot("07-home-step16");

await go("/", seed(13));
await shot("08-home-step14-backface");

await go("/", seed(26));
await shot("09-home-step27");

// logging → the walk
await go("/", seed(6, { skipToday: true }));
await click(".btn", 700);
await shot("10-log");
await evaluate(
  `[...document.querySelectorAll('.chip')].find(c => c.textContent.includes('1 h'))?.click()`
);
await sleep(400);
await shot("11-log-filled");
await click(".btn", 700);
await shot("12-climbing");
await sleep(1600);
await shot("13-climb-settled");

// ── path + summit + about ───────────────────────────────────────────────────
await go("/", seed(9));
await clickText("See the whole climb", 900);
await shot("14-path");

await go("/", seed(9));
await clickText("Attributions", 700);
await shot("15-about");

await go("/", seed(28, { skipToday: true }));
await click(".btn", 700);
await evaluate(
  `[...document.querySelectorAll('.chip')].find(c => c.textContent.includes('1 h'))?.click()`
);
await sleep(300);
await click(".btn", 4400);
await shot("16-summit-hold");
await sleep(2600);
await shot("17-summit-fall");
await sleep(2600);
await shot("18-summit-done");

ws.close();
chrome.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* windows sometimes holds the profile briefly */
}
console.log("done →", outDir);
