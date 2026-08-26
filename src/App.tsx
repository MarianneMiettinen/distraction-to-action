import { useEffect, useState, type ReactNode } from "react";
import { About } from "./screens/About";
import { Home, type Climb } from "./screens/Home";
import { Log } from "./screens/Log";
import {
  AskDistraction,
  AskGoal,
  AskPursuit,
  Intro,
  Reveal,
} from "./screens/Onboarding";
import { Path } from "./screens/Path";
import { Summit } from "./screens/Summit";
import { TOTAL_STEPS } from "./path";
import { addTime, currentStep, load, save, today, type Journey } from "./state";

type View =
  | "intro"
  | "reveal"
  | "q1"
  | "q2"
  | "q3"
  | "home"
  | "log"
  | "path"
  | "summit"
  | "about";

const PRELOAD = ["/art/mountain.jpg", "/art/mountain-lit.jpg", "/art/margorn.png"];

export default function App() {
  const [journey, setJourney] = useState<Journey>(load);
  const [view, setView] = useState<View>(() =>
    journey.onboarded ? "home" : "intro"
  );
  const [climb, setClimb] = useState<Climb | null>(null);

  useEffect(() => {
    PRELOAD.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  function update(next: Journey) {
    setJourney(next);
    save(next);
  }

  const step = currentStep(journey);

  function handleLog(focusMin: number, distractMin: number) {
    const before = currentStep(journey);
    const next = addTime(journey, focusMin, distractMin);
    const after = currentStep(next);

    // Coming back after a blank day is its own small event — no streak to break.
    const previous = [...journey.days]
      .filter((d) => d.date !== today())
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop();

    update(next);
    setClimb({
      from: before,
      to: after,
      focusAdded: focusMin,
      moved: after > before,
      returned: !!previous && previous.focusMin === 0 && focusMin > 0,
    });
    setView("home");
  }

  function endClimb() {
    const reached = climb?.to === TOTAL_STEPS && climb.moved;
    setClimb(null);
    if (reached && !journey.summitSeen) {
      update({ ...journey, summitSeen: true });
      setView("summit");
    }
  }

  let body: ReactNode;

  switch (view) {
    case "intro":
      body = <Intro onNext={() => setView("reveal")} />;
      break;

    case "reveal":
      body = <Reveal onNext={() => setView("q1")} onBack={() => setView("intro")} />;
      break;

    case "q1":
      body = (
        <AskDistraction
          value={journey.distraction}
          onChange={(v) => setJourney((j) => ({ ...j, distraction: v }))}
          onNext={() => setView("q2")}
          onBack={() => setView(journey.onboarded ? "path" : "reveal")}
        />
      );
      break;

    case "q2":
      body = (
        <AskPursuit
          value={journey.pursuit}
          onChange={(v) => setJourney((j) => ({ ...j, pursuit: v }))}
          onNext={() => setView("q3")}
          onBack={() => setView("q1")}
        />
      );
      break;

    case "q3":
      body = (
        <AskGoal
          value={journey.dailyGoalMin}
          onChange={(v) => setJourney((j) => ({ ...j, dailyGoalMin: v }))}
          onNext={() => {
            update({ ...journey, onboarded: true });
            setView("home");
          }}
          onBack={() => setView("q2")}
        />
      );
      break;

    case "log":
      body = (
        <Log journey={journey} onCancel={() => setView("home")} onSubmit={handleLog} />
      );
      break;

    case "path":
      body = (
        <Path
          journey={journey}
          step={step}
          onBack={() => setView("home")}
          onEdit={() => setView("q1")}
        />
      );
      break;

    case "summit":
      body = (
        <Summit
          journey={journey}
          onHome={() => setView("home")}
          onAgain={() => {
            update({ ...journey, days: [], summitSeen: false });
            setView("home");
          }}
        />
      );
      break;

    case "about":
      body = <About onBack={() => setView("home")} />;
      break;

    default:
      body = (
        <Home
          journey={journey}
          step={step}
          climb={climb}
          onClimbEnd={endClimb}
          onLog={() => setView("log")}
          onPath={() => setView("path")}
          onAbout={() => setView("about")}
        />
      );
  }

  return <div className="app">{body}</div>;
}
