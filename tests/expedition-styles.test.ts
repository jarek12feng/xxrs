import { expect, it } from "vitest";
import {
  dispatch,
  migrateSave,
  validState,
  type Technique,
  type Path,
  type Aptitude,
} from "../src/core";
import { exchangePreview, readiness } from "../src/expedition/combat";
import {
  expeditionResolution,
  expeditionMistEcho,
} from "../src/expedition/resolution";
import { expeditionSession } from "../tools/expedition-simulation";
import { renderToString } from "vue/server-renderer";
import { createSSRApp } from "vue";
import ExpeditionResolution from "../src/expedition/ExpeditionResolution.vue";
function boss(
  technique?: Technique,
  seed = 42,
  path: Path = "wood",
  aptitude: Aptitude = "insightful",
) {
  const p = expeditionSession(seed, path, aptitude);
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  p.send({ type: "expedition", action: "studyArray" });
  if (technique) {
    p.send({ type: "learn", technique });
    p.send({ type: "equip", technique });
    expect(p.state.journey.main).toBe(technique);
  }
  p.send({ type: "expedition", action: "enter" });
  return p;
}
it("equipped sword technique trades extra incoming damage for a stronger counterattack", () => {
  const base = boss(),
    sword = boss("blade");
  const normal = exchangePreview(base.state, "strike")!,
    enhanced = exchangePreview(sword.state, "strike")!;
  expect(enhanced.damage - normal.damage).toBe(8);
  expect(enhanced.incoming - normal.incoming).toBe(2);
  const armored = {
    ...sword.state,
    journey: {
      ...sword.state.journey,
      support: "guard" as const,
      equipped: "vial" as const,
      relics: { vial: 2, sword: 0 },
    },
    expedition: {
      ...sword.state.expedition,
      cleared: 0,
      duel: { hp: 42, enemy: 34, turn: 1 },
    },
  };
  expect(exchangePreview(armored, "strike")!.incoming).toBe(3);
  const old = sword.state;
  const preview = exchangePreview(old, "strike")!;
  sword.send({ type: "expedition", action: "strike" });
  expect(sword.state.expedition.duel!.enemy).toBe(
    old.expedition.duel!.enemy - preview.damage,
  );
  expect(sword.state.expedition.duel!.hp).toBe(
    old.expedition.duel!.hp - preview.incoming,
  );
  expect(migrateSave(sword.state)).toEqual(sword.state);
});
it("medicine spends one herb to recover after a survivable hit, caps health and is idempotent", () => {
  const p = boss("spring"),
    old = p.state;
  const cmd = { type: "expedition", action: "guard", id: "heal-once" } as const;
  const next = dispatch(old, cmd);
  expect(next.herbs).toBe(old.herbs - 1);
  const calc = exchangePreview(old, "guard")!;
  expect(next.expedition.duel!.hp).toBe(
    old.expedition.duel!.hp - calc.incoming + 7,
  );
  expect(next.expedition.duel!.hp).toBeLessThanOrEqual(readiness(next).hp);
  expect(dispatch(next, cmd)).toBe(next);
  expect(validState(next)).toBe(true);
  const bare = { ...old, herbs: 0 };
  expect(exchangePreview(bare, "guard")!.herbs).toBe(0);
  expect(dispatch(bare, { ...cmd, id: "bare" }).herbs).toBe(0);
  const dying = {
    ...old,
    expedition: { ...old.expedition, duel: { ...old.expedition.duel!, hp: 1 } },
  };
  const dead = dispatch(dying, { ...cmd, id: "fatal" });
  expect(dead.expedition.duel).toBeNull();
  expect(dead.expedition.effect).toBe("loss");
  expect(dead.herbs).toBe(dying.herbs);
  const almost = {
    ...old,
    expedition: {
      ...old.expedition,
      duel: { ...old.expedition.duel!, enemy: 1 },
    },
  };
  expect(exchangePreview(almost, "guard")).toMatchObject({
    herbs: 0,
    healing: 0,
    incoming: 0,
  });
});
it("perception technique specifically breaks the golem core and cannot be swapped mid fight", () => {
  const p = boss("breath"),
    baseline = boss();
  const special = exchangePreview(p.state, "discern")!,
    plain = exchangePreview(baseline.state, "discern")!;
  expect(special.damage - plain.damage).toBe(7);
  expect(plain.incoming - special.incoming).toBe(2);
  const old = p.state;
  expect(
    dispatch(old, { type: "equip", technique: "spring", id: "swap" }),
  ).toBe(old);
  expect(exchangePreview(old, "guard")!.damage).toBe(
    exchangePreview(baseline.state, "guard")!.damage,
  );
});
it("all three equipped styles can complete the existing boss with resources bounded", () => {
  for (const style of ["blade", "spring", "breath"] as const) {
    const p = boss(style),
      before = p.state.herbs;
    p.fight();
    expect(p.state.expedition.cleared).toBe(3);
    expect(p.state.herbs).toBeGreaterThanOrEqual(0);
    expect(p.state.herbs).toBeLessThanOrEqual(before + 2);
    expect(validState(p.state)).toBe(true);
  }
});
it("reveals evidence only after victory and responds to stored choices without awarding anything", async () => {
  const p = boss();
  expect(expeditionResolution(p.state)).toBeNull();
  expect(expeditionMistEcho(p.state, "decode")).toBe("");
  p.fight();
  const frozen = structuredClone(p.state);
  for (const choice of ["roots", "supplies", "legacy"] as const)
    for (const route of ["medicine", "sword", "array", "legacy"] as const) {
      const s = {
        ...p.state,
        adventure: {
          ...p.state.adventure,
          rescueChoice: choice,
          road: { ...p.state.adventure.road, solution: route },
        },
      };
      const ending = expeditionResolution(s)!;
      expect(ending.discovery).toContain("被扣作阵引");
      expect(ending.evidence).toContain("有人改了它");
      expect(ending.response).toContain(
        {
          roots: "护根结",
          supplies: "先救眼前的人",
          legacy: "没把姐姐的事说清",
        }[choice],
      );
      expect(ending.route).toContain(
        { medicine: "求医簿", sword: "碎石", array: "接人", legacy: "旧路" }[
          route
        ],
      );
      expect(expeditionMistEcho(s, "decode")).toContain("随队救治");
    }
  await renderToString(createSSRApp(ExpeditionResolution, { game: p.state }));
  expect(p.state).toEqual(frozen);
  expect(expeditionResolution(migrateSave(frozen))).toEqual(
    expeditionResolution(frozen),
  );
});
it("carries the discovered ledger into the real mist commands and does not repeat evidence rewards", () => {
  const p = boss();
  p.fight();
  while (p.state.herbs < 6) p.send({ type: "supplies" });
  for (const action of [
    "pass",
    "diagnoseRoots",
    "healPass",
    "lookout",
    "survey",
  ] as const)
    p.send({ type: "road", action });
  expect(p.state.adventure.road.surveyed).toBe(true);
  for (const action of ["receive", "accept"] as const)
    p.send({ type: "mist", action });
  expect(p.state.adventure.mist.result).toContain("转运册");
  p.send({ type: "advance", activity: "meditate", months: 2 });
  for (const action of ["solo", "station", "decode"] as const)
    p.send({ type: "mist", action });
  expect(p.state.adventure.mist.station).toBe(true);
  expect(p.state.adventure.mist.result).toContain("随队救治");
  expect(p.state.log[0]!.text).toContain("交接簿");
  const before = p.state;
  p.send({ type: "mist", action: "decode" });
  expect(p.state).toBe(before);
});
it("replays 180 style/path/aptitude/seed combinations with bounded herbs and no blocked route", () => {
  for (const style of ["blade", "spring", "breath"] as const)
    for (const path of ["wood", "sword"] as const)
      for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
        for (let seed = 1; seed <= 10; seed++) {
          const a = boss(style, seed, path, aptitude),
            b = boss(style, seed, path, aptitude);
          a.fight();
          b.fight();
          expect(a.state).toEqual(b.state);
          expect(a.state.expedition.cleared).toBe(3);
          expect(a.state.herbs).toBeGreaterThanOrEqual(0);
          expect(a.state.injury).toBe(0);
        }
});
it("does not invent station evidence when the player only explored the garden", () => {
  const p = boss();
  p.fight();
  expect(p.state.adventure.mist.station).toBe(false);
  expect(expeditionMistEcho(p.state, "share")).toContain("还未核实");
  expect(expeditionMistEcho(p.state, "share")).not.toContain("随队救治");
});

it("boss preparation carries exactly one exchange and survives saving without another roll", () => {
  const p = boss();
  const seed = p.state.seed;
  const first = p.state;
  p.send({ type: "expedition", action: "guard" });
  const guarded = p.state;
  expect(exchangePreview(guarded, "strike")!.damage).toBe(
    exchangePreview(
      { ...guarded, expedition: { ...guarded.expedition, effect: "none" } },
      "strike",
    )!.damage + 18, // 10 蓄势 + 8 避开闭核抗性
  );
  expect(migrateSave(guarded)).toEqual(guarded);
  p.send({ type: "expedition", action: "discern" });
  const probed = p.state;
  const plain = {
    ...probed,
    expedition: { ...probed.expedition, effect: "none" as const },
  };
  expect(exchangePreview(probed, "strike")!.damage).toBe(
    exchangePreview(plain, "strike")!.damage + 6,
  );
  p.send({ type: "expedition", action: "strike" });
  expect(p.state.seed).toBe(seed);
  expect(first.expedition.duel!.turn).toBe(0);
  expect(p.state.expedition.effect).toBe("strike");
});
it("the same boss configuration supports reading tells and a deliberate guard-counter route", () => {
  function play(approach: "read" | "counter") {
    const p = boss("blade");
    if (approach === "read") p.fight();
    else
      for (let i = 0; p.state.expedition.duel && i < 12; i++)
        p.send({ type: "expedition", action: i % 2 ? "strike" : "guard" });
    expect(p.state.expedition.cleared).toBe(3);
    expect(p.state.injury).toBe(0);
    expect(validState(p.state)).toBe(true);
    return p.state;
  }
  expect(play("read")).toEqual(play("read"));
  expect(play("counter")).toEqual(play("counter"));
});
