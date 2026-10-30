import { expect, it, vi } from "vitest";
import { createFileEffects } from "../src/file-effects";
import { actionSound } from "../src/action-sound";
import { createGame } from "../src/core";
import { readFileSync, existsSync } from "node:fs";
import { soundCues } from "../src/sound-cues";
function setup(deferred = false) {
  const audios: any[] = [],
    pending: (() => void)[] = [];
  const effects = createFileEffects((src) => {
    const audio = {
      src,
      volume: 0,
      muted: false,
      pause: vi.fn(),
      load: vi.fn(),
      removeAttribute: vi.fn(),
      onended: null,
      onerror: null,
      play: vi.fn(() =>
        deferred
          ? new Promise<void>((r) => pending.push(r))
          : Promise.resolve(),
      ),
    };
    audios.push(audio);
    return audio as unknown as HTMLAudioElement;
  });
  return { effects, audios, pending };
}
it("file effects require gesture, cap voices, honor mute and remove pending voices", async () => {
  const { effects, audios, pending } = setup(true);
  effects.cue("strike");
  effects.settings(true, 0.4);
  effects.cue("strike");
  expect(audios).toHaveLength(0);
  effects.unlock();
  for (let i = 0; i < 8; i++) effects.cue("strike");
  expect(audios).toHaveLength(8);
  expect(audios[0].pause).toHaveBeenCalled();
  effects.hidden(true);
  pending.forEach((r) => r());
  await Promise.resolve();
  for (const a of audios) {
    expect(a.pause).toHaveBeenCalled();
    expect(a.muted).toBe(true);
  }
  effects.cue("upgrade");
  expect(audios).toHaveLength(8);
  effects.hidden(false);
  effects.settings(true, 0);
  effects.cue("upgrade");
  expect(audios).toHaveLength(8);
  effects.settings(true, 0.2);
  effects.cue("upgrade");
  expect(audios.at(-1).volume).toBe(0.2);
  effects.dispose();
  effects.cue("promotion");
  expect(audios).toHaveLength(9);
});
it("missing effect releases its voice without affecting gameplay", async () => {
  const { effects, audios } = setup();
  effects.settings(true, 0.4);
  effects.unlock();
  effects.cue("medicine");
  audios[0].onerror();
  await Promise.resolve();
  expect(audios[0].removeAttribute).toHaveBeenCalledWith("src");
  effects.cue("step");
  audios[1].onended();
  expect(audios[1].pause).toHaveBeenCalled();
  effects.dispose();
});
it("growth and arena cues depend on actual state transitions", () => {
  const before = createGame("声音测试", "wood", 42),
    after = structuredClone(before);
  after.realm = 1;
  expect(
    actionSound(before, after, {
      type: "advance",
      activity: "cultivate",
      months: 1,
    }),
  ).toBe("breakthrough");
  after.realm = 0;
  after.journey.rank = 1;
  expect(actionSound(before, after, { type: "promote" })).toBe("promotion");
  after.journey.relics.vial = 2;
  expect(actionSound(before, after, { type: "forge", relic: "vial" })).toBe(
    "upgrade",
  );
  expect(actionSound(before, before, { type: "forge", relic: "vial" })).toBe(
    "step",
  );
  expect(
    actionSound(before, after, { type: "arenaTurn", stance: "break" }),
  ).toBe("strike");
  after.social.arena.wins = 1;
  expect(
    actionSound(before, after, { type: "arenaTurn", stance: "break" }),
  ).toBe("victory");
  after.social.arena.wins = 0;
  after.social.arena.losses = 1;
  expect(
    actionSound(before, after, { type: "arenaTurn", stance: "endure" }),
  ).toBe("hurt");
});
it("every cue ships as a finite stereo PCM file with headroom", () => {
  for (const name of [
    ...Object.keys(soundCues),
    "home",
    "trial",
    "journey",
    "vista",
    "mystery",
  ]) {
    const path = `public/audio/original-v1/${name}.wav`;
    expect(existsSync(path)).toBe(true);
    const data = readFileSync(path);
    expect(data.toString("ascii", 0, 4)).toBe("RIFF");
    expect(data.readUInt16LE(22)).toBe(2);
    expect(data.readUInt32LE(24)).toBe(44100);
    let peak = 0;
    for (let i = 44; i < data.length; i += 2)
      peak = Math.max(peak, Math.abs(data.readInt16LE(i)));
    expect(peak).toBeGreaterThan(100);
    expect(peak).toBeLessThan(24000);
  }
});

it("routine actions have quiet, distinct cues without changing domain state", () => {
  const s = createGame("日常声音", "wood", 42),
    n = structuredClone(s);
  n.month++;
  for (const activity of [
    "gather",
    "cultivate",
    "meditate",
    "study",
    "rest",
  ] as const) {
    expect(actionSound(s, n, { type: "advance", activity, months: 1 })).toBe(
      activity,
    );
  }
  expect(s.month).toBe(0);
});
