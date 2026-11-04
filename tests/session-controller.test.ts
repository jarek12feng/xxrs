import { afterEach, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createGame } from "../src/core";
import { useGameSession } from "../src/session/use-game-session";
import { startAutomaticClock } from "../src/session/automatic-clock";
afterEach(() => vi.useRealTimers());
it("publishes state only after persistence and does not overlap writes", async () => {
  const busy = ref(false),
    accepted = vi.fn(),
    stop = vi.fn();
  let complete!: () => void;
  const save = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  const session = useGameSession(busy, stop, accepted, {
    load: async () => ({ state: null, recovered: false }),
    save,
  });
  const state = createGame("保存", "wood", 42),
    pending = session.persist(state);
  expect(session.game.value).toBeNull();
  expect(busy.value).toBe(true);
  expect(await session.persist(state)).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
  complete();
  expect(await pending).toBe(true);
  expect(session.game.value).toBe(state);
  expect(accepted).toHaveBeenCalledTimes(1);
});
it("failed writes keep the loaded state and stop automatic play", async () => {
  const old = createGame("原档", "wood", 42),
    stop = vi.fn(),
    accepted = vi.fn();
  const session = useGameSession(ref(false), stop, accepted, {
    load: async () => ({ state: old, recovered: true }),
    save: async () => {
      throw Error("disk");
    },
  });
  await session.restore();
  expect(session.saved.value).toContain("恢复");
  expect(await session.persist({ ...old, stones: 99 })).toBe(false);
  expect(session.game.value).toBe(old);
  expect(stop).toHaveBeenCalledOnce();
  expect(accepted).not.toHaveBeenCalled();
});
it("unknown saves remain blocked and never cause an automatic write", async () => {
  const save = vi.fn();
  const session = useGameSession(ref(false), vi.fn(), vi.fn(), {
    load: async () => {
      throw Error("较新版本");
    },
    save,
  });
  await session.restore();
  expect(session.loadError.value).toBe(true);
  expect(session.ready.value).toBe(true);
  expect(save).not.toHaveBeenCalled();
});
it("automatic clock respects visibility/busy gates, awaits a step and cleans up", async () => {
  vi.useFakeTimers();
  let eligible = false;
  let complete!: () => void;
  const step = vi.fn(
    () =>
      new Promise<void>((r) => {
        complete = r;
      }),
  );
  const stop = startAutomaticClock(() => eligible, step, vi.fn());
  await vi.advanceTimersByTimeAsync(800);
  expect(step).not.toHaveBeenCalled();
  eligible = true;
  await vi.advanceTimersByTimeAsync(2400);
  expect(step).toHaveBeenCalledTimes(1);
  complete();
  await Promise.resolve();
  stop();
  await vi.advanceTimersByTimeAsync(2400);
  expect(step).toHaveBeenCalledTimes(1);
});
it("a failed automatic step stops the clock and reports the failure", async () => {
  vi.useFakeTimers();
  const failed = vi.fn(),
    step = vi.fn(async () => {
      throw Error("dispatch");
    });
  const stop = startAutomaticClock(() => true, step, failed);
  await vi.advanceTimersByTimeAsync(2400);
  expect(step).toHaveBeenCalledOnce();
  expect(failed).toHaveBeenCalledOnce();
  stop();
});
