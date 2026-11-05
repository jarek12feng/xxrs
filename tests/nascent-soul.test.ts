import { readiness } from "../src/combat/game";
import { thunderExchange, startThunder } from "../src/nascent-soul/thunder";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { chooseThunderMove } from "../tools/nascent-thunder-policy";
import { describe, it, expect } from "vitest";
import { dispatch, type State } from "../src/core";
import { freshNascentSoul, validNascentSoul } from "../src/nascent-soul/state";
import {
  nascentPromises,
  nascentQuote,
  runNascent,
  nascentTrialPreview,
  nascentStepPreview,
  nascentGoal,
  nascentActive,
  type NascentAction,
} from "../src/nascent-soul/rules";
import { nascentInteractions } from "../src/nascent-soul/view";
const baselines = new Map<string, State>();
const tick = (s: State) => ({ ...s, month: s.month + 1, age: s.age + 1 });
function fixture(main: "spring" | "blade" | "breath" = "spring") {
  if (!baselines.has(main)) baselines.set(main, goldenLateCheckpoint(main));
  const s = structuredClone(baselines.get(main)!);
  s.pending = null;
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.adventure.step = "done";
  s.realm = 2;
  s.limit = 6000;
  s.age = 1600;
  s.month = 1408;
  s.stones = 600;
  s.herbs = 100;
  s.study = 4;

  s.journey.main = main;
  s.outerSea.location = "ferry";
  s.outerSea.cultivation = 899;
  s.conclave.stage = 2;
  s.conclave.depth = 2;
  s.conclave.method = "inherit";
  s.conclave.attuned = true;
  s.lizhao = {
    ...s.lizhao,
    cleared: true,
    outerCleared: true,
    recipeVerified: true,
    reagent: 8,
    route: "independent",
  };
  s.nascentSoul = freshNascentSoul();
  s.goldenStory.companionGoldenAt = null;
  return s;
}
let serial = 0;
function act(s: State, a: NascentAction) {
  expect(nascentQuote(s, a).error, JSON.stringify(a)).toBe("");
  const n = runNascent(s, a, "n" + serial++, tick);
  expect(n).not.toBe(s);
  expect(validNascentSoul(n)).toBe(true);
  return n;
}
function complete(s: State) {
  s = act(s, { kind: "trial" });
  for (const move of [
    "body",
    "mind",
    "break",
    "body",
    "mind",
    "break",
  ] as const)
    s = act(s, { kind: "trialMove", move });
  expect(s.nascentSoul.trialWon).toBe(true);
  s = act(s, { kind: "complete" });
  s.outerSea.cultivation = 1200;
  return s;
}
function prepare(s: State) {
  s = complete(s);
  for (const [topic, choice] of [
    ["duty", "decline"],
    ["home", "remember"],
    ["promise", "carry"],
    ["companion", "solitary"],
  ] as const)
    if (nascentPromises(s)[topic]) s = act(s, { kind: "commit", topic, choice });
  s = act(s, { kind: "claimMarrow" });
  s = act(s, { kind: "brew", method: "commission", fire: "steady" });
  s = act(s, { kind: "land", choice: "independent" });
  s = act(s, { kind: "protection", choice: "array" });
  s = act(s, { kind: "discoverMethod" });
  s = act(s, {
    kind: "studyMethod",
    method: s.journey.main === "spring" ? "stillness" : "continuity",
  });
  s = act(s, { kind: "practiceThunder" });
  s = thunder(s);
  expect(s.nascentSoul.thunder.practiced).toBe(true);
  return s;
}
function thunder(s: State) {
  for (let i = 0; s.nascentSoul.thunder.battle; i++) {
    if (i > 36) throw Error("thunder stuck");
    s = act(s, { kind: "thunderMove", move: chooseThunderMove(s) });
  }
  return s;
}
function ascend(
  s: State,
  moves: (
    "release" | "channel" | "anchor" | "observe" | "unite" | "circulate"
  )[] = ["channel", "observe", "unite"],
) {
  s = act(s, { kind: "begin" });
  for (const move of moves) s = act(s, { kind: "step", move });
  expect(s.realm).toBe(2);
  expect(s.nascentSoul.thunder.battle?.kind).toBe("tribulation");
  s = thunder(s);
  expect(s.realm).toBe(3);
  return s;
}
describe("金丹圆满和凝婴真实领域命令", () => {
  it.each(["spring", "blade", "breath"] as const)(
    "%s单身散修可完成试炼、准备、三段与能力兑现",
    (main) => {
      let s = prepare(fixture(main));
      const oldLimit = s.limit;
      s = ascend(s);
      expect(s.limit).toBe(oldLimit + 6000);
      expect(s.nascentSoul.pills).toBe(0);
      expect(s.journey.branch).toBe("none");
      s = act(s, { kind: "emerge" });
      s = act(s, { kind: "celebrate", choice: "deferred", office: "declined" });
      for (const kind of ["survey", "shelter", "cross"] as const)
        s = act(s, { kind });
      s = act(s, {kind:"crossing",move:"shore"});
      s = act(s, {kind:"cross"});
      expect(nascentGoal(s)).toContain("路标");
      expect(nascentInteractions(s).some(r => r.action.kind === "celebrate" && r.action.choice === "formal")).toBe(true);
      expect(runNascent(s, { kind: "cross" }, "again", tick)).toBe(s);
    },
  );
  it("禁室有有限丹元，猛破失败；养伤后保留渠道可重试", () => {
    let s = act(fixture(), { kind: "trial" });
    for (let i = 0; i < 6 && s.nascentSoul.trial; i++)
      s = act(s, { kind: "trialMove", move: "break" });
    expect(s.nascentSoul.trialWon).toBe(false);
    expect(s.injury).toBe(2);
    while (s.injury) s = act(s, { kind: "recover" });
    s = complete(s);
    expect(s.conclave.stage).toBe(3);
  });
  it("另一护体偏重方案也能通关，预览是纯查询", () => {
    let s = act(fixture(), { kind: "trial" });
    const before = structuredClone(s);
    expect(nascentTrialPreview(s, "body")?.bodyLoss).toBe(0);
    expect(s).toEqual(before);
    for (const move of [
      "body",
      "body",
      "break",
      "body",
      "body",
      "break",
    ] as const)
      s = act(s, { kind: "trialMove", move });
    expect(s.nascentSoul.trialWon).toBe(true);
  });
  it("主药、B辅药真实扣除，失败可补药而不删除归潮资格", () => {
    let s = fixture();
    s = act(s, { kind: "claimMarrow" });
    const reagent = s.lizhao.reagent;
    s = act(s, { kind: "brew", method: "self", fire: "rush" });
    expect(s.nascentSoul.pills).toBe(0);
    expect(s.lizhao.reagent).toBe(reagent - 1);
    expect(s.conclave.depth).toBe(2);
    expect(s.nascentSoul.marrowClaimed).toBe(true);
    s = act(s, { kind: "renewMarrow" });
    s = act(s, { kind: "brew", method: "self", fire: "steady" });
    expect(s.nascentSoul.pills).toBe(1);
    expect(runNascent(s, { kind: "claimMarrow" }, "duplicate", tick)).toBe(s);
  });
  it("三段资源不足真实失败，补丹与免费恢复后能成功", () => {
    let s = prepare(fixture());
    s.sense = 12;
    s = act(s, { kind: "strategy", choice: "flow" });
    s = act(s, { kind: "begin" });
    for (const move of ["release", "observe", "unite"] as const)
      s = act(s, { kind: "step", move });
    expect(s.realm).toBe(2);
    expect(s.nascentSoul.failures).toBe(1);
    expect(s.injury).toBe(3);
    expect(s.nascentSoul.pills).toBe(0);
    while (s.injury) s = act(s, { kind: "recover" });
    s = act(s, { kind: "renewMarrow" });
    s = act(s, { kind: "brew", method: "commission", fire: "steady" });
    s = act(s, { kind: "strategy", choice: "balanced" });
    s = ascend(s, ["channel", "anchor", "unite"]);
    expect(s.nascentSoul.failures).toBe(1);
  });
  it.each(["balanced", "flow", "spirit"] as const)(
    "准备%s有明确可达行功策略",
    (strategy) => {
      let s = prepare(fixture());
      if (strategy !== "balanced")
        s = act(s, { kind: "strategy", choice: strategy });
      s = ascend(
        s,
        strategy === "flow"
          ? ["channel", "anchor", "unite"]
          : strategy === "spirit"
            ? ["channel", "anchor", "unite"]
            : ["channel", "observe", "unite"],
      );
      expect(s.realm).toBe(3);
    },
  );
  it("已恋未契按商议-见证-礼后落盘，早契重温不退回恋人", () => {
    let s = complete(fixture());
    s.social.met = true;
    s.social.metMonth = s.month - 120;
    s.social.bonded = true;
    s.foundationJourney.bond = "promised";
    for (const choice of ["discuss", "witness"] as const)
      s = ceremonyStep(s, choice);
    expect(s.foundationJourney.bond).toBe("promised");
    s = act(s, { kind: "ceremony", choice: "meal" });
    expect(s.foundationJourney.bond).toBe("covenant");
    expect(
      runNascent(s, { kind: "ceremony", choice: "meal" }, "repeat", tick),
    ).toBe(s);
    let early = complete(fixture());
    early.social.met = true;
    early.social.metMonth = early.month - 120;
    early.foundationJourney.bond = "covenant";
    early = act(early, { kind: "ceremony", choice: "renew" });
    expect(early.foundationJourney.bond).toBe("covenant");
  });
  it("暂缓与旧契都不成为凝婴门槛，大典按现有人际和宗籍", () => {
    let s = prepare(fixture());
    s.social.met = true;
    s.social.metMonth = s.month - 120;
    s.social.bonded = true;
    s.foundationJourney.bond = "promised";
    s.foundationJourney.whereabouts = "away";
    s = act(s, { kind: "ceremony", choice: "defer" });
    if (s.nascentSoul.commitments.companion === "none") s = act(s, {kind:"commit",topic:"companion",choice:"explain"});
    s = ascend(s);
    s = act(s, { kind: "emerge" });
    s = act(s, { kind: "celebrate", choice: "simple", office: "declined" });
    expect(s.nascentSoul.guests).not.toContain("苏婉宁");
    expect(s.nascentSoul.guests).not.toContain("听松宗当值执事");
    expect(s.foundationJourney.bond).toBe("promised");
    expect(
      runNascent(
        s,
        { kind: "celebrate", choice: "formal", office: "accepted" },
        "duplicate",
        tick,
      ),
    ).toBe(s);
  });
  it("中断保留已耗月，不扣药不发成果；中途存档续行相同", () => {
    let s = prepare(fixture());
    const before = s.nascentSoul.pills;
    const stopped = runNascent(s, { kind: "begin" }, "interrupt", (x) => ({
      ...tick(x),
      status: "dead",
    }));
    expect(stopped.month).toBe(s.month + 1);
    expect(stopped.nascentSoul.pills).toBe(before);
    expect(stopped.nascentSoul.attempt).toBe(null);
    s = act(s, { kind: "begin" });
    const saved = JSON.parse(JSON.stringify(s)) as State;
    const a = runNascent(s, { kind: "step", move: "channel" }, "same", tick);
    const b = runNascent(
      saved,
      { kind: "step", move: "channel" },
      "same",
      tick,
    );
    expect(a).toEqual(b);
    expect(nascentStepPreview(s, "channel")?.loss).toBe(0);
    expect(nascentActive(s)).toBe(true);
  });
  it("堵住跨域、假动作、缺辅药、余寿不足以及未满1200", () => {
    const s = prepare(fixture());
    for (const change of [
      (x: State) => {
        x.lizhao.location = "chamber";
      },
      (x: State) => {
        x.outerSea.location = "home";
      },
      (x: State) => {
        x.outerSea.cultivation = 1199;
      },
      (x: State) => {
        x.limit = x.age + 12;
      },
    ]) {
      const bad = structuredClone(s);
      change(bad);
      expect(runNascent(bad, { kind: "begin" }, "bad", tick)).toBe(bad);
    }
    const bad = fixture();
    bad.lizhao.reagent = 0;
    bad.nascentSoul.marrowClaimed = true;
    bad.nascentSoul.marrow = 1;
    expect(
      runNascent(
        bad,
        { kind: "brew", method: "self", fire: "steady" },
        "noaux",
        tick,
      ),
    ).toBe(bad);
    expect(
      runNascent(s, { kind: "hack" } as unknown as NascentAction, "bad", tick),
    ).toBe(s);
  });
  it("公共dispatch已经接入且不允许活动中外部恢复", () => {
    const s = fixture();
    const n = dispatch(s, {
      id: "publictrial",
      type: "nascentSoul",
      action: { kind: "trial" },
    });
    expect(n.nascentSoul.trial).not.toBe(null);
    expect(
      dispatch(n, { id: "heal", type: "advance", activity: "rest", months: 1 }),
    ).toBe(n);
  });
  it("validator拒绝畸形、死态与跳阶段存档", () => {
    const s = fixture();
    expect(validNascentSoul(s)).toBe(true);
    for (const edit of [
      (x: State) => {
        x.nascentSoul.pills = -1;
      },
      (x: State) => {
        x.nascentSoul.attempt = { phase: 3, flow: 1, spirit: 1, stability: 1 };
      },
      (x: State) => {
        x.nascentSoul.emerged = true;
      },
    ]) {
      const b = structuredClone(s);
      edit(b);
      expect(validNascentSoul(b)).toBe(false);
    }
  });
  it("心得4可自炼，未验丹方不可试炼或圆满", () => {
    let s = fixture();
    s = act(s, { kind: "claimMarrow" });
    s = act(s, { kind: "brew", method: "self", fire: "steady" });
    expect(s.nascentSoul.pills).toBe(1);
    const a = fixture();
    a.lizhao.recipeVerified = false;
    expect(nascentQuote(a, { kind: "trial" }).error).not.toBe("");
    let b = complete(fixture());
    b.conclave.stage = 2;
    b.outerSea.cultivation = 899;
    b.lizhao.recipeVerified = false;
    expect(nascentQuote(b, { kind: "complete" }).error).not.toBe("");
  });
  it("在外但有近期消息可付费约见，失联与陈年旧信不能凭空到场", () => {
    let s = complete(fixture());
    s.social.met = true;
    s.social.metMonth = s.month - 120;
    s.social.bonded = true;
    s.foundationJourney.bond = "promised";
    s.foundationJourney.whereabouts = "away";
    expect(
      nascentQuote(s, { kind: "ceremony", choice: "discuss" }).error,
    ).not.toBe("");
    s = act(s, { kind: "contact" });
    s = ceremonyStep(s, "discuss");
    expect(s.nascentSoul.ceremony).toBe("discussed");
    for (const old of [false, true]) {
      let t = complete(fixture());
      t.social.met = true;
      t.social.metMonth = old ? 0 : t.month - 120;
      t.month = old ? 2500 : t.month;
      t.social.bonded = true;
      t.foundationJourney.bond = "promised";
      t.foundationJourney.whereabouts = old ? "rescued" : "missing";
      expect(nascentQuote(t, { kind: "contact" }).error).not.toBe("");
      expect(
        nascentQuote(t, { kind: "ceremony", choice: "discuss" }).error,
      ).not.toBe("");
      t = act(t, { kind: "ceremony", choice: "defer" });
      expect(t.nascentSoul.ceremony).toBe("deferred");
    }
  });
  it("相识三百年后只有已确认的独立凝丹消息才能恢复约见与结契", () => {
    let s = complete(fixture());
    s.month = 3900;
    s.age = 4092;
    s.social.met = true;
    s.social.metMonth = 100;
    s.social.bonded = true;
    s.foundationJourney.bond = "promised";
    s.foundationJourney.whereabouts = "away";
    expect(nascentQuote(s, { kind: "contact" }).error).not.toBe("");
    // A owns earning this fact through independent experience and its message command.
    Object.assign(s.goldenStory, { companionGoldenAt: 1800 });
    const old = s.month;
    s = act(s, { kind: "contact" });
    expect(s.month).toBe(old + 6);
    for (const choice of ["discuss", "witness", "meal"] as const)
      s = ceremonyStep(s, choice);
    expect(s.foundationJourney.bond).toBe("covenant");
    expect(s.goldenStory).toMatchObject({ companionGoldenAt: 1800 });
  });
  it("已确认金丹仍不能跨五百年窗口或把失联藏身视为可约见", () => {
    for (const whereabouts of ["missing", "shelter"] as const) {
      const s = complete(fixture());
      s.social.met = true;
      s.social.metMonth = 0;
      s.month = 3900;
      Object.assign(s.goldenStory, { companionGoldenAt: 1800 });
      s.foundationJourney.whereabouts = whereabouts;
      expect(nascentQuote(s, { kind: "contact" }).error).not.toBe("");
    }
    for (const goldenAt of [null, 7000]) {
      const s = complete(fixture());
      s.social.met = true;
      s.social.metMonth = 0;
      s.month = 3900;
      Object.assign(s.goldenStory, { companionGoldenAt: goldenAt });
      expect(nascentQuote(s, { kind: "contact" }).error).not.toBe("");
    }
    const s = complete(fixture());
    s.social.met = true;
    s.social.metMonth = 0;
    s.month = 6000;
    Object.assign(s.goldenStory, { companionGoldenAt: 1800 });
    expect(nascentQuote(s, { kind: "contact" }).error).not.toBe("");
  });
});

it("元婴续篇与亲自试雷是门槛，行功结束仍须应劫", () => {
  const s = prepare(fixture("blade"));
  const original = structuredClone(s);
  s.nascentSoul.thunder.method = "none";
  expect(nascentQuote(s, { kind: "begin" }).error).not.toBe("");
  s.nascentSoul.thunder = structuredClone(original.nascentSoul.thunder);
  s.nascentSoul.thunder.practiced = false;
  expect(nascentQuote(s, { kind: "begin" }).error).not.toBe("");
});
it("正式天劫气势耗尽会陨落，同归于尽不能晋升或继续恢复", () => {
  let s = prepare(fixture("blade"));
  s = act(s, { kind: "begin" });
  for (const move of ["channel", "observe", "unite"] as const)
    s = act(s, { kind: "step", move });
  const copy = structuredClone(s);
  expect(nascentInteractions(s).length).toBe(4);
  expect(s).toEqual(copy);
  s.nascentSoul.thunder.battle!.hp = 1;
  s.nascentSoul.thunder.battle!.enemy = 1;
  s.herbs = 0;
  s = act(s, { kind: "thunderMove", move: "strike", useHerbs: false });
  expect(s.realm).toBe(2);
  expect(s.injury).toBe(3);
  expect(s.nascentSoul.thunder.cleared).toBe(false);
  expect(s.nascentSoul.thunder.practiced).toBe(true);
  expect(s.nascentSoul.pills).toBe(0);
  expect(s.status).toBe('dead');
  expect(s.death?.cause).toBe('tribulation');
  expect(nascentQuote(s, { kind: 'recover' }).error).toBeTruthy();
  expect(dispatch(s, { type: 'advance', activity: 'rest', months: 1, id: 'after-death' })).toBe(s);
});
it("三重天劫中途序列化续战一致，禁止跨域推进和改换准备", () => {
  let s = prepare(fixture("breath"));
  s = act(s, { kind: "begin" });
  for (const move of ["channel", "observe", "unite"] as const)
    s = act(s, { kind: "step", move });
  s = act(s, { kind: "thunderMove", move: "discern" });
  const restored = JSON.parse(JSON.stringify(s)) as State;
  const action = { kind: "thunderMove", move: "strike" } as const;
  expect(runNascent(s, action, "same", tick)).toEqual(
    runNascent(restored, action, "same", tick),
  );
  expect(
    nascentQuote(s, { kind: "studyMethod", method: "stillness" }).error,
  ).not.toBe("");
  expect(
    dispatch(s, {
      type: "advance",
      activity: "work",
      months: 1,
      id: "blocked-work",
    }).month,
  ).toBe(s.month);
});
it("叩关提前校验全部30月，25与30月拒绝耗丹，31月可迎劫", () => {
  const prepared = prepare(fixture("blade"));
  for (const remaining of [25, 30]) {
    const s = structuredClone(prepared);
    s.age = s.limit - remaining;
    const before = structuredClone(s);
    expect(nascentQuote(s, { kind: "begin" }).error).toContain("31月");
    expect(runNascent(s, { kind: "begin" }, "life", tick)).toEqual(before);
  }
  let s = structuredClone(prepared);
  s.age = s.limit - 31;
  s = act(s, { kind: "begin" });
  for (const move of ["channel", "observe", "unite"] as const)
    s = act(s, { kind: "step", move });
  expect(s.limit - s.age).toBe(1);
  expect(s.nascentSoul.thunder.battle?.kind).toBe("tribulation");
  expect(nascentQuote(s, { kind: "thunderMove", move: "guard" }).error).toBe(
    "",
  );
});
it("药理、护持和元婴战力均有同源实际差分，恢复与普通养伤一致", () => {
  const base = prepare(fixture("breath"));
  const reviewed = act(structuredClone(base), { kind: "review" });
  const normalBegin = act(base, { kind: "begin" }),
    reviewedBegin = act(reviewed, { kind: "begin" });
  expect(
    reviewedBegin.nascentSoul.attempt!.stability -
      normalBegin.nascentSoul.attempt!.stability,
  ).toBe(1);
  const array = structuredClone(base),
    friends = structuredClone(base);
  array.nascentSoul.protection = "array";
  friends.nascentSoul.protection = "friends";
  startThunder(array, "tribulation");
  startThunder(friends, "tribulation");
  expect(
    friends.nascentSoul.thunder.battle!.maxHp -
      array.nascentSoul.thunder.battle!.maxHp,
  ).toBe(18);
  expect(
    thunderExchange(friends, "strike")!.incoming -
      thunderExchange(array, "strike")!.incoming,
  ).toBe(3);
  const hurt = structuredClone(base);
  hurt.injury = 3;
  let healed = hurt;
  for (let i = 0; i < 3; i++) healed = act(healed, { kind: "recover" });
  expect(healed.injury).toBe(0);
  expect(healed.month - hurt.month).toBe(3);
  const ascended = ascend(structuredClone(base)),
    before = readiness(base),
    after = readiness(ascended);
  expect(after.hp).toBe(Math.floor(before.hp * 1.25));
  expect(after.damage).toBe(Math.floor(before.damage * 1.2));
  expect(after.armor).toBe(Math.floor(before.armor * 1.25));
});

function ceremonyStep(s:State,choice:'discuss'|'witness'|'meal') {
 if(choice==='discuss')s=act(s,{kind:'covenant',topic:'meeting',choice:'remember'});
 if(choice==='witness')for(const action of [
 {kind:'covenant',topic:'form',choice:'quiet'},
 {kind:'covenant',topic:'token',choice:'cord'},
 {kind:'covenant',topic:'promise',choice:'letters'},
 ] as const)s=act(s,action);
 return act(s,{kind:'ceremony',choice});
}
