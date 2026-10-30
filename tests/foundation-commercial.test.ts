import { expect, it } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { foundationExchange } from "../src/foundation-journey/combat";
import { foundationBattleCue } from "../src/foundation-journey/battle-cues";
import { expectedMove } from "../src/foundation-journey/tactics";
import { journeyPreparation } from "../src/foundation-journey/preparation";
import {
  journeyOptions,
  journeyPresentation,
} from "../src/foundation-journey/view";
import { chapterEnding } from "../src/foundation-journey/aftermath";
import { actionReceipt } from "../src/action-feedback";
import { appendRecord, startRecord, milestones } from "../src/playtest/record";

it.each(["spring", "blade", "breath"] as const)(
  "%s completes a personal climax and homecoming without ranks, romance or side quests",
  (technique) => {
    const p = journeyPlayer(
      journeyCheckpoint(
        "female",
        true,
        technique === "blade" ? "sword" : "wood",
        technique,
        2654435761,
      ),
    );
    const ready = p.state;
    expect(ready.foundationJourney.epilogue).toBe(false);
    p.fight("culmination");
    expect(p.state.foundationJourney.board.wins).toEqual([]);
    expect(p.state.foundationJourney.bond).toBe("none");
    const won = p.state;
    p.act({ kind: "epilogue" });
    expect(p.state).toBe(won); // Must actually return home.
    p.act({ kind: "travel", destination: "home" });
    const home = p.state;
    p.act({ kind: "epilogue" });
    expect(p.state.foundationJourney.epilogue).toBe(true);
    expect(p.state.realm).toBe(1);
    expect(p.state.foundationJourney.last).toContain("闻岑");
    expect(p.state.foundationJourney.last).not.toContain("沈听澜");
    expect(
      actionReceipt(home, p.state, {
        type: "foundationJourney",
        action: { kind: "epilogue" },
      })?.spotlight,
    ).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(p.state)))).toEqual(p.state);
    const done = p.state;
    p.act({ kind: "epilogue" });
    p.act({ kind: "battle", battle: "culmination" });
    expect(p.state).toBe(done);
    expect(chapterEnding(done).join()).toContain("筑基篇终");
  },
);

it("climax qualification cannot be bypassed, and a failed attempt preserves earned preparation", () => {
  const initial = journeyCheckpoint();
  expect(
    dispatch(initial, {
      id: "skip",
      type: "foundationJourney",
      action: { kind: "battle", battle: "culmination" },
    }),
  ).toBe(initial);
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.act({ kind: "battle", battle: "culmination" });
  const s = structuredClone(p.state);
  s.foundationJourney.duel!.hp = 1;
  const loss = dispatch(s, {
    id: "fail-final",
    type: "foundationJourney",
    action: { kind: "move", move: "strike" },
  });
  expect(loss.foundationJourney.duel).toBeNull();
  expect(loss.foundationJourney.condensation).toBe(true);
  expect(loss.foundationJourney.won).toEqual(s.foundationJourney.won);
  expect(loss.injury).toBe(s.injury + 2);
  const retry = journeyPlayer(loss);
  retry.fight("culmination");
  expect(validState(retry.state)).toBe(true);
});

it("changed tactics and cultivation ability match exact preview, including lethal suppression and zero grass", () => {
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.act({ kind: "battle", battle: "culmination" });
  for (const grass of [0, 4])
    for (const enemy of [1, 70, 150, 245])
      for (const move of ["guard", "strike", "discern"] as const) {
        const s = structuredClone(p.state);
        s.herbs = grass;
        Object.assign(s.foundationJourney.duel!, {
          enemy,
          effect: "guard",
          turn: 1,
          hp: 60,
        });
        const snapshot = structuredClone(s),
          preview = foundationExchange(s, move)!;
        const n = dispatch(s, {
          id: `preview-${enemy}-${grass}-${move}`,
          type: "foundationJourney",
          action: { kind: "move", move },
        });
        expect(s).toEqual(snapshot);
        expect(n.herbs).toBe(s.herbs - preview.herbs);
        if (enemy > preview.damage) {
          expect(n.foundationJourney.duel!.enemy).toBe(enemy - preview.damage);
          expect(n.foundationJourney.duel!.hp).toBe(
            60 - preview.incoming + preview.healing,
          );
        } else {
          expect(preview.incoming).toBe(0);
          expect(preview.herbs).toBe(0);
          expect(n.foundationJourney.won).toContain("culmination");
        }
        expect(validState(n)).toBe(true);
        expect(
          dispatch(snapshot, {
            id: `preview-${enemy}-${grass}-${move}`,
            type: "foundationJourney",
            action: { kind: "move", move },
          }),
        ).toEqual(n);
      }
});
it("climax changes phase with actual HP and opponent cues follow it", () => {
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.act({ kind: "battle", battle: "culmination" });
  for (const [hp, move, cue] of [
    [245, "guard", "第一重"],
    [140, "discern", "第二重"],
    [60, "strike", "最后一重"],
  ] as const) {
    p.state.foundationJourney.duel!.enemy = hp;
    expect(expectedMove(p.state)).toBe(move);
    expect(foundationBattleCue(p.state)).toContain(cue);
    expect(foundationExchange(p.state, move)!.correct).toBe(true);
  }
});
it("three estate choices lead to different playable one-time follow-ups", () => {
  for (const outcome of ["heir", "shared", "split"]) {
    const p = journeyPlayer(journeyCheckpoint("male", true));
    p.act({ kind: "travel", destination: "estate" });
    p.act({ kind: "sideInvestigate", side: "estate" });
    p.fight("estate");
    p.act({ kind: "sideResolve", side: "estate", outcome });
    expect(
      journeyOptions(p.state, "journey").some(
        (o) => o.action.kind === "revisit",
      ),
    ).toBe(true);
    expect(journeyPresentation(p.state).body.length).toBeGreaterThan(40);
    const before = p.state;
    p.act({ kind: "revisit", side: "estate" });
    expect(p.state.stones - before.stones).toBe(outcome === "heir" ? 8 : 0);
    expect(p.state.herbs - before.herbs).toBe(outcome === "shared" ? 4 : 0);
    expect(
      p.state.growth.medicines.healing - before.growth.medicines.healing,
    ).toBe(outcome === "split" ? 1 : 0);
    const saved = migrateSave(JSON.parse(JSON.stringify(p.state)));
    expect(
      dispatch(saved, {
        id: "repeat",
        type: "foundationJourney",
        action: { kind: "revisit", side: "estate" },
      }),
    ).toBe(saved);
  }
});
it("snow outcomes unlock distinct aid only after the player returns", () => {
  for (const outcome of ["public", "protect", "repair"]) {
    const p = journeyPlayer(journeyCheckpoint("male", true));
    p.act({ kind: "travel", destination: "snow" });
    p.act({ kind: "sideInvestigate", side: "snow" });
    p.fight("snow");
    p.act({ kind: "sideResolve", side: "snow", outcome });
    const before = structuredClone(p.state);
    p.act({ kind: "revisit", side: "snow" });
    const after = structuredClone(p.state);
    for (const s of [before, after])
      s.foundationJourney.duel = {
        ruleset: 2,
        id: "rescue",
        hp: 80,
        enemy: 205,
        turn: 0,
        effect: "guard",
        aid: false,
      };
    const move =
      outcome === "public"
        ? "discern"
        : outcome === "repair"
          ? "strike"
          : "guard";
    const a = foundationExchange(before, move)!,
      b = foundationExchange(after, move)!;
    expect(b.damage - a.damage).toBe(outcome === "protect" ? 0 : 3);
    expect(a.incoming - b.incoming).toBe(outcome === "protect" ? 3 : 0);
  }
});
it("preparation forecasts a safe same-stage alternative without imposing a battle gate", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  // Boundary fixture: earned inheritance, forty cultivation from the same-stage target.
  p.state.foundationJourney.cultivation = 160;
  const prep = journeyPreparation(p.state)!;
  expect(prep.target).toBe(200);
  expect(prep.optionalBattle).toBe(true);
  expect(prep.months).toBeGreaterThan(0);
  p.send({ type: "advance", activity: "cultivate", months: prep.months });
  expect(p.state.foundationJourney.cultivation).toBeGreaterThanOrEqual(200);
  expect(p.state.foundationJourney.cultivation).toBeLessThan(206);
  expect(journeyPreparation(p.state)?.missing).toBe(0);
});
it("optional recording retains real timestamps and excludes names and save data", () => {
  const s = journeyCheckpoint();
  const r = startRecord("frozen-build", null, 1000);
  appendRecord(r, "开始观察", null, 1000);
  appendRecord(r, "外部中断开始", s, 61000);
  appendRecord(r, "外部中断结束", s, 121000);
  expect(r.entries[2]!.elapsedMs).toBe(120000);
  expect(JSON.stringify(r)).not.toContain(s.name);
  expect(JSON.stringify(r)).not.toContain('"seed"');
  expect(milestones(null, s)).toEqual(["建角完成"]);
  expect(startRecord("x", s, 1000).startingPoint).toBe("existing-save");
});
