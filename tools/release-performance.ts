import "fake-indexeddb/auto";
import { createGame, dispatch, validState } from "../src/core";
import { save, load } from "../src/save";
import { conclavePlayer } from "./conclave-checkpoint";
import { performance } from "node:perf_hooks";

const p = conclavePlayer();
p.arrive();
p.work(12);
p.herbs(20);
p.act({ kind: "training", style: "ward" });
p.battle("contest");
p.battle("contest");
p.act({ kind: "route", route: "shelter" });
for (let i = 0; i < 2; i++) {
  p.work(18);
  p.herbs(12);
  p.act({ kind: "prepare" });
  p.act({ kind: "enter" });
  p.battle("fight");
  if (!i) {
    p.work(18);
    p.act({ kind: "attune" });
    while (p.state.sense < 36)
      p.send({ type: "advance", activity: "meditate", months: 1 });
    p.send({
      type: "treasure",
      action: { kind: "deploy", item: "spiritPearl" },
    });
  }
}
p.act({ kind: "method", method: "inherit" });
while (p.state.outerSea.cultivation < 599)
  p.send({ type: "advance", activity: "cultivate", months: 120 });
p.work(30);
p.act({ kind: "late" });
p.act({ kind: "leave" });
p.send({ type: "outerSea", action: { kind: "home" } });
const fixtures = [createGame("测量", "wood", 42), p.state];
const rows = [];
for (const s of fixtures) {
  if (!validState(s)) throw Error("invalid fixture");
  const samples: Record<string, number[]> = { command: [], save: [], load: [] };
  for (let i = 0; i < 45; i++) {
    let start = performance.now();
    const next = dispatch(s, {
      id: `measure-${i}`,
      type: "advance",
      activity: "work",
      months: 1,
    });
    const command = performance.now() - start;
    if (next === s || !validState(next)) throw Error("command rejected");
    start = performance.now();
    await save(next);
    const saved = performance.now() - start;
    start = performance.now();
    const restored = await load();
    const loaded = performance.now() - start;
    if (JSON.stringify(restored.state) !== JSON.stringify(next))
      throw Error("save mismatch");
    if (i >= 10) {
      samples.command.push(command);
      samples.save.push(saved);
      samples.load.push(loaded);
    }
  }
  rows.push({
    realm: s.realm,
    month: s.month,
    bytes: Buffer.byteLength(JSON.stringify(s)),
    metrics: Object.fromEntries(
      Object.entries(samples).map(([k, v]) => {
        v.sort((a, b) => a - b);
        return [
          k,
          {
            samples: v.length,
            p50Ms: v[Math.floor(v.length * 0.5)],
            p95Ms: v[Math.floor(v.length * 0.95)],
          },
        ];
      }),
    ),
  });
}
console.log(
  JSON.stringify(
    {
      environment:
        "Node + fake-indexeddb; controlled command fixtures, not browser or Windows measurements",
      node: process.version,
      rows,
    },
    null,
    2,
  ),
);
