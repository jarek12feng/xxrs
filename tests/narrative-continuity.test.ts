// @vitest-environment happy-dom
import { createApp, nextTick, reactive, h } from "vue";
import { expect, it } from "vitest";
import { createGame, migrateSave } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import {
  journeyOptions,
  journeyPresentation,
} from "../src/foundation-journey/view";
import { sisterNote, sideScene } from "../src/foundation-journey/narrative";
import { companionScene } from "../src/companion-scenes";
import JourneyResult from "../src/foundation-journey/JourneyResult.vue";

it("does not name the missing sister's location in actions or hints; meeting survives reload and supersedes older notes", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.act({ kind: "sister" });
  const before = structuredClone(p.state);
  const option = journeyOptions(p.state, "journey").find(
    (o) => o.action.kind === "reuniteSister",
  )!;
  expect(
    option.label + option.error + journeyPresentation(p.state).body,
  ).not.toMatch(/见郁晚舟|姐姐还活着|侧院见人/);
  expect(option.error).not.toBe("");
  expect(p.state).toEqual(before);
  p.fight("well");
  expect(
    journeyOptions(p.state, "journey").find(
      (o) => o.action.kind === "reuniteSister",
    )!.error,
  ).toBe("");
  p.act({ kind: "reuniteSister" });
  const met = migrateSave(JSON.parse(JSON.stringify(p.state)));
  expect(sisterNote(met)).toContain("当面重逢");
  expect(sisterNote(met)).not.toMatch(/平安.*未确认|近况仍待/);
  expect(journeyPresentation(met).speaker).toBe("郁晚舟");
  // Knowledge from the reunion must win even when the optional old ledger was never read.
  met.adventure.mist.station = false;
  expect(sisterNote(met)).toContain("当面重逢");
});

it("does not infer sister evidence from an unrelated visit to the station", () => {
  const s = createGame("来客", "wood", 42);
  s.adventure.mist.station = true;
  expect(sisterNote(s)).toBe("");
  s.expedition.cleared = 3;
  expect(sisterNote(s)).toContain("曾随队救治");
  expect(sisterNote(s)).not.toContain("当面重逢");
});

it.each(["estate", "snow"] as const)(
  "%s findings appear after the actual trial and remain after revisiting",
  (side) => {
    const p = journeyPlayer(journeyCheckpoint("male", true));
    p.act({ kind: "travel", destination: side });
    const arrival = journeyPresentation(p.state).body;
    expect(arrival).not.toMatch(/西门却不是非封不可|老根下面露出/);
    p.act({ kind: "sideInvestigate", side });
    const investigation = sideScene(p.state, side);
    expect(investigation).not.toMatch(/西门却不是非封不可|老根下面露出/);
    p.fight(side);
    const saved = migrateSave(JSON.parse(JSON.stringify(p.state)));
    const snapshot = structuredClone(saved);
    expect(sideScene(saved, side)).toContain(
      side === "snow" ? "西门却不是非封不可" : "老根下面露出",
    );
    expect(saved).toEqual(snapshot);
    p.act({ kind: "travel", destination: "home" });
    p.act({ kind: "travel", destination: side });
    expect(journeyPresentation(p.state).body).toBe(sideScene(saved, side));
    expect(p.state.foundationJourney.last).toBe(
      `你来到${side === "estate" ? "晴川药庄" : "雪线旧门"}。`,
    );
  },
);

it("both companion voices recall only the selected shared experience without changing state", () => {
  const s = createGame("同行", "wood", 42);
  for (const gender of ["male", "female"] as const) {
    s.social.gender = gender;
    for (const choice of ["care", "mark", "stay"] as const) {
      s.social.answers.walk = choice;
      const before = structuredClone(s);
      const text = companionScene(s, "night");
      expect(text).toContain(
        { care: "替药工敷过药", mark: "补下的记号", stay: "众人走得很慢" }[
          choice
        ],
      );
      expect(text).toContain(gender === "male" ? "沈听澜" : "尹照川");
      expect(text).not.toContain(gender === "male" ? "尹照川" : "沈听澜");
      expect(s).toEqual(before);
    }
  }
});

it("story receipts reveal the scene by default, remain collapsible, and reveal the next scene", async () => {
  const data = reactive({ text: "纸上有两个印。她按住了其中一页。" });
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () => h(JourneyResult, { text: data.text, expanded: true }),
  });
  app.mount(host);
  try {
    expect(host.querySelector("details")!.open).toBe(true);
    host.querySelector("details")!.open = false;
    data.text = "门外还有人等。你们先打开药库。";
    await nextTick();
    expect(host.querySelector("details")!.open).toBe(true);
    expect(host.textContent).toContain("先打开药库");
  } finally {
    app.unmount();
    host.remove();
  }
});

it("returning after departure does not reenact an earlier obstruction in the visible receipt", () => {
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.act({ kind: "travel", destination: "ferry" });
  expect(p.state.foundationJourney.last).toBe("你来到无名渡。");
  expect(journeyPresentation(p.state).body).not.toMatch(
    /第三次被执卫赶回|先签了/,
  );
  p.act({ kind: "travel", destination: "estate" });
  p.act({ kind: "sideInvestigate", side: "estate" });
  p.fight("estate");
  p.act({ kind: "sideResolve", side: "estate", outcome: "split" });
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "travel", destination: "estate" });
  expect(p.state.foundationJourney.last).toBe("你来到晴川药庄。");
  expect(journeyPresentation(p.state).body).toContain("匾");
  expect(
    journeyPresentation(p.state).body + p.state.foundationJourney.last,
  ).not.toContain("迟迟不开库门");
});

it("home reflects learned techniques and completed rescue instead of restarting the first search", () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  p.act({ kind: "travel", destination: "home" });
  expect(journeyPresentation(p.state).body).toContain("沉井里拓下");
  expect(journeyPresentation(p.state).body).not.toContain("旧卷提到");
  const complete = journeyPlayer(journeyCheckpoint("male", true));
  complete.act({ kind: "travel", destination: "home" });
  expect(journeyPresentation(complete.state).body).toContain("顺畅衔接");
});

it.each(["male", "female"] as const)(
  "%s loss of contact honors the agreed meeting method and explains the second departure",
  async (gender) => {
    const { advancePlot } = await import("../src/foundation-journey/plot");
    for (const contact of ["letters", "station"] as const) {
      // Boundary fixture for the narrative event; the public-command relationship gate is covered in foundation-late.
      const s = createGame("相约", "wood", 42);
      s.social.gender = gender;
      s.foundationJourney.bond = "covenant";
      s.foundationJourney.reunion = true;
      s.foundationJourney.contact = contact;
      advancePlot(s, { kind: "report" });
      expect(s.foundationJourney.last).toContain("上次重逢后又随探索队");
      expect(s.foundationJourney.last).toContain(
        contact === "letters" ? "回信" : "旅亭赴约",
      );
      expect(s.foundationJourney.last).not.toContain(
        contact === "letters" ? "旅亭赴约" : "回信",
      );
      expect(s.foundationJourney.whereabouts).toBe("missing");
    }
  },
);
