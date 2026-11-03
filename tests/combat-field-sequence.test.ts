import { expect, it } from "vitest";
import {
  combatExchange,
  createCombatSequence,
  type CombatBeat,
  type CombatSnapshot,
} from "../src/scene2d/combat/sequence";
const initial: CombatSnapshot = {
  id: "badger",
  turn: 0,
  player: 100,
  enemy: 76,
  enemyName: "赤背岩獾",
  effect: "none",
};
const next: CombatSnapshot = {
  ...initial,
  turn: 1,
  player: 94,
  enemy: 60,
  effect: "strike",
};
function setup(reduced = false) {
  let count = 0;
  const queue = new Map<number, () => void>(),
    shown: (CombatBeat | null)[] = [];
  const player = createCombatSequence({
    initial,
    schedule: (_ms, cb) => {
      queue.set(++count, cb);
      return count;
    },
    cancel: (id) => {
      queue.delete(id);
    },
    reduced: () => reduced,
    show: (beat) => shown.push(beat),
  });
  function tick() {
    const entry = queue.entries().next().value;
    if (entry) {
      queue.delete(entry[0]);
      entry[1]();
    }
  }
  return { player, shown, queue, tick };
}
it("only the next saved turn in the same fight produces a hit with actual net losses", () => {
  expect(combatExchange(initial, initial)).toBeNull();
  expect(combatExchange(initial, null)).toBeNull();
  expect(combatExchange(null, next)).toBeNull();
  expect(combatExchange(initial, { ...next, id: "other" })).toBeNull();
  expect(combatExchange(initial, { ...next, turn: 3 })).toBeNull();
  expect(combatExchange(initial, next)).toMatchObject({
    playerLost: 6,
    enemyLost: 16,
  });
  expect(combatExchange(initial, { ...next, player: 105 })).toMatchObject({
    playerLost: 0,
  });
});
it("plays approach, strike, impact and return, without replaying duplicate state", () => {
  const x = setup();
  expect(x.shown).toEqual([]);
  x.player.sync(next);
  x.player.sync({ ...next });
  expect(x.shown.at(-1)?.phase).toBe("approach");
  x.tick();
  x.tick();
  x.tick();
  x.tick();
  expect(x.shown.filter(Boolean).map((b) => b!.phase)).toEqual([
    "approach",
    "strike",
    "impact",
    "return",
  ]);
  expect(x.shown.at(-1)).toBeNull();
  expect(x.queue.size).toBe(0);
  x.player.sync(next);
  expect(x.queue.size).toBe(0);
});
it("skip and late callbacks cannot alter a replacement animation", () => {
  const x = setup();
  x.player.sync(next);
  const late = [...x.queue.values()][0]!;
  x.player.stop();
  x.player.sync({ ...next, turn: 2, enemy: 40 });
  const count = x.shown.length;
  late();
  expect(x.shown.length).toBe(count);
  expect(x.queue.size).toBe(1);
  x.player.stop();
  expect(x.queue.size).toBe(0);
});
it("ending battle, switching enemies, reducing motion and disposal leave no timers", () => {
  const x = setup();
  x.player.sync(next);
  x.player.sync(null);
  expect(x.queue.size).toBe(0);
  x.player.sync(initial);
  expect(x.queue.size).toBe(0);
  x.player.sync(next);
  x.player.sync({ ...next, id: "other" });
  expect(x.queue.size).toBe(0);
  x.player.sync({ ...next, id: "other", turn: 2 });
  x.player.dispose();
  x.player.sync({ ...next, id: "other", turn: 3 });
  expect(x.queue.size).toBe(0);
  const reduced = setup(true);
  reduced.player.sync(next);
  expect(reduced.queue.size).toBe(0);
  expect(reduced.shown.filter(Boolean)).toEqual([]);
});
it("synchronous stop inside show leaves no scheduled callback", () => {
  let timers = 0;
  let stop = () => {};
  const player = createCombatSequence({
    initial,
    schedule: () => ++timers,
    cancel: () => {},
    reduced: () => false,
    show: (beat) => {
      if (beat) stop();
    },
  });
  stop = player.stop;
  player.sync(next);
  expect(timers).toBe(0);
});
