import { expect, it, vi } from "vitest";
import { createSoundscape, soundSettings } from "../src/audio";
function runtime() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  const node = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: param(),
    frequency: param(),
    onended: null,
  });
  const c = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 100,
    destination: {},
    createBuffer: vi.fn(() => ({
      getChannelData: () => new Float32Array(400),
    })),
    createBufferSource: vi.fn(node),
    createGain: vi.fn(node),
    createBiquadFilter: vi.fn(node),
    createOscillator: vi.fn(node),
    resume: vi.fn(async () => {
      c.state = "running";
    }),
    suspend: vi.fn(async () => {
      c.state = "suspended";
    }),
    close: vi.fn(async () => {
      c.state = "closed";
    }),
  };
  const factory = vi.fn(() => c as unknown as AudioContext);
  return { c, factory, sound: createSoundscape(factory) };
}
const on = { enabled: true, ambience: 0.25, effects: 0.35 };
it("is silent and allocates no audio until enabled and unlocked by a gesture", async () => {
  const { sound, factory, c } = runtime();
  sound.cue("choice");
  expect(await sound.unlock()).toBe(false);
  sound.settings(on);
  expect(factory).not.toHaveBeenCalled();
  expect(await sound.unlock()).toBe(true);
  expect(c.createBufferSource).toHaveBeenCalledTimes(1);
  await sound.unlock();
  expect(c.createBufferSource).toHaveBeenCalledTimes(1);
  sound.cue("choice");
  expect(c.createOscillator).toHaveBeenCalledTimes(3);
  sound.dispose();
  expect(c.close).toHaveBeenCalledTimes(1);
});
it("suspends in background, resumes a single bed, and respects mute and zero effects", async () => {
  const { sound, c } = runtime();
  sound.settings(on);
  await sound.unlock();
  const bed = c.createBufferSource.mock.results[0]!.value;
  sound.hidden(true);
  sound.cue("choice");
  expect(bed.stop).toHaveBeenCalledTimes(1);
  expect(c.createOscillator).not.toHaveBeenCalled();
  expect(c.suspend).toHaveBeenCalled();
  sound.hidden(false);
  await Promise.resolve();
  expect(c.createBufferSource).toHaveBeenCalledTimes(2);
  sound.settings({ ...on, effects: 0 });
  sound.cue("choice");
  expect(c.createOscillator).not.toHaveBeenCalled();
  sound.settings({ ...on, enabled: false });
  sound.hidden(false);
  await Promise.resolve();
  expect(c.createBufferSource).toHaveBeenCalledTimes(2);
  sound.dispose();
});
it("does not restart audio if a pending unlock resolves after backgrounding or disposal", async () => {
  const { sound, c } = runtime();
  let finish!: () => void;
  c.resume.mockImplementation(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }),
  );
  sound.settings(on);
  const pending = sound.unlock();
  sound.hidden(true);
  sound.dispose();
  finish();
  await pending;
  expect(c.createBufferSource).not.toHaveBeenCalled();
});
it("degrades gracefully without Web Audio and sanitizes corrupt preferences", async () => {
  const sound = createSoundscape(() => {
    throw new Error("unsupported");
  });
  sound.settings(on);
  expect(await sound.unlock()).toBe(false);
  sound.cue("step");
  sound.dispose();
  expect(soundSettings("broken").enabled).toBe(false);
  expect(soundSettings('{"enabled":true,"ambience":3,"effects":-2}')).toEqual({
    enabled: true,
    ambience: 1,
    effects: 0,
  });
});
it("shares mute and disposal across combat accents", async () => {
  const { sound, c } = runtime();
  sound.settings(on);
  await sound.unlock();
  sound.cue("strike");
  sound.cue("guard");
  sound.cue("discern");
  expect(c.createOscillator).toHaveBeenCalledTimes(6);
  sound.settings({ ...on, enabled: false });
  for (const result of c.createOscillator.mock.results)
    expect(result.value.stop).toHaveBeenCalled();
  sound.cue("victory");
  expect(c.createOscillator).toHaveBeenCalledTimes(6);
  sound.dispose();
  sound.cue("hurt");
  expect(c.createOscillator).toHaveBeenCalledTimes(6);
});
