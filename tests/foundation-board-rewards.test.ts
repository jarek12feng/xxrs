import { expect, it } from "vitest";
import { createCultivator } from "../tools/cultivator-fixture";
import { foundationBoard } from "../src/foundation-journey/view";
import { completeChallenge } from "../src/foundation-journey/outcome";
import { foundationCap } from "../src/foundation-journey/growth-state";

it("试剑榜预告与实际首胜修为一致，临近上限只预告可得部分", () => {
  for (const remaining of [100, 3, 0]) {
    const s = createCultivator("奖励对照", "wood", 42);
    s.realm = 1;
    s.foundationJourney.cultivation = foundationCap(s) - remaining;
    const before = s.foundationJourney.cultivation;
    const row = foundationBoard(s).rows[0]!;
    s.foundationJourney.duel = {
      id: row.id, hp: 34, enemy: 0, turn: 5, effect: "strike",
      ruleset: 2, aid: false,
    };
    completeChallenge(s);
    expect(s.foundationJourney.cultivation - before).toBe(row.cultivationReward);
    expect(row.cultivationReward).toBe(remaining === 100 ? 16 : remaining);
  }
});
