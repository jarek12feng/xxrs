import { expect, it } from "vitest";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import { goldenGoal } from "../src/golden-core/rules";

it("only names outstanding preparation after obtaining the main medicine", () => {
  const s = condensationCheckpoint();
  s.goldenCore.medicine = 1;
  s.goldenCore.site = "rented";
  expect(goldenGoal(s)).toBe("主药已备：自行炼制或委托丹师取得凝丹丹药。");
  s.goldenCore.site = "none";
  expect(goldenGoal(s)).toContain("另需备好凝丹灵地");
  expect(goldenGoal(s)).not.toContain("继续筑基修行");
  s.foundationJourney.epilogue = false;
  expect(goldenGoal(s)).toContain("继续筑基修行，完成长风归流与归山");
  s.goldenCore.site = "rented";
  expect(goldenGoal(s)).not.toContain("另需备好凝丹灵地");
});
