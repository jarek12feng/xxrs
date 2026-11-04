import { describe, it, expect } from "vitest";
import { createGame, type State } from "../src/core";
import {
  pactQuote,
  runPact,
  resolvePactBattle,
  type PactAction,
  pactFightError,
} from "../src/secret-pact/rules";
import {
  arrivePactSite,
  pactDestinationError,
} from "../src/secret-pact/revision";
import {
  validSecretPact,
  pactTrialComplete,
  pactActivity,
  upgradeSecretPact,
  freshSecretPact,
} from "../src/secret-pact/state";
import { foundationCap } from "../src/progression/caps";
import { pactView } from "../src/secret-pact/view";
import { chapterEnding } from "../src/foundation-journey/aftermath";
// Domain fixtures isolate new foundation rules from the concurrent qi checkpoint migration.
function ready(route: "estate" | "snow" | "frontier" = "estate") {
  const s = createGame("照玄试行", "wood");
  s.realm = 1;
  s.month = 100;
  s.age = 292;
  s.herbs = 30;
  s.stones = 100;
  const q = s.foundationJourney;
  q.location = route;
  q.cultivation = 350;
  q.ferry = 4;
  q.inheritance = "spring";
  q.won = [
    "well",
    "application",
    "exit",
    route === "estate" ? "salamander" : route === "snow" ? "deer" : "frontier",
  ];
  q.growth.refined = true;
  q.growth.routes[route] = {
    prepared: true,
    choice: "careful",
    processed: true,
    revisited: false,
  };
  return act(s, "promise");
}
function act(s: State, a: PactAction) {
  return runPact(s, a, `${a}-${s.seen.length}`, (x) => ({
    ...x,
    month: x.month + 1,
    age: x.age + 1,
  }));
}
function flow(s: State) {
  for (const a of ["guardFlow", "readFlow", "breakFlow"] as const)
    s = act(s, a);
  return s;
}
function entered(route: "estate" | "snow" | "frontier" = "estate") {
  const s = ready(route);
  expect(arrivePactSite(s, "zhaoxuan")).toBe(true);
  return flow(act(s, "enterAnchor"));
}
function valid(s: State) {
  expect(
    validSecretPact(
      s.secretPact,
      s.month,
      s.realm,
      s.foundationJourney.won,
      s.foundationJourney.duel?.id,
    ),
  ).toBe(true);
}
describe("foundation required trial", () => {
  it("completed extraction permits reclaiming the lost manual without repeating the trial", () => {
    let s = act(entered(), "insist");
    resolvePactBattle(s, false);
    s = flow(act(s, "retryFlow"));
    s.secretPact.site = "away";
    expect(pactDestinationError(s, "zhaoxuan")).toBe("");
    expect(arrivePactSite(s, "zhaoxuan")).toBe(true);
    expect(pactFightError(s)).toBe("");
    s.foundationJourney.won.push("pactRival");
    resolvePactBattle(s, true);
    expect(s.secretPact.manual).toBe(true);
    expect(s.secretPact.trial).toBe("complete");
    expect(pactFightError(s)).toBeTruthy();
    valid(s);
  });
  it.each(["estate", "snow", "frontier"] as const)(
    "%s enters without replaying another material route",
    (route) => {
      let s = ready(route);
      const won = [...s.foundationJourney.won];
      expect(pactDestinationError(s, "zhaoxuan")).toBe("");
      expect(pactQuote(s, "enterLight").error).toContain("地图");
      arrivePactSite(s, "zhaoxuan");
      s = act(s, "enterLight");
      expect(pactQuote(s, "yield").error).toBeTruthy();
      s = flow(s);
      expect(s.secretPact.trial).toBe("division");
      s = act(s, "yield");
      expect(pactTrialComplete(s.secretPact)).toBe(false);
      expect(foundationCap(s)).toBe(399);
      s = flow(s);
      expect(pactTrialComplete(s.secretPact)).toBe(true);
      expect(foundationCap(s)).toBe(599);
      expect(s.foundationJourney.won).toEqual(won);
      expect(s.secretPact.manual).toBe(false);
      valid(s);
      expect(act(s, "yield")).toBe(s);
      expect(act(s, "readFlow")).toBe(s);
    },
  );
  it.each(["yield", "leave", "insist", "seize"] as const)(
    "%s needs a real extraction and preserves different facts",
    (choice) => {
      let s = entered();
      s = act(s, choice);
      if (choice === "insist" || choice === "seize") {
        expect(pactFightError(s)).toBe("");
        s.foundationJourney.won.push("pactRival");
        resolvePactBattle(s, true);
        expect(pactTrialComplete(s.secretPact)).toBe(false);
        s = act(s, "retryFlow");
      }
      expect(pactTrialComplete(s.secretPact)).toBe(false);
      s = flow(s);
      valid(s);
      expect(s.secretPact.manual).toBe(
        choice === "insist" || choice === "seize",
      );
      expect(pactTrialComplete(s.secretPact)).toBe(true);
      expect(s.secretPact.aggressor).toBe(
        choice === "insist" ? "rival" : choice === "seize" ? "player" : "none",
      );
      const restored = JSON.parse(JSON.stringify(s));
      valid(restored);
      expect(restored).toEqual(s);
    },
  );
  it("failure, retreat, recovery and retry do not erase material or synthesize completion", () => {
    let s = ready();
    arrivePactSite(s, "zhaoxuan");
    s = act(s, "enterLight");
    for (let i = 0; i < 3; i++) s = act(s, "breakFlow");
    expect(s.injury).toBe(2);
    expect(s.secretPact.hazard).toBeNull();
    expect(pactActivity(s.secretPact)).toBe(false);
    const won = [...s.foundationJourney.won];
    s = act(s, "retryFlow");
    s = act(s, "withdrawFlow");
    expect(s.injury).toBe(2);
    expect(s.secretPact.site).toBe("zhaoxuan");
    s = act(s, "retryFlow");
    s = flow(s);
    s = act(s, "leave");
    s = flow(s);
    valid(s);
    expect(s.foundationJourney.won).toEqual(won);
    expect(pactTrialComplete(s.secretPact)).toBe(true);
  });
  it("battle loss permits extraction while a prior peace permanently rejects pursuit", () => {
    let s = act(entered(), "insist");
    resolvePactBattle(s, false);
    s = act(s, "settle");
    expect(s.secretPact.pursuit).toBe("closed");
    expect(pactFightError(s)).toContain("了结");
    s = flow(act(s, "retryFlow"));
    valid(s);
    s.secretPact.site = "away";
    expect(act(s, "notice")).toBe(s);
    expect(pactDestinationError(s, "brokenStele")).toBeTruthy();
  });
  it("interruptions debit nothing and deterministic runs preserve all new fields", () => {
    const s = ready();
    arrivePactSite(s, "zhaoxuan");
    const n = runPact(s, "enterAnchor", "last-month", (x) => ({
      ...x,
      status: "dead",
      month: x.month + 1,
    }));
    expect(n.herbs).toBe(s.herbs);
    expect(n.secretPact.trial).toBe("none");
    expect(flow(act(s, "enterAnchor"))).toEqual(flow(act(s, "enterAnchor")));
    const old: any = { ...freshSecretPact() };
    delete old.trial;
    delete old.hazard;
    delete old.site;
    delete old.story;
    delete old.pursuit;
    delete old.pursuitPrepared;
    expect(validSecretPact(old, 0, 0, [], undefined)).toBe(false);
    expect(upgradeSecretPact(old)).toEqual(freshSecretPact());
  });
});
describe("broken stele and ordinary foundation scenes", () => {
  it("external news requires winning at the current material site", () => {
    const s = ready("estate");
    s.foundationJourney.location = "snow";
    expect(act(s, "foreignNews")).toBe(s);
  });
  it.each(["female", "male"] as const)("%s alone does not invent Su at the well or home", gender => {
    let s = ready();
    s.social.gender = gender;
    s.foundationJourney.whereabouts = "away";
    s.foundationJourney.location = "ferry";
    s = act(s, "observeScale");
    expect(s.secretPact.story.scale).toBe(true);
    expect(s.secretPact.last).not.toContain("苏婉宁");
    s.foundationJourney.location = "home";
    s.foundationJourney.epilogue = true;
    s = act(s, "keepHome");
    expect(s.secretPact.story.letter).toBe("keep");
    expect(s.secretPact.last).not.toContain("苏婉宁");
  });
  it("homecoming includes the leader response even when the optional letter is untouched", () => {
    const s = ready();
    expect(s.secretPact.story.letter).toBe("none");
    const ending = chapterEnding(s).join("\n");
    expect(ending).toContain("掌门陆怀真");
    expect(ending).toContain("凝丹主药");
    expect(ending).toContain("不要求两边都做");
  });
  function dispute(choice: "insist" | "seize") {
    let s = act(entered(), choice);
    s.foundationJourney.won.push("pactRival");
    resolvePactBattle(s, true);
    s = flow(act(s, "retryFlow"));
    s.secretPact.site = "away";
    return s;
  }
  it.each(["insist", "seize"] as const)(
    "%s witness costs and trust follow the actual aggressor",
    (choice) => {
      let s = dispute(choice);
      s.foundationJourney.rescue = 2;
      expect(act(s, "notice")).toBe(s);
      s.foundationJourney.rescue = 0;
      s = act(s, "notice");
      expect(s.secretPact.pursuit).toBe("notified");
      expect(pactQuote(s, "witness").error).toBeTruthy();
      arrivePactSite(s, "brokenStele");
      const stones = s.stones;
      s = act(s, "witness");
      expect(s.stones).toBe(stones - (choice === "seize" ? 24 : 0));
      expect(s.secretPact.manual).toBe(true);
      expect(s.secretPact.settled).toBe(true);
      valid(s);
      expect(act(s, "witness")).toBe(s);
      expect(act(s, "confront")).toBe(s);
      expect(pactDestinationError(s, "brokenStele")).toBeTruthy();
      expect(pactView(s).relationship).toBe("旧怨已了");
    },
  );
  it("prepared showdown can fail and retry once to a durable ending without loot", () => {
    let s = act(dispute("seize"), "notice");
    s = act(s, "preparePursuit");
    arrivePactSite(s, "brokenStele");
    s = act(s, "confront");
    for (let i = 0; i < 3; i++) s = act(s, "breakFlow");
    expect(s.injury).toBe(2);
    expect(s.secretPact.settled).toBe(false);
    s = flow(act(s, "confront"));
    expect(s.secretPact.pursuit).toBe("closed");
    expect(s.secretPact.aggressor).toBe("player");
    valid(s);
  });
  it("identity, limited observation, external news and home letter are one-time choices", () => {
    let s = ready();
    s.foundationJourney.location = "home";
    s.adventure.road.surveyed = true;
    s = act(s, "identityDecline");
    expect(s.secretPact.story.identity).toBe("decline");
    expect(s.secretPact.last).toContain("散修");
    expect(act(s, "identityAccept")).toBe(s);
    s.foundationJourney.location = "ferry";
    s = act(s, "observeScale");
    expect(s.secretPact.story.scale).toBe(true);
    expect(s.secretPact.last).toContain("不足以");
    s.foundationJourney.location = "estate";
    s = act(s, "foreignNews");
    expect(s.secretPact.story.news).toBe("estate");
    expect(s.secretPact.last).toContain("澄渊");
    s.foundationJourney.location = "home";
    expect(act(s, "replyHome")).toBe(s);
    s.foundationJourney.epilogue = true;
    s = act(s, "replyHome");
    expect(s.secretPact.story.letter).toBe("reply");
    expect(s.secretPact.last).toContain("不能据此判断");
  });
});

it('requires the middle-stage trial before starting the rescue so the two gates cannot wait on each other', async () => {
  const { journeyActionError }=await import('../src/foundation-journey/progression');
  let s=ready('frontier');s.social.gender='female';
  expect(journeyActionError(s,{kind:'report'})).toContain('照玄');
  arrivePactSite(s,'zhaoxuan');s=flow(act(s,'enterLight'));s=flow(act(s,'yield'));
  s.secretPact.site='away';
  expect(journeyActionError(s,{kind:'report'})).toBe('');
});
