import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { SAVE_VERSION } from "../src/save-version";
import { freshQiNarrative } from "../src/qi-journey/narrative-state";
import { expect, it } from "vitest";
import { dispatch, validState, migrateSave, type Intent } from "../src/core";
import { foundationStep } from "../tools/foundation-playthrough";
import {
  freshPreparation,
  preparationReady,
  type PreparationRoute,
} from "../src/qi-journey/preparation";
import { qiError, qiPreview, qiEnemy, qiGoal } from "../src/qi-journey/rules";
import { freshQiPeople } from "../src/qi-journey/people";
it("凝元历练后缺少内府图时指向取图，不提前声称可进入内府", () => {
  const s = createGame("取图指引", "wood");
  s.qi = 256; s.qiJourney.gates = 1;
  s.qiJourney.preparations[1]!.medicine = 3;
  expect(qiGoal(s)).toContain("石涧药窟");
  s.qiJourney.narrative={...freshQiNarrative(),initiation:s.qiJourney.narrative.initiation,phase:"applied",method:"array",company:"alone",retreatMarked:true,mixture:"separated"};
  expect(qiGoal(s)).toContain("去路尚缺丹方与内府图，线索在青石遗府");
  s.story.choice = "self";
  expect(qiGoal(s)).toContain("凝元晶髓");
});
function run(route: PreparationRoute, path: "wood" | "sword", seed: number) {
  let s = createGame("路线验收", path, seed);
  const trace: Intent[] = [];
  for (let i = 0; i < 450 && !s.realm; i++) {
    const c = foundationStep(s, true, route);
    trace.push(c);
    s = dispatch(s, { ...c, id: `r${i}` });
    expect(validState(s), JSON.stringify(c)).toBe(true);
  }
  return { s, trace };
}
it.each(["medicine", "sect", "wander"] as const)(
  "%s earns both entry gates, with an outside witness before sect admission",
  (route) => {
    for (const path of ["wood", "sword"] as const)
      for (const seed of [1, 42, 2718]) {
        const a = run(route, path, seed),
          b = run(route, path, seed);
        expect(a.s).toEqual(b.s);
        expect(a.s.realm, JSON.stringify(a.trace.slice(-5))).toBe(1);
        for (const p of a.s.qiJourney.preparations) {
          expect(p[route]).toBe(3);
          for (const other of ["medicine", "sect", "wander"] as const)
            if (other !== route) expect(p[other]).toBe(route === 'sect' && other === 'wander' && p === a.s.qiJourney.preparations[0] ? 3 : 0);
        }
        if (route === "wander") expect(a.s.journey.branch).toBe("none");
      }
  },
);
function ready() {
  let s = createGame("阶段夹具", "wood");
  for (let i = 0; i < 400; i++) {
    const c = foundationStep(s);
    if (c.type === "qiJourney" && c.action.startsWith("prep:")) return s;
    s = dispatch(s, { ...c, id: `p${i}` });
  }
  throw Error("not prepared");
}
it("resources, simple commissions, and NPC lessons cannot bypass a complete route", () => {
  let s = ready();
  s.stones = 300;
  s.herbs = 50;
  s.qi = 239;
  s.qiJourney.people.scout = true;
  for (const a of ["lesson:scout", "commission:herbs"] as const)
    s = dispatch(s, { type: "qiJourney", action: a, id: a });
  expect(preparationReady(s)).toBe(false);
  expect(qiError(s, "enter:medicine")).toContain("备妥行装并亲自闯关");
  expect(
    dispatch(s, { type: "qiJourney", action: "enter:medicine", id: "skip" }),
  ).toBe(s);
  const staged = dispatch(s, {
    type: "qiJourney",
    action: "prep:medicine:prepare",
    id: "prep",
  });
  expect(staged.qiJourney.preparations[0]!.medicine).toBe(1);
  expect(preparationReady(staged)).toBe(false);
  expect(
    dispatch(staged, {
      type: "qiJourney",
      action: "prep:medicine:trial",
      id: "skip-choice",
    }),
  ).toBe(staged);
});
it("switching preserves paid preparations; failing and withdrawing preserve the trial checkpoint", () => {
  let s = ready();
  s.qiJourney.people.scout = true;
  s = dispatch(s, {
    type: "qiJourney",
    action: "prep:medicine:prepare",
    id: "med",
  });
  s = dispatch(s, {
    type: "qiJourney",
    action: "prep:wander:prepare",
    id: "wand",
  });
  expect(s.qiJourney.preparations[0]).toMatchObject({ medicine: 1, wander: 1 });
  s = dispatch(s, {
    type: "qiJourney",
    action: "prep:wander:careful",
    id: "choice",
  });
  const trial = dispatch(s, {
    type: "qiJourney",
    action: "prep:wander:trial",
    id: "trial",
  });
  const out = dispatch(trial, {
    type: "qiJourney",
    action: "withdraw",
    id: "out",
  });
  expect(out.qiJourney.trial).toBeNull();
  expect(out.qiJourney.preparations[0]!.wander).toBe(2);
  expect(out.stones).toBe(trial.stones);
  const weak = structuredClone(trial);
  weak.qiJourney.duel!.hp = 1;
  weak.foundation = 0;
  weak.journey.support = null;
  weak.journey.equipped = null;
  const lost = dispatch(weak, {
    type: "qiJourney",
    action: "strike",
    id: "lose",
  });
  expect(lost.qiJourney.trial).toBeNull();
  expect(lost.injury).toBe(weak.injury + 1);
  expect(lost.qiJourney.preparations[0]!.wander).toBe(2);
  expect(validState(lost)).toBe(true);
  expect(
    dispatch(migrateSave(trial), {
      type: "qiJourney",
      action: "discern",
      id: "same",
    }),
  ).toEqual(
    dispatch(trial, { type: "qiJourney", action: "discern", id: "same" }),
  );
});
it("battle victories are the only route completion and reward settlement", () => {
  let s = ready();
  for (const action of [
    "prep:wander:prepare",
    "prep:wander:careful",
    "prep:wander:trial",
  ] as const)
    s = dispatch(s, { type: "qiJourney", action, id: action });
  const before = s.stones;
  for (let i = 0; i < 16 && s.qiJourney.duel; i++) {
    const e = qiEnemy(s)!;
    const lethal = (["strike", "discern", "guard"] as const).find(
      (m) => qiPreview(s, m)!.damage >= s.qiJourney.duel!.enemy,
    );
    s = dispatch(s, {
      type: "qiJourney",
      action: lethal ?? e.pattern[s.qiJourney.duel.turn % e.pattern.length]!,
      id: `fight${i}`,
    });
  }
  expect(s.qiJourney.preparations[0]!.wander).toBe(3);
  expect(s.stones).toBe(before + 8);
  expect(s.qiJourney.essence).toBe(false);
  expect(s.qiJourney.people.core).toBe(false);
  expect(
    dispatch(s, { type: "qiJourney", action: "prep:wander:trial", id: "farm" }),
  ).toBe(s);
  s.qiJourney.gates = 1;
  s.qi = 240;
  expect(preparationReady(s)).toBe(false);
});
it("NPC trophies have exclusive rewards, and core teaching waits for foundation", () => {
  let s = ready();
  s.qiJourney.people = {
    ...freshQiPeople(),
    scout: true,
    smith: true,
    scales: true,
    core: true,
  };
  const money = dispatch(s, {
    type: "qiJourney",
    action: "reward:scales-money",
    id: "sell",
  });
  expect(money.stones).toBe(s.stones + 24);
  expect(
    dispatch(money, {
      type: "qiJourney",
      action: "reward:scales-medicine",
      id: "double",
    }),
  ).toBe(money);
  const medicine = dispatch(s, {
    type: "qiJourney",
    action: "reward:scales-medicine",
    id: "medicine",
  });
  expect(medicine.herbs).toBe(s.herbs + 4);
  expect(medicine.growth.medicines.healing).toBe(
    s.growth.medicines.healing + 2,
  );
  expect(
    dispatch(s, {
      type: "qiJourney",
      action: "reward:core-training",
      id: "early",
    }),
  ).toBe(s);
  const grown = run("wander", "wood", 42).s;
  grown.qiJourney.people.smith = true;
  const trained = dispatch(grown, {
    type: "qiJourney",
    action: "reward:core-training",
    id: "teach",
  });
  expect(trained.growth.training.guard).toBe(2);
  expect(trained.qiJourney.people.core).toBe(false);
  expect(validState(trained)).toBe(true);
  expect(
    dispatch(trained, {
      type: "qiJourney",
      action: "reward:core-money",
      id: "double-core",
    }),
  ).toBe(trained);
});
it("rejects malformed progress and future versions; 19 gains no invented route achievements", () => {
  const s = ready();
  for (const patch of [
    { preparations: [] },
    {
      preparations: [{ ...freshPreparation(), wander: 4 }, freshPreparation()],
    },
    { trial: "wander" },
    { people: { ...freshQiPeople(), scales: true, scoutReward: "money" } },
  ])
    expect(validState({ ...s, qiJourney: { ...s.qiJourney, ...patch } })).toBe(
      false,
    );
  const {
    people: _,
    preparations: __,
    trial: ___,
    ...oldJourney
  } = s.qiJourney;
  const old = { ...s, version: 19, qiJourney: oldJourney };
  const migrated = migrateSave(old);
  expect(migrated.version).toBe(SAVE_VERSION);
  expect(migrated.qiJourney.preparations).toEqual([
    freshPreparation(),
    freshPreparation(),
  ]);
  expect(migrated.qiJourney.people).toEqual(freshQiPeople());
  expect(() => migrateSave({ ...s, version: 999 })).toThrow();
});
it("learned beast and construct responses reduce real incoming damage", () => {
  let s = ready();
  s.qiJourney.preparations[0]!.medicine = 3;
  s = dispatch(s, { type: "qiJourney", action: "enter:medicine", id: "enter" });
  const before = qiPreview(s, "guard")!;
  s.qiJourney.people.scout = true;
  s.qiJourney.people.beastLesson = true;
  expect(qiPreview(s, "guard")!.incoming).toBe(
    Math.max(0, before.incoming - 2),
  );
  const wrong = qiPreview(s, "strike")!;
  s.qiJourney.people.beastLesson = false;
  expect(qiPreview(s, "strike")!.incoming).toBe(wrong.incoming);
  s.qiJourney.node = 0;
  s.qiJourney.duel = null;
  s.qiJourney.gates = 1;
  s.qi = 240;
  s.stones = 50;
  s.qiJourney.preparations[1]!.wander = 3;
  s.qiJourney.narrative={...freshQiNarrative(),initiation:s.qiJourney.narrative.initiation,phase:"applied",method:"array",company:"alone",retreatMarked:true,mixture:"separated"};
  s = dispatch(s, {
    type: "qiJourney",
    action: "enter:array",
    id: "enter-inner",
  });
  const plain = qiPreview(s, "discern")!;
  s.qiJourney.people.constructLesson = true;
  expect(qiPreview(s, "discern")!.incoming).toBe(
    Math.max(0, plain.incoming - 2),
  );
});

it('preserves trade goods and both rewards when one NPC reward would overflow', () => {
  const s = ready();
  s.qiJourney.people.scout = true;
  s.qiJourney.people.scales = true;
  s.herbs = 1e9 - 3;
  const action = 'reward:scales-medicine' as const;
  expect(qiError(s, action)).toBe('资源超过可保存上限');
  const snapshot = structuredClone(s);
  expect(dispatch(s, {type:'qiJourney',action,id:'full-reward'})).toBe(s);
  expect(s).toEqual(snapshot);
  s.herbs--;
  const n = dispatch(s, {type:'qiJourney',action,id:'full-reward'});
  expect(n.herbs).toBe(1e9);
  expect(n.growth.medicines.healing).toBe(s.growth.medicines.healing + 2);
  expect(n.qiJourney.people.scales).toBe(false);
  expect(n.qiJourney.people.scoutReward).toBe('medicine');
  expect(dispatch(n, {type:'qiJourney',action,id:'other-reward'})).toBe(n);
});

it('commission rewards cannot consume goods or record completion if the wallet is full', () => {
  const s = ready();
  s.stones = 1e9;
  const action = 'commission:herbs' as const;
  const snapshot = structuredClone(s);
  expect(dispatch(s, {type:'qiJourney',action,id:'full-commission'})).toBe(s);
  expect(s).toEqual(snapshot);
  s.stones -= 16;
  const n = dispatch(s, {type:'qiJourney',action,id:'full-commission'});
  expect(n.stones).toBe(1e9);
  expect(n.herbs).toBe(s.herbs - 4);
  expect(n.qiJourney.commissions).toContain('herbs');
  expect(dispatch(n, {type:'qiJourney',action,id:'repeat-commission'})).toBe(n);
});
