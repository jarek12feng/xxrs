import { describe, it, expect } from "vitest";
import { createGame } from "../src/core";
import { storyChapter, storyChapters } from "../src/scene2d/story-routing";
describe("read-only story scene selection", () => {
  it("shows one current realm and rejects stale preferences without changing state", () => {
    const s = createGame("场景", "wood", 42);
    const before = JSON.stringify(s);
    expect(storyChapter(s, "conclave")).toBe("opening");
    expect(JSON.stringify(s)).toBe(before);
    s.adventure.step = "done";
    expect(storyChapters(s).map((x) => x.id)).toEqual([
      "road",
      "qi",
      "rewards",
    ]);
    s.realm = 1;
    expect(storyChapter(s, "qi")).toBe("foundation");
    s.foundationJourney.cultivation = 200;
    expect(storyChapter(s, "golden")).toBe("golden");
    s.realm = 2;
    expect(storyChapter(s, "foundation")).toBe("golden");
    s.goldenCore.farShore = true;
    expect(storyChapter(s, "")).toBe("sea");
    s.outerSea.notice = 0;
    expect(storyChapter(s, "conclave")).toBe("conclave");
  });
  it("keeps ongoing journeys in control instead of navigating to a second full scene", () => {
    const s = createGame("场景", "wood", 42);
    s.realm = 2;
    s.goldenCore.farShore = true;
    s.outerSea.notice = 0;
    s.outerSea.location = "ruins";
    expect(storyChapter(s, "conclave")).toBe("sea");
    s.conclave.location = "court";
    expect(storyChapter(s, "sea")).toBe("conclave");
    s.realm = 1;
    s.adventure.mist.stage = "letter";
    expect(storyChapter(s, "mist")).toBe("mist");
    s.sectContest.stage = "entered";
    expect(storyChapter(s, "road")).toBe("contest");
  });
});

// These fixtures isolate presentation eligibility; no realm change is performed by routing.
it.each([1, 2] as const)(
  "realm %i retains earned book and relic gifts until claimed",
  (realm) => {
    const s = createGame("未领谢礼", "wood", 42);
    s.adventure.step = "done";
    s.realm = realm;
    const before = JSON.stringify(s);
    expect(storyChapters(s).map((x) => x.id)).toContain("rewards");
    expect(storyChapter(s, "rewards")).toBe("rewards");
    expect(JSON.stringify(s)).toBe(before);
    s.journey.learning.book = true;
    expect(storyChapters(s).map((x) => x.id)).not.toContain("rewards");
    s.expedition.cleared = 1;
    expect(storyChapter(s, "rewards")).toBe("rewards");
    if (realm === 2) {
      s.goldenCore.farShore = true;
      expect(storyChapter(s, "rewards")).toBe("rewards");
    }
    s.journey.learning.relic = true;
    expect(storyChapters(s).map((x) => x.id)).not.toContain("rewards");
    expect(storyChapter(s, "rewards")).toBe(realm === 1 ? "foundation" : "sea");
  },
);
it("unclaimed gifts do not replace an ongoing golden-core encounter", () => {
  const s = createGame("谢礼与交锋", "wood", 42);
  s.adventure.step = "done";
  s.realm = 2;
  s.goldenCore.farShore = true;
  s.outerSea.location = "ruins";
  expect(storyChapter(s, "rewards")).toBe("sea");
  s.conclave.location = "court";
  expect(storyChapter(s, "rewards")).toBe("conclave");
});
