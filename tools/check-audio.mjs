/**
 * Dev-only: confirms every clip the app references actually loads and plays.
 * Runs the check with a user gesture, since autoplay is otherwise blocked.
 *
 *   node tools/check-audio.mjs
 */
import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const profile = join(tmpdir(), `d2a-audio-${Date.now()}`);

const src = readFileSync(new URL("../src/audio.ts", import.meta.url), "utf8");
const paths = [...src.matchAll(/"(\/(?:sounds|music)\/[^"]+)"/g)].map((m) => m[1]);

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    /* not up yet */
  }
  if (!wsUrl) await sleep(200);
}

const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? {});
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send("Page.navigate", { url: "http://localhost:5183" });
await sleep(1200);

// Decode each clip and find where the audible part actually starts and ends —
// several of these files carry long silent tails that would otherwise overlap.
const { result } = await send("Runtime.evaluate", {
  expression: `(async () => {
    const paths = ${JSON.stringify(paths)};
    const ctx = new OfflineAudioContext(1, 1024, 44100);
    const out = [];
    for (const p of paths) {
      try {
        const buf = await ctx.decodeAudioData(await (await fetch(p)).arrayBuffer());
        const data = buf.getChannelData(0);
        const win = Math.round(buf.sampleRate * 0.02);
        let peak = 0;
        const rms = [];
        for (let i = 0; i < data.length; i += win) {
          let s = 0;
          for (let j = i; j < Math.min(i + win, data.length); j++) s += data[j] * data[j];
          const v = Math.sqrt(s / win);
          rms.push(v);
          if (v > peak) peak = v;
        }
        const gate = peak * 0.04;
        let first = rms.findIndex(v => v > gate);
        let last = rms.length - 1;
        while (last > 0 && rms[last] <= gate) last--;
        out.push({
          p, ok: true,
          dur: +buf.duration.toFixed(2),
          start: +(first * 0.02).toFixed(2),
          end: +(last * 0.02).toFixed(2),
        });
      } catch (e) {
        out.push({ p, ok: false, err: String(e).slice(0, 80) });
      }
    }
    return JSON.stringify(out);
  })()`,
  awaitPromise: true,
  userGesture: true,
  returnByValue: true,
});

let failed = 0;
for (const r of JSON.parse(result.value)) {
  if (!r.ok) failed++;
  const span = r.ok ? `${r.dur}s  audible ${r.start}–${r.end}s` : r.err;
  console.log(`${r.ok ? "ok  " : "FAIL"}  ${r.p.split("/").pop().padEnd(62)} ${span}`);
}
console.log(failed ? `${failed} clip(s) failed` : "all clips decode");

ws.close();
chrome.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* windows holds the profile briefly */
}
process.exit(failed ? 1 : 0);
