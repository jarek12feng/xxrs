import { afterEach, expect, it, vi } from "vitest";
import { createMusicPlayer, sceneMusic } from "../src/local-music";
afterEach(() => vi.useRealTimers());
function setup(deferred = false) {
  vi.useFakeTimers();
  const pending: (() => void)[] = [];
  const audios: HTMLAudioElement[] = [];
  const report = vi.fn();
  const player = createMusicPlayer((url) => {
    const audio = {
      src: url,
      volume: 1,
      loop: false,
      preload: "",
      onerror: null,
      play: vi.fn(() =>
        deferred
          ? new Promise<void>((r) => pending.push(r))
          : Promise.resolve(),
      ),
      pause: vi.fn(),
      removeAttribute: vi.fn(),
      load: vi.fn(),
    } as unknown as HTMLAudioElement;
    audios.push(audio);
    return audio;
  }, report);
  return { player, audios, pending, report };
}
it("requires an enabled gesture, loops, fades in, ducks dialogue and restores volume", async () => {
  const { player, audios } = setup();
  player.scene("mystery");
  player.unlock();
  expect(audios).toHaveLength(0);
  player.settings(true, 0.5);
  expect(audios).toHaveLength(0);
  player.unlock();
  await Promise.resolve();
  expect(audios[0].loop).toBe(true);
  expect(audios[0].volume).toBe(0);
  await vi.advanceTimersByTimeAsync(4000);
  expect(audios[0].volume).toBeCloseTo(0.5, 2);
  player.duck(true);
  await vi.advanceTimersByTimeAsync(2000);
  expect(audios[0].volume).toBeCloseTo(0.15, 2);
  player.duck(false);
  await vi.advanceTimersByTimeAsync(4000);
  expect(audios[0].volume).toBeCloseTo(0.5, 2);
  player.dispose();
  expect(audios[0].pause).toHaveBeenCalled();
});
it("crossfades only once the new track can play and does not restart on repeated scene updates", async () => {
  const { player, audios, pending } = setup(true);
  player.settings(true, 0.5);
  player.unlock();
  pending.shift()!();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(4000);
  player.scene("trial");
  player.scene("trial");
  expect(audios).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(3000);
  expect(audios[0].volume).toBeCloseTo(0.5, 2);
  pending.shift()!();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(6000);
  expect(audios[0].pause).toHaveBeenCalled();
  expect(audios[1].volume).toBeCloseTo(0.5, 2);
  player.dispose();
});
it("prevents late playback after mute, background and disposal; missing audio is recoverable", async () => {
  const { player, audios, pending, report } = setup(true);
  player.settings(true, 0.5);
  player.unlock();
  player.hidden(true);
  pending.shift()!();
  await Promise.resolve();
  expect(audios[0].pause).toHaveBeenCalled();
  player.hidden(false);
  expect(audios).toHaveLength(1);
  expect(audios[0].play).toHaveBeenCalledTimes(2);
  audios[0].onerror!(new Event("error"));
  expect(report).toHaveBeenCalledWith(expect.stringContaining("暂不能播放"));
  player.unlock();
  expect(audios).toHaveLength(2);
  player.settings(false, 0.5);
  player.dispose();
  pending.forEach((r) => r());
  await Promise.resolve();
  player.unlock();
  expect(audios).toHaveLength(2);
  expect(audios[1].pause).toHaveBeenCalled();
});
it("maps story beats and distinguishes returning to the shrine from the initial danger", () => {
  expect(sceneMusic("雨夜渡口")).toBe("mystery");
  expect(sceneMusic("山下坊市")).toBe("home");
  expect(sceneMusic("废弃山祠")).toBe("trial");
  expect(sceneMusic("再见那座山祠")).toBe("mystery");
  expect(sceneMusic("山口行营")).toBe("journey");
  expect(sceneMusic("云外长路")).toBe("vista");
});
it("hard mutes every fading voice immediately rather than relying on pause alone", async () => {
  const { player, audios } = setup();
  player.settings(true, 0.5);
  player.unlock();
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(2500);
  player.scene("trial");
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(300);
  player.settings(false, 0.5);
  expect(audios).toHaveLength(2);
  for (const audio of audios) {
    expect(audio.volume).toBe(0);
    expect(audio.muted).toBe(true);
    expect(audio.pause).toHaveBeenCalled();
  }
  player.dispose();
});
it("bounds rapid switches to two live tracks and releases zero-volume audio", async () => {
  const { player, audios } = setup(true);
  player.settings(true, 0.5);
  player.unlock();
  for (const cue of [
    "foundation",
    "survey",
    "lamps",
    "sunken",
    "frontier",
    "parting",
    "return",
  ] as const)
    player.scene(cue);
  expect(
    audios.filter(
      (a) => !(a.load as ReturnType<typeof vi.fn>).mock.calls.length,
    ),
  ).toHaveLength(2);
  expect(audios.at(-1)!.src).toContain("foundation-v2/return.wav");
  player.settings(true, 0);
  expect(
    audios.every(
      (a) => (a.load as ReturnType<typeof vi.fn>).mock.calls.length > 0,
    ),
  ).toBe(true);
  player.dispose();
});
