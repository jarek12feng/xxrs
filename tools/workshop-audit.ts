import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { dispatch, migrateSave, validState } from "../src/core";
import { workshopCheckpoint } from "./workshop-checkpoints";
import { workshopQuote } from "../src/workshop/rules";
import { type Product, type Method } from "../src/workshop/catalog";
import { passagePlan, passageIds } from "../src/qi-journey/passage";
import { qiPower } from "../src/qi-journey/rules";
const start = performance.now();
const qi = workshopCheckpoint("qi"),
  foundation = workshopCheckpoint("foundation"),
  passage = workshopCheckpoint("passage");
const rows = (
  [
    "healing",
    "clarity",
    "ward",
    "foundation",
    "sword",
    "vial",
    "iron",
  ] as Product[]
).flatMap((product) =>
  (["craft", "buy", "commission"] as Method[]).map((method) => {
    const order = { product, method },
      q = workshopQuote(qi, order),
      n = dispatch(qi, {
        type: "workshop",
        order,
        id: `audit-${product}-${method}`,
      });
    if (!validState(n) || JSON.stringify(migrateSave(n)) !== JSON.stringify(n))
      throw Error("Invalid round trip");
    return {
      product,
      method,
      cost: q.cost,
      study: q.study,
      months: q.months,
      error: q.error,
      actual: {
        months: n.month - qi.month,
        stones: qi.stones - n.stones,
        herbs: qi.herbs - n.herbs,
        ward: n.workshop.ward - qi.workshop.ward,
      },
    };
  }),
);
const report = {
  scope: "固定种子 2718 的公开命令检查点；不代表玩家成功率或真人首玩时长",
  checkpointMonths: {
    qi: qi.month,
    foundation: foundation.month,
    passage: passage.month,
  },
  rows,
  passage: passageIds.map((action) => ({
    action,
    ...passagePlan(passage, action, qiPower(passage).hp),
  })),
  elapsedMs: Math.round(performance.now() - start),
};
mkdirSync("docs/workshop-review", { recursive: true });
writeFileSync(
  "docs/workshop-review/audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    rows: rows.length,
    checkpointMonths: report.checkpointMonths,
    elapsedMs: report.elapsedMs,
  }),
);
