import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { SAVE_VERSION } from "../src/save-version";
import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import {
  dispatch,
  migrateSave,
  validState,
  createGame,
  type State,
} from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { travelLocation, travelQuote } from "../src/wayfaring/rules";
import { routeBetween } from "../src/wayfaring/routes";
import { routeNodes } from "../src/landmarks";
import { narrativeAtlasPaths } from "../src/wayfaring/narrative-map";
import { storyRoute } from "../src/wayfaring/story-routes";
import { freshQiNarrative } from "../src/qi-journey/narrative-state";

function ready() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.cultivate(280);
  p.act({ kind: "travel", destination: "snow" });
  p.act({ kind: "routePrepare", route: "snow", method: "service" });
  p.act({ kind: "routeChoose", route: "snow", choice: "careful" });
  p.fight("deer");
  p.send({ type: "secretPact", action: "promise" });
  return p.state;
}
const visit = (s: State, id = "visit") =>
  dispatch(s, {
    id,
    type: "wayfaring",
    action: { kind: "visit", site: "zhaoxuan", mode: "land" },
  });
it("照玄沿真实路网抵达，来回不赠送古道材料；原地近邻返程也结算路程", () => {
  const s = ready(),
    q = travelQuote(s, "pact");
  expect(q.error).toBe("");
  expect(q.path).toEqual(["snow", "inn", "frontier", "pact"]);
  const n = visit(s);
  expect(validState(n)).toBe(true);
  expect(travelLocation(n)).toBe("pact");
  expect(n.month - s.month).toBe(q.months);
  expect(n.foundationJourney.won).toEqual(s.foundationJourney.won);
  expect(n.secretPact.trial).toBe("none");
  expect(
    routeNodes(n)
      .filter((x) => x.current)
      .map((x) => x.key),
  ).toEqual(["inland-pact"]);
  const back = travelQuote(n, "frontier");
  expect(back.error).toBe("");
  const returned = dispatch(n, {
    id: "return",
    type: "foundationJourney",
    action: { kind: "travel", destination: "frontier" },
  });
  expect(travelLocation(returned)).toBe("frontier");
  expect(returned.month - n.month).toBe(back.months);
  expect(returned.secretPact.site).toBe("away");
  expect(validState(returned)).toBe(true);
  expect(returned.foundationJourney.won).toEqual(s.foundationJourney.won);
});
it("赴照玄在会期来信处暂停，读档续行保留原路径、费用和目的地", () => {
  const s = ready();
  s.journey.branch = "jian";
  s.sectContest.stage = "invited";
  s.sectContest.source = "mentor";
  s.sectContest.edition = 1;
  s.sectContest.announced = s.month - 119;
  s.sectContest.starts = s.month + 1;
  s.sectContest.reminded = false;
  const q = travelQuote(s, "pact"),
    n = visit(s);
  expect(n.wayfaring.trip?.to).toBe("pact");
  expect(travelLocation(n)).toBe("snow");
  expect(n.secretPact.site).toBe("away");
  expect(validState(n)).toBe(true);
  const saved = migrateSave(n),
    r = visit(saved, "resume");
  expect(r.month - s.month).toBe(q.months);
  expect(travelLocation(r)).toBe("pact");
  expect(validState(r)).toBe(true);
  expect(r.foundationJourney.won).toEqual(s.foundationJourney.won);
  const cancelled = dispatch(saved, {
    id: "cancel",
    type: "wayfaring",
    action: { kind: "cancel" },
  });
  expect(travelLocation(cancelled)).toBe("snow");
  expect(cancelled.wayfaring.trip).toBeNull();
  expect(cancelled.month).toBe(n.month);
});
it("地图所有新地点资源存在、连线端点有效；查看不会制造探访或行程", () => {
  const s = createGame("地图", "wood"),
    copy = structuredClone(s),
    nodes = routeNodes(s);
  const golden = conclaveCheckpoint();
  const goldenCopy = structuredClone(golden);
  const known = structuredClone(golden);
  known.secretPact.pursuit="notified"; known.qiJourney.narrative.pursuit="warned"; known.lizhao.pursuit="warned"; known.goldenStory.teachings.push("pill"); known.conclave.introduced=true;
  const allNodes = [...nodes, ...routeNodes(known)];
  for (const [a, b] of narrativeAtlasPaths) {
    expect(allNodes.some((n) => n.key === a), a).toBe(true);
    expect(allNodes.some((n) => n.key === b), b).toBe(true);
  }
  expect(golden).toEqual(goldenCopy);
  for (const n of nodes.filter(
    (n) => n.key.startsWith("inland-") || n.key.startsWith("qi-"),
  )) {
    expect(existsSync("public" + n.image), n.image).toBe(true);
    expect(n.intent).toBeUndefined();
    expect(n.visited).toBe(false);
  }
  expect(s).toEqual(copy);
  expect(
    routeBetween("inn", "stele", "land").distance +
      routeBetween("stele", "frontier", "land").distance,
  ).toBe(routeBetween("inn", "frontier", "land").distance);
});
it("v37补齐新状态，不编造药窟或照玄；v38字段损坏与未来版本保留拒绝", () => {
  const s = ready(),
    old = structuredClone(s) as unknown as Record<string, any>;
  old.version = 37;
  delete old.qiJourney.narrative;
  for (const key of [
    "trial",
    "hazard",
    "site",
    "pursuit",
    "pursuitPrepared",
    "story",
  ])
    delete old.secretPact[key];
  const before = JSON.stringify(old),
    n = migrateSave(old);
  expect(n.version).toBe(SAVE_VERSION);
  expect(n.qiJourney.narrative).toEqual(freshQiNarrative());
  expect(n.secretPact.trial).toBe("none");
  expect(n.foundationJourney).toEqual(s.foundationJourney);
  expect(n.seed).toBe(s.seed);
  expect(n.stones).toBe(s.stones);
  expect(JSON.stringify(old)).toBe(before);
  const bad = structuredClone(n);
  delete (bad.qiJourney as any).narrative;
  expect(() => migrateSave(bad)).toThrow();
  expect(() => migrateSave({ ...n, version: 999 })).toThrow();
});
it("行程展示沿用内陆实际报价，不为照玄额外收取旧章节固定月数", () => {
  const s = ready(),
    intent = {
      type: "wayfaring" as const,
      action: { kind: "visit" as const, site: "zhaoxuan" as const },
    },
    r = storyRoute(s, intent)!;
  expect(r.path).toEqual(travelQuote(s, "pact").path);
  expect(r.months).toBe(travelQuote(s, "pact").months);
  expect(r.stones).toBe(0);
  expect(r.herbs).toBe(0);
});
