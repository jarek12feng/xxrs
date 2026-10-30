import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import SceneResponse from "../src/SceneResponse.vue";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  passSolutions,
  type State,
  type Intent,
  type PassSolution,
} from "../src/core";
import { readiness } from "../src/expedition/combat";
import { turnPreview } from "../src/social";
import { actionReceipt } from "../src/action-feedback";
import { automaticPause, preparationValues } from "../src/cultivation-feedback";
import { routePayoff } from "../src/route-payoff";
import { lifeReview } from "../src/life-review";
import { expeditionSession } from "../tools/expedition-simulation";
import { arenaFixture, growthBalance } from "../tools/growth-balance";
import { mistCheckpoint } from "../tools/mist-checkpoint";

it("foundation grants immediate combat power without changing save structure", () => {
  const s = createGame("成长", "wood");
  const before = structuredClone(s),
    after = { ...s, realm: 1 as const, qi: 0 };
  expect(readiness(after).damage - readiness(before).damage).toBe(2);
  expect(readiness(after).armor - readiness(before).armor).toBe(2);
  expect(readiness(after).hp).toBe(readiness(before).hp);
  expect(
    actionReceipt(before, after, { type: "break", pill: false })?.notes.join(),
  ).toContain("筑基护体");
  expect(s).toEqual(before);
});

it.each([1, 42, 9087])(
  "clears the old array with ordinary first-tier equipment after breakthrough, seed %i",
  (seed) => {
    for (const path of ["wood", "sword"] as const) {
      const play = () => {
        const p = expeditionSession(seed, path);
        p.send({
          type: "equip",
          technique: path === "wood" ? "spring" : "blade",
        });
        p.send({ type: "expedition", action: "accept" });
        p.send({ type: "expedition", action: "enter" });
        p.fight();
        p.resolve();
        p.send({
          type: "equipRelic",
          relic: path === "wood" ? "vial" : "sword",
        });
        p.prepare();
        p.send({ type: "expedition", action: "studyArray" });
        expect(p.state.expedition.cleared).toBe(2);
        expect(p.state.journey.relics[p.state.journey.equipped!]).toBe(1);
        expect(p.state.growth.training[p.state.journey.main!]).toBe(0);
        p.send({ type: "expedition", action: "enter" });
        p.fight();
        expect(p.state.expedition.cleared).toBe(3);
        expect(validState(p.state)).toBe(true);
        expect(migrateSave(p.state)).toEqual(p.state);
        return p.state;
      };
      expect(play()).toEqual(play());
    }
  },
);

it("sword's finishing initiative is conditional, seeded, previewed and idempotent", () => {
  for (const seed of [1, 42, 9087]) {
    const s = arenaFixture("blade", seed);
    const preview = turnPreview(s, "break")!;
    const weak = structuredClone(s);
    weak.social.arena.duel!.hp = 1;
    weak.social.arena.duel!.enemyHp = preview.damage;
    expect(validState(weak)).toBe(true);
    expect(turnPreview(weak, "break")!.incomingMax).toBe(0);
    const command = {
      id: "finish",
      type: "arenaTurn",
      stance: "break",
    } as const;
    const won = dispatch(weak, command);
    expect(won.social.arena.wins).toBe(3);
    expect(won.injury).toBe(0);
    expect(won.social.arena.last).toContain("未及反击");
    expect(dispatch(weak, command)).toEqual(won);
    expect(dispatch(won, command)).toBe(won);
    expect(weak.social.arena.duel!.hp).toBe(1);
    const tough = structuredClone(weak);
    tough.social.arena.duel!.enemyHp = preview.damage + 3;
    expect(turnPreview(tough, "break")!.incomingMin).toBeGreaterThan(0);
    expect(dispatch(tough, command).social.arena.losses).toBe(1);
    const breath = arenaFixture("breath", seed);
    breath.social.arena.duel!.hp = 1;
    breath.social.arena.duel!.enemyHp = 1;
    expect(dispatch(breath, command).social.arena.losses).toBe(1);
  }
});

it("compares 432 equal-loadout cases, retaining style advantages and costs", () => {
  const rows = growthBalance();
  expect(rows).toHaveLength(432);
  expect(rows.filter((r) => r.tier === "normal").every((r) => r.wins > 0)).toBe(
    true,
  );
  for (const main of ["blade", "breath", "spring"] as const)
    for (const move of ["break", "endure", "discern"] as const)
      expect(
        rows
          .filter((r) => r.main === main)
          .every((r) => r.constantWins.includes(move)),
      ).toBe(false);
  const sample = (
    main: string,
    seed: number,
    gear: string,
    support: string,
    opponent = 2,
  ) =>
    rows.find(
      (r) =>
        r.main === main &&
        r.seed === seed &&
        r.gear === gear &&
        r.support === support &&
        r.tier === "normal" &&
        r.opponent === opponent,
    )!.fastest!;
  expect(sample("blade", 42, "sword", "herb").moves.at(-1)).toBe("break");
  expect(sample("breath", 42, "sword", "herb").moves.at(-1)).toBe("endure");
  expect(sample("breath", 1, "sword", "lantern").moves.length).toBeLessThan(
    sample("blade", 1, "sword", "lantern").moves.length,
  );
  expect(sample("blade", 1, "sword", "herb", 0).hp).toBeGreaterThan(
    sample("breath", 1, "sword", "herb", 0).hp,
  );
  expect(sample("spring", 9087, "vial", "herb").hp).toBeGreaterThan(
    sample("blade", 9087, "vial", "herb").hp,
  );
  expect(sample("spring", 9087, "vial", "herb").herbs).toBeGreaterThan(0);
});

it("explains automatic stops without blocking other work at full qi", () => {
  const s = createGame("暂停", "wood");
  expect(automaticPause(s, "work", false)).toBeNull();
  const full = { ...s, qi: 360 };
  expect(automaticPause(full, "cultivate", false, s)?.target).toBe("break");
  expect(automaticPause(full, "work", false, full)).toBeNull();
  expect(automaticPause(s, "work", true)?.text).toContain("安排已完成");
  const queued = structuredClone(s);
  queued.journey.queue = [{ action: "refine", remaining: 1 }];
  queued.herbs = 0;
  queued.crafted = 1;
  expect(automaticPause(queued, "work", true)?.text).toContain("需要灵草");
  const event = dispatch(s, {
    id: "event",
    type: "advance",
    activity: "work",
    months: 3,
  });
  expect(automaticPause(event, "work", false)?.target).toBe("story");
  expect(automaticPause({ ...s, injury: 0 }, "rest", false)?.text).toContain(
    "无伤势",
  );
});

it("uses capped actual breakthrough differences, resource eligibility and no mutations", () => {
  const s = arenaFixture("blade");
  s.realm = 0;
  s.qi = 360;
  s.foundation = 23;
  s.mastery = 12;
  s.story.trust = 4;
  s.pills = 1;
  const snapshot = structuredClone(s);
  expect(preparationValues(s, true).map((r) => r.gain)).toEqual([0, 0, 0]);
  expect(preparationValues(s, true)[2]!.unavailable).toContain("已计入");
  expect(preparationValues(s, false)[2]!.gain).toBe(6);
  expect(preparationValues(s, false)[1]!.gain).toBe(1);
  expect(s).toEqual(snapshot);
  s.foundation = 0;
  s.mastery = 0;
  s.injury = 2;
  s.story.luchi = "companion";
  expect(preparationValues(s, false)[0]!.gain).toBe(5);
});

function routeSession(
  route: PassSolution,
  rescue: "roots" | "supplies" = "supplies",
) {
  let s = mistCheckpoint(42, "wood", "male", true, rescue),
    id = 0;
  const send = (intent: Intent) => {
    s = dispatch(s, { ...intent, id: `payoff-${++id}` });
    expect(validState(s)).toBe(true);
    return s;
  };
  if (route === "sword") {
    send({ type: "forge", relic: "sword" });
    send({ type: "equipRelic", relic: "sword" });
  }
  if (route === "array")
    for (const action of [
      "examineMarks",
      "market",
      "examineLedger",
      "pass",
    ] as const)
      send({ type: "road", action });
  while (s.herbs < 6) send({ type: "supplies" });
  send({ type: "road", action: passSolutions[route].prepare });
  send({ type: "road", action: passSolutions[route].finish });
  expect(s.adventure.road.solution).toBe(route);
  for (const action of ["lookout", "survey"] as const)
    send({ type: "road", action });
  for (const action of ["receive", "accept", "solo"] as const)
    send({ type: "mist", action });
  return {
    send,
    get state() {
      return s;
    },
  };
}
it.each(["medicine", "sword", "array"] as const)(
  "attributes %s payoff only when the route capability is used",
  async (route) => {
    const p = routeSession(route);
    if (route !== "sword")
      p.send({
        type: "mist",
        action: route === "medicine" ? "garden" : "station",
      });
    const before = p.state;
    const intent = {
      type: "mist",
      action:
        route === "medicine"
          ? "attune"
          : route === "sword"
            ? "caravanBridge"
            : "decode",
    } as const;
    const after = p.send(intent);
    expect(routePayoff(before, after, intent)).toHaveLength(1);
    expect(actionReceipt(before, after, intent)?.notes.join()).toContain(
      routePayoff(before, after, intent)[0],
    );
    const html = await renderToString(
      createSSRApp(SceneResponse, {
        text: after.adventure.mist.result,
        receipt: actionReceipt(before, after, intent),
      }),
    );
    expect(html).toContain('class="route-payoff"');
    expect(html).toContain(routePayoff(before, after, intent)[0]);
    const snapshot = structuredClone(after);
    expect(routePayoff(after, p.send(intent), intent)).toEqual([]);
    expect(after).toEqual(snapshot);
    expect(lifeReview(after).records.join()).toContain(
      passSolutions[route].name,
    );
  },
);
it("does not misattribute the earlier rescue to the later medicine route or invent completed history", () => {
  const p = routeSession("medicine", "roots");
  p.send({ type: "mist", action: "garden" });
  const before = p.state,
    intent = { type: "mist", action: "attune" } as const;
  expect(routePayoff(before, p.send(intent), intent)).toEqual([]);
  const fresh = createGame("未完", "wood");
  expect(lifeReview(fresh).records.join()).not.toContain("击败守阵");
  expect(lifeReview(fresh).records.join()).not.toContain("夺得本届魁首");
  expect(lifeReview(fresh).unfinished.join()).toContain("尚未");
});
