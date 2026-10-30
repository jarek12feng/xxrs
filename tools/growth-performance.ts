import { createGame, dispatch, validState } from "../src/core";
export function growthPerformance() {
  const results = [];
  for (const full of [false, true]) {
    const s = createGame("performance", "wood", 42);
    if (full) {
      s.log = Array.from({ length: 180 }, (_, i) => ({
        month: 0,
        kind: "story" as const,
        text: `留存见闻 ${i}：药队沿归路回山，记下此行的选择。`,
      }));
      s.seen = Array.from({ length: 512 }, (_, i) => `retained-${i}`);
    }
    if (!validState(s)) throw Error("Invalid performance fixture");
    const samples = [];
    for (let i = 0; i < 120; i++) {
      const start = performance.now();
      const n = dispatch(s, {
        id: `perf-${i}`,
        type: "advance",
        activity: "work",
        months: 1,
      });
      const end = performance.now();
      if (n.month !== 1 || !validState(n))
        throw Error("Command did not settle");
      if (i >= 20) samples.push(end - start);
    }
    samples.sort((a, b) => a - b);
    results.push({
      fixture: full ? "180 logs / 512 ids" : "fresh",
      samples: samples.length,
      p50Ms: samples[49],
      p95Ms: samples[94],
    });
  }
  return results;
}
if (process.argv.includes("--run"))
  console.log(JSON.stringify(growthPerformance(), null, 2));
