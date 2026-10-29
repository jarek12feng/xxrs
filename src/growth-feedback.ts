import type { State } from "./world";
import { cultivationGain } from "./world";
import { readiness } from "./expedition/combat";
import { mistDetails } from "./mist";

// Compare the same encounter and character state; never invent a dummy enemy.
export function growthComparison(before: State, after: State): string[] {
  const lines: string[] = [];
  const compare = (name: string, a: number, b: number) => {
    if (a !== b) lines.push(`${name}：${a} → ${b}`);
  };
  if (!after.realm)
    compare("每月吐纳修为", cultivationGain(before), cultivationGain(after));
  const gather = (s: State) =>
    2 + (s.journey.support === "herb" ? 1 + s.growth.training.herb : 0);
  compare("每月采药灵草", gather(before), gather(after));
  const a = readiness(before),
    b = readiness(after);
  compare("青嶂交锋基础伤害（招式另计）", a.damage, b.damage);
  compare("青嶂交锋减伤", a.armor, b.armor);
  if (
    after.adventure.mist.stage !== "dormant" &&
    !after.adventure.mist.passed
  ) {
    compare(
      "当前雾海阵势把握（上限 100%）",
      mistDetails(before).chance,
      mistDetails(after).chance,
    );
    if (mistDetails(before).chance === 100 && mistDetails(after).chance === 100)
      lines.push("当前雾海把握已达 100%，本次更换不会继续提高成功率。");
  }
  return lines;
}
