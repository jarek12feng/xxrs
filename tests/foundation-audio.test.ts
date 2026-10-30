import { expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import {
  foundationMusic,
  foundationEffects,
  foundationAmbience,
  audioUrl,
} from "../src/foundation-audio";
import { foundationAudioScene } from "../src/audio-scene";
import { actionSound } from "../src/action-sound";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { dispatch, type Intent } from "../src/core";
it("registers every delivered asset with a real file, reserving memorial for a future confirmed event", () => {
  const manifest = JSON.parse(
    readFileSync("docs/audio-candidates/20261030/manifest.json", "utf8"),
  );
  const cues = [
    ...Object.keys(foundationMusic),
    ...foundationEffects,
    ...foundationAmbience,
  ];
  expect(cues.sort()).toEqual(
    manifest.assets.map((a: { id: string }) => a.id).sort(),
  );
  for (const cue of cues)
    expect(existsSync(`public${audioUrl(cue)}`)).toBe(true);
  expect(readFileSync("src/action-sound.ts", "utf8")).not.toContain(
    'return "memorial"',
  );
});
it("routes visible foundation places and actual battles without leaking a hidden location", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  expect(foundationAudioScene(p.state, "world")).toEqual({
    music: "sunken",
    ambient: "waterside",
  });
  expect(foundationAudioScene(p.state, "")?.music).toBe("foundation");
  p.act({ kind: "battle", battle: "well" });
  expect(foundationAudioScene(p.state, "world")?.music).toBe("frontier");
});
it("emits unique event cues only for new outcomes through public commands, never on reload", () => {
  const p = journeyPlayer(journeyCheckpoint());
  const travel: Intent = {
    type: "foundationJourney",
    action: { kind: "travel", destination: "ferry" },
  };
  const before = p.state;
  p.send(travel);
  expect(actionSound(before, p.state, travel)).toBe("boat-step");
  p.fight("well");
  const pre = p.state;
  const inherit: Intent = {
    type: "foundationJourney",
    action: { kind: "inherit", technique: "spring" },
  };
  p.send(inherit);
  expect(actionSound(pre, p.state, inherit)).toBe("inheritance");
  expect(actionSound(p.state, p.state, inherit)).toBe("step");
  const ready = journeyCheckpoint();
  const start = dispatch(ready, {
    type: "companionship",
    action: "start",
    id: "sound-start",
  });
  const prepared = dispatch(start, {
    type: "companionship",
    action: "insight",
    id: "sound-prep",
  });
  expect(
    actionSound(start, prepared, { type: "companionship", action: "insight" }),
  ).toBe("ward-learn");
});
it("invites the earned inheritance into a real cross-stage exit trial without a cultivation gate", async () => {
  const { foundationGoal } =
    await import("../src/foundation-journey/progression");
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  expect(p.state.foundationJourney.cultivation).toBeLessThan(200);
  expect(foundationGoal(p.state)).toContain("越阶胜利");
  p.act({ kind: "battle", battle: "exit" });
  expect(p.state.foundationJourney.duel?.id).toBe("exit");
});
