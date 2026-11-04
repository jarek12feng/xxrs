import { expect, it } from "vitest";
import { dispatch, type State, type Intent } from "../src/core";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import { outerSeaCheckpoint } from "../tools/outer-sea-checkpoint";
import { completedStoryRoute } from "../src/wayfaring/completed-routes";
import { storyRoute } from "../src/wayfaring/story-routes";
const inland = condensationCheckpoint(),
  coast = outerSeaCheckpoint();
type Domain = "goldenCore" | "outerSea" | "conclave";
function fighting(domain: Domain, result: "win" | "loss" | "withdraw") {
  const s = structuredClone(domain === "goldenCore" ? inland : coast);
  const duel = {
    hp: result === "loss" ? 1 : 999,
    enemy: result === "win" ? 1 : 9999,
    turn: result === "loss" ? 11 : 0,
    effect: "none",
  };
  if (domain === "goldenCore")
    Object.assign(s.goldenCore, { expedition: "path", route: "share", duel });
  if (domain === "outerSea")
    Object.assign(s.outerSea, {
      location: "ruins",
      prepared: true,
      pact: "share",
      duel: { ...duel, depth: 1 },
    });
  if (domain === "conclave") {
    s.outerSea.location = "ferry";
    Object.assign(s.conclave, {
      stage: 1,
      location: "vault",
      route: "current",
      wins: 2,
      duel: { ...duel, kind: "vault", index: 0 },
    });
  }
  return s;
}
it.each(["goldenCore", "outerSea", "conclave"] as const)(
  "%s returns from actual loss and withdrawal commands without another settlement",
  (domain) => {
    for (const outcome of ["loss", "withdraw"] as const) {
      const old = fighting(domain, outcome);
      const intent: Intent =
        outcome === "withdraw"
          ? { type: domain, action: { kind: "withdraw" } }
          : { type: domain, action: { kind: "move", move: "strike" } };
      const next = dispatch(old, { ...intent, id: "end-" + outcome });
      const saved = structuredClone(next),
        before = structuredClone(old);
      const route = completedStoryRoute(next, old)!;
      expect(route).not.toBeNull();
      expect(route.error).toBe("");
      expect(route).toMatchObject({ months: 0, stones: 0, herbs: 0 });
      expect(route.to).toBe(
        domain === "goldenCore"
          ? "home"
          : domain === "outerSea"
            ? "ferry"
            : "court",
      );
      expect(next.month).toBe(old.month);
      expect(next).toEqual(saved);
      expect(old).toEqual(before);
    }
  },
);
it.each(["outerSea", "conclave"] as const)(
  "%s victory returns with saved rewards untouched",
  (domain) => {
    const old = fighting(domain, "win");
    const next = dispatch(old, {
      type: domain,
      action: { kind: "move", move: "strike" },
      id: "win",
    });
    const saved = structuredClone(next);
    expect(completedStoryRoute(next, old)?.to).toBe(
      domain === "outerSea" ? "ferry" : "court",
    );
    expect(
      domain === "outerSea" ? next.outerSea.cleared : next.conclave.depth,
    ).toBe(1);
    expect(next).toEqual(saved);
  },
);
it("medicine victory stays at the bed; taking medicine returns, ordinary withdrawal keeps its existing controller", () => {
  const old = fighting("goldenCore", "win");
  const won = dispatch(old, {
    type: "goldenCore",
    action: { kind: "move", move: "strike" },
    id: "win",
  });
  expect(won.goldenCore.expedition).toBe("won");
  expect(completedStoryRoute(won, old)).toBeNull();
  const home = dispatch(won, {
    type: "goldenCore",
    action: { kind: "take" },
    id: "take",
  });
  expect(completedStoryRoute(home, won)?.path).toEqual(["path", "home"]);
  expect(home.goldenCore.medicine).toBe(won.goldenCore.medicine + 1);
  const back = dispatch(won, {
    type: "goldenCore",
    action: { kind: "withdraw" },
    id: "back",
  });
  expect(completedStoryRoute(back, won)).toBeNull();
  expect(
    storyRoute(won, { type: "goldenCore", action: { kind: "withdraw" } })?.to,
  ).toBe("home");
});
it("same-place contest results, unchanged saves and death do not play a successful journey", () => {
  const old = fighting("conclave", "win");
  old.conclave.location = "court";
  old.conclave.duel!.kind = "contest";
  const next = structuredClone(old);
  next.conclave.duel = null;
  expect(completedStoryRoute(next, old)).toBeNull();
  expect(completedStoryRoute(old, old)).toBeNull();
  const sea = fighting("outerSea", "loss"),
    dead = structuredClone(sea);
  dead.status = "dead";
  dead.outerSea.duel = null;
  dead.outerSea.location = "ferry";
  expect(completedStoryRoute(dead, sea)).toBeNull();
});
it.each(['outerSea','conclave'] as const)('%s ordinary return remains on the existing quoted route',domain=>{
  const old=fighting(domain,'withdraw');
  if(domain==='outerSea')old.outerSea.duel=null;else old.conclave.duel=null;
  const intent:Intent=domain==='outerSea'?{type:domain,action:{kind:'return'}}:{type:domain,action:{kind:'withdraw'}};
  expect(storyRoute(old,intent)?.error).toBe('');
  const next=dispatch(old,{...intent,id:'ordinary-return'});
  expect(completedStoryRoute(next,old)).toBeNull();
});
