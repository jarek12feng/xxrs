import { expect, it } from "vitest";
import {
  dispatch,
  nextGoal,
  roadGoal,
  mistGoal,
  mistHomeBody,
  mistQuote,
  validState,
} from "../src/core";
import { expeditionGoal } from "../src/expedition/progression";
import { openingGuide } from "../src/opening-guide";
import { luchiView } from "../src/characters";
import { expeditionSession } from "../tools/expedition-simulation";
import { mistCheckpoint } from "../tools/mist-checkpoint";

it("connects the early expedition, announced retreat, cultivation and return without losing progress", () => {
  function play() {
    const p = expeditionSession();
    p.send({ type: "expedition", action: "accept" });
    expect(p.state.expedition.last).toContain("封阵休整");
    p.send({ type: "expedition", action: "enter" });
    p.fight();
    p.send({ type: "supplies" });
    p.send({ type: "expedition", action: "healArray" });
    if (p.state.pending) {
      p.resolve();
      p.send({ type: "expedition", action: "healArray" });
    }
    expect(p.state.expedition.cleared).toBe(2);
    expect(p.state.realm).toBe(0);
    expect(p.state.expedition.last).toContain("带药签下山核对旧账");
    expect(nextGoal(p.state)).toBe(roadGoal(p.state));
    expect(openingGuide(p.state)?.body).toBe(expeditionGoal(p.state));
    const seed = p.state.seed;
    const before = structuredClone(p.state);
    nextGoal(p.state);
    roadGoal(p.state);
    openingGuide(p.state);
    expect(p.state).toEqual(before);
    expect(p.state.seed).toBe(seed);
    p.prepare();
    expect(nextGoal(p.state)).toContain("重返青嶂关");
    expect(nextGoal(p.state)).toBe(roadGoal(p.state));
    p.send({ type: "expedition", action: "enter" });
    p.fight();
    expect(p.state.expedition.cleared).toBe(3);
    expect(validState(p.state)).toBe(true);
    return p.state;
  }
  expect(play()).toEqual(play());
});

it.each(["luchi", "solo", "companion"] as const)(
  "home remembers whether %s travelled, without changing rewards",
  (partner) => {
    const s = mistCheckpoint();
    // Presentation fixture at an already completed return, independent of the combat lottery.
    s.adventure.mist = {
      ...s.adventure.mist,
      stage: "home",
      partner,
      firstRoute: "garden",
      garden: true,
      passed: true,
      lamp: true,
    };
    const before = structuredClone(s);
    expect(mistHomeBody(s).includes("与你一起放下行囊")).toBe(
      partner === "luchi",
    );
    if (partner === "luchi") {
      expect(mistQuote(s)).not.toContain("从头讲");
      expect(mistGoal(s)).toContain("一起整理");
      expect(luchiView(s).whereabouts).toContain("与你整理");
    }
    expect(s).toEqual(before);
    const n = dispatch(s, { type: "mist", action: "share", id: "home-reply" });
    expect(n.adventure.mist.settled).toBe(true);
    expect(n.adventure.mist.result.includes("共同查到")).toBe(
      partner === "luchi",
    );
    expect(dispatch(n, { type: "mist", action: "share", id: "repeat" })).toBe(
      n,
    );
  },
);
