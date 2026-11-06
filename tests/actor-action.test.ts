import { describe, expect, it, vi } from "vitest";
import {
  createActorMotion,
  type ActorMotion,
} from "../src/presentation/actor-action/motion";
import { createPlayback } from "../src/presentation/actor-action/playback";
import { actorAppearance } from "../src/presentation/art";

function motion() {
  const frames: ActorMotion[] = [];
  const actor = createActorMotion({
    initial: { x: 80, y: 80 },
    duration: (a, b) => Math.hypot(b.x - a.x, b.y - a.y) * 10,
    show: (s) => frames.push(s),
  });
  return { actor, frames };
}
describe("one movement contract for DOM and canvas", () => {
  it.each(["animated", "skipped", "instant"] as const)(
    "arrives facing the person, independently of travel direction: %s",
    (mode) => {
      const { actor } = motion();
      const done = vi.fn();
      actor.approach(
        {
          path: [
            { x: 60, y: 80 },
            { x: 40, y: 80 },
            { x: 40, y: 90 },
          ],
          faceX: 50,
          instant: mode === "instant",
        },
        done,
      );
      if (mode === "animated") {
        actor.advance(100);
        expect(actor.snapshot.facing).toBe(-1);
        actor.advance(1000);
      }
      if (mode === "skipped") actor.skip();
      expect(actor.snapshot).toEqual({
        position: { x: 40, y: 90 },
        facing: 1,
        moving: false,
        frame: 0,
      });
      actor.skip();
      actor.advance(1000);
      expect(done).toHaveBeenCalledOnce();
    },
  );
  it("uses every waypoint, retains facing on vertical legs and does not mutate route input", () => {
    const { actor } = motion();
    const path = [
      { x: 60, y: 80 },
      { x: 60, y: 90 },
      { x: 40, y: 90 },
    ];
    const before = structuredClone(path);
    actor.approach({ path });
    actor.advance(250);
    expect(actor.snapshot.position).toEqual({ x: 60, y: 85 });
    expect(actor.snapshot.facing).toBe(-1);
    actor.advance(250);
    expect(actor.snapshot.position).toEqual({ x: 40, y: 90 });
    expect(path).toEqual(before);
  });
  it("replacement, cancel, reset and disposal cannot complete stale actions", () => {
    const { actor } = motion();
    const old = vi.fn(),
      latest = vi.fn();
    actor.approach({ path: [{ x: 10, y: 80 }] }, old);
    actor.advance(50);
    actor.approach({ path: [{ x: 90, y: 80 }] }, latest);
    actor.skip();
    expect(old).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
    for (const action of ["cancel", "reset", "dispose"] as const) {
      actor.approach({ path: [{ x: 20, y: 80 }] }, old);
      if (action === "reset") actor.reset({ x: 30, y: 80 });
      else actor[action]();
      actor.skip();
      actor.advance(10000);
    }
    actor.approach({ path: [{ x: 10, y: 10 }], instant: true }, old);
    expect(old).not.toHaveBeenCalled();
  });
  it("rejects invalid targets and isolates caller mutation of snapshots", () => {
    const { actor } = motion();
    const before = actor.snapshot;
    actor.approach({ path: [{ x: NaN, y: 0 }] });
    actor.advance(Infinity);
    expect(actor.snapshot).toEqual(before);
    before.position.x = 500;
    expect(actor.snapshot.position.x).toBe(80);
  });
  it("arrival callbacks may start the next movement without it being lost", () => {
    const { actor } = motion();
    const done = vi.fn();
    actor.approach({ path: [{ x: 70, y: 80 }] }, () =>
      actor.approach({ path: [{ x: 90, y: 80 }], faceX: 80 }, done),
    );
    actor.advance(100);
    expect(actor.snapshot.moving).toBe(true);
    actor.advance(200);
    expect(done).toHaveBeenCalledOnce();
    expect(actor.snapshot.facing).toBe(-1);
  });
  it("uses the same pose direction projection for DOM and Phaser textures", () => {
    expect(actorAppearance("hero-male-qi", "idle", 1).flipX).toBe(true);
    expect(actorAppearance("hero-male-qi", "attack", 1).flipX).toBe(false);
    expect(actorAppearance("hero-male-qi", "hurt", 1).flipX).toBe(false);
    expect(actorAppearance("hero-male-qi", "idle", -1, true).flipX).toBe(true);
    expect(actorAppearance("hero-male-qi", "idle", 1, true).flipX).toBe(false);
  });
});

function playback(reduced = () => false) {
  const timers = new Map<number, () => void>();
  let id = 0;
  const show = vi.fn(),
    end = vi.fn();
  const player = createPlayback<string, number>({
    schedule: (_ms, cb) => {
      timers.set(++id, cb);
      return id;
    },
    cancel: (key) => {
      timers.delete(key);
    },
    reduced,
    show,
    end,
  });
  const tick = () => {
    const jobs = [...timers.values()];
    timers.clear();
    jobs.forEach((cb) => cb());
  };
  return { player, timers, show, end, tick };
}
describe("shared cancellable playback", () => {
  const frames = [
    { value: "approach", durationMs: 100 },
    { value: "strike", durationMs: 100 },
  ];
  it("plays once, restores on completion, and ignores an already queued stale callback", () => {
    const { player, timers, show, end, tick } = playback();
    player.play(frames);
    const stale = [...timers.values()][0]!;
    player.play([{ value: "guard", durationMs: 100 }]);
    stale();
    expect(show.mock.calls.map((c) => c[0])).toEqual(["approach", "guard"]);
    tick();
    expect(end.mock.calls.map((c) => c[0])).toEqual(["replaced", "completed"]);
  });
  it.each(["stop", "dispose"] as const)(
    "can %s from inside a frame without leaving a timer",
    (operation) => {
      const { player, timers, show, end } = playback();
      show.mockImplementation(() => player[operation]());
      player.play(frames);
      expect(timers.size).toBe(0);
      expect(end).toHaveBeenCalledOnce();
    },
  );
  it("reduced motion resolves to the settled appearance without showing frames", () => {
    const { player, show, end, timers } = playback(() => true);
    player.play(frames);
    expect(show).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledWith("reduced");
    expect(timers.size).toBe(0);
  });
  it("replacement end callback can dispose safely", () => {
    const { player, show, end, timers } = playback();
    player.play(frames);
    end.mockImplementation(() => player.dispose());
    player.play(frames);
    expect(show).toHaveBeenCalledOnce();
    expect(timers.size).toBe(0);
  });
});

it('an adapter disposed during its final render cannot open the old interaction', () => {
  const done = vi.fn();
  let dispose = () => {};
  const actor = createActorMotion({initial:{x:0,y:0},duration:()=>100,show:s=>{if(!s.moving)dispose();}});
  dispose = actor.dispose;
  actor.approach({path:[{x:10,y:0}]},done);actor.advance(100);
  expect(done).not.toHaveBeenCalled();
});
