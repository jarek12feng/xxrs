import { beforeAll, expect, it } from "vitest";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { dispatch, migrateSave, validState, type State } from "../src/core";
import {
  tideQuote,
  tideSchedule,
  runTideSurvey,
  freshTideSurvey,
} from "../src/tide-survey";
import { messageThreads } from "../src/correspondence/view";
let base: State;
beforeAll(() => {
  base = goldenLateCheckpoint();
}, 30000);
function ready() {
  const s = structuredClone(base);
  const at = Math.ceil(s.month / 120) * 120;
  s.age += at - s.month;
  s.month = at;
  s.stones = Math.max(s.stones, 12);
  s.herbs = Math.max(s.herbs, 4);
  s.injury = 0;
  expect(validState(s)).toBe(true);
  return s;
}
it("周期边界和回程余量：开窗可进，未开/临界/已耗用拒绝", () => {
  const s = ready();
  expect(tideQuote(s, "careful").error).toBe("");
  expect(tideSchedule(s.month + 12).edition).toBe(
    tideSchedule(s.month).edition + 1,
  );
  const early = { ...s, month: s.month - 1 };
  expect(tideQuote(early, "careful").error).toContain("窗口");
  const late = { ...s, month: s.month + 9 };
  expect(tideQuote(late, "careful").error).toContain("窗口");
  const wrong = structuredClone(s);
  wrong.outerSea.location = "home";
  expect(tideQuote(wrong, "careful").error).toContain("古渡");
});
it.each(["careful", "deep"] as const)(
  "%s公开命令真耗月、一次结算，旧府宝物不重发，往来与读档留存",
  (action) => {
    const s = ready(),
      q = tideQuote(s, action);
    const cmd = { type: "tideSurvey" as const, action, id: "tide-visit" };
    const n = dispatch(s, cmd);
    expect(n).not.toBe(s);
    expect(validState(n)).toBe(true);
    expect(n.month).toBe(s.month + q.months);
    expect(n.stones).toBe(s.stones - 6);
    expect(n.herbs).toBe(s.herbs - 2 + q.reward.herbs);
    expect(n.treasures).toEqual(s.treasures);
    expect(n.outerSea.cleared).toBe(2);
    expect(n.outerSea.seal).toBe(s.outerSea.seal);
    expect(dispatch(s, cmd)).toEqual(n);
    expect(dispatch(n, cmd)).toBe(n);
    expect(dispatch(n, { ...cmd, id: "repeat" })).toBe(n);
    expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
    expect(
      n.correspondence.letters.some(
        (l) => l.id === `tide:${q.edition}:result` && !l.read,
      ),
    ).toBe(true);
    expect(
      messageThreads(n.correspondence.letters).filter(
        (t) => t.id === `tide:${q.edition}`,
      ),
    ).toHaveLength(1);
  },
);
it("神识不足明确败退，耗材与轻伤可预估；中断不发奖励且消耗本期机会", () => {
  const s = ready();
  s.sense = 12;
  s.treasures.artifacts = [];
  s.treasures.equipped = [];
  expect(validState(s)).toBe(true);
  const q = tideQuote(s, "deep");
  expect(q.success).toBe(false);
  const n = dispatch(s, {
    type: "tideSurvey",
    action: "deep",
    id: "low-sense",
  });
  expect(n.injury).toBe(s.injury + 1);
  expect(n.herbs).toBe(s.herbs);
  expect(n.tideSurvey.outcome).toBe("retreated");
  expect(validState(n)).toBe(true);
  const death = runTideSurvey(s, "careful", "interrupted", (x) => ({
    ...x,
    month: x.month + 1,
    age: x.age + 1,
    status: "dead",
  }));
  expect(death.month).toBe(s.month + 1);
  expect(death.tideSurvey.outcome).toBe("interrupted");
  expect(death.herbs).toBe(s.herbs - 2);
  expect(death.stones).toBe(s.stones - 6);
});
it("v49迁移不补经历和奖励，未来版本及损坏记录拒绝", () => {
  const s = ready(),
    old = JSON.parse(JSON.stringify(s));
  old.version = 49;
  delete old.tideSurvey;
  const n = migrateSave(old);
  expect(n.tideSurvey).toEqual(freshTideSurvey());
  expect(n.outerSea).toEqual(s.outerSea);
  expect(n.stones).toBe(s.stones);
  expect(() => migrateSave({ ...s, version: s.version + 1 })).toThrow();
  expect(
    validState({
      ...s,
      tideSurvey: { edition: 99999, finished: s.month, outcome: "deep" },
    }),
  ).toBe(false);
});

it("识海创伤影响深入辨纹，下次潮期开放后可再探但不补发旧奖励", () => {
  const s = ready();
  s.sense = 24;
  s.treasures.artifacts = [];
  s.treasures.equipped = [];
  s.spirit.trauma = 0;
  expect(tideQuote(s, "deep").success).toBe(true);
  s.spirit.trauma = 1;
  expect(tideQuote(s, "deep").success).toBe(false);
  const n = dispatch(s, {
    type: "tideSurvey",
    action: "careful",
    id: "first-cycle",
  });
  const next = structuredClone(n);
  next.month = s.month + 120;
  next.age += next.month - n.month;
  expect(validState(next)).toBe(true);
  expect(tideQuote(next, "careful").error).toBe("");
  const done = dispatch(next, {
    type: "tideSurvey",
    action: "careful",
    id: "next-cycle",
  });
  expect(done.herbs).toBe(next.herbs + 2);
  expect(done.tideSurvey.edition).toBe(n.tideSurvey.edition + 1);
  expect(
    done.correspondence.letters.filter((l) => /^tide:.*:result$/.test(l.id)),
  ).toHaveLength(2);
});
