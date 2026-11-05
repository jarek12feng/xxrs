import { breakthroughDetails, relics, techniques, type State } from "./world";
import { cultivationMonth, cultivationMonthlyGain } from "./progression";
import { readiness, combatStyle } from "./combat/game";
import { foundationPower } from "./foundation-journey/combat";
import { mistDetails } from "./mist";
import { temperInfo } from "./workshop/state";

// Next-battle values, not the HP or damage of an ongoing turn.
export const growthPower = (s: State) =>
  s.realm ? foundationPower(s) : readiness(s);
export function growthComparison(before: State, after: State): string[] {
  const lines: string[] = [];
  const compare = (name: string, a: number, b: number, unit = "") => {
    if (a !== b)
      lines.push(
        `${name}：${a}${unit} → ${b}${unit}（${b > a ? "+" : ""}${Math.round((b - a) * 1000) / 1000}${unit === "%" ? " 个百分点" : ""}）`,
      );
  };
  // Qi and foundation cultivation have different scales, so do not compare them.
  if (before.realm === after.realm) {
    const pace = (s: State) => {
      const next = cultivationMonth({ ...s, age: s.age + 1 });
      return (
        Math.round(
          (next.gain + (next.remainder - (s.cultivationRemainder ?? 0)) / 240) *
            1000,
        ) / 1000
      );
    };
    const oldGain = cultivationMonthlyGain(before),
      newGain = cultivationMonthlyGain(after);
    compare(
      after.realm === 2 ? "下月吐纳丹元修行" : after.realm === 1 ? "下月吐纳筑基修行" : "下月吐纳修为",
      oldGain,
      newGain,
    );
    if (oldGain === newGain)
      compare(
        "吐纳月积累速度（未计瓶颈，零头累计）",
        pace(before),
        pace(after),
      );
  }
  const gather = (s: State) =>
    2 + (s.journey.support === "herb" ? 1 + s.growth.training.herb : 0);
  compare("每月采药灵草", gather(before), gather(after));
  const a = growthPower(before),
    b = growthPower(after);
  compare("下场交锋初始气势", a.hp, b.hp);
  compare("交锋基础伤害（招式另计）", a.damage, b.damage);
  compare("交锋基础减伤", a.armor, b.armor);
  if (!before.realm && !after.realm)
    compare(
      "备齐筑基丹后的突破把握",
      breakthroughDetails(before, true).chance,
      breakthroughDetails(after, true).chance,
      "%",
    );
  if (before.journey.main !== after.journey.main) {
    if (before.journey.main)
      lines.push(`原主修：${combatStyle(before).description}`);
    lines.push(`新主修：${combatStyle(after).description}`);
  }
  if (before.journey.support !== after.journey.support) {
    if (before.journey.support)
      lines.push(
        `卸下${techniques[before.journey.support].name}：不再享有${techniques[before.journey.support].hint}`,
      );
    if (after.journey.support)
      lines.push(
        `装配${techniques[after.journey.support].name}：${techniques[after.journey.support].hint}`,
      );
  }
  if (before.journey.equipped !== after.journey.equipped) {
    if (before.journey.equipped)
      lines.push(
        `卸下${relics[before.journey.equipped].name}：${relics[before.journey.equipped].hint}不再生效。`,
      );
    if (after.journey.equipped)
      lines.push(
        `换上${relics[after.journey.equipped].name}：${relics[after.journey.equipped].hint}`,
      );
  }
  const inherited = (s: State) =>
    s.realm &&
    s.foundationJourney.inheritance !== "none" &&
    s.journey.main === s.foundationJourney.inheritance;
  if (!!inherited(before) !== !!inherited(after))
    lines.push(
      inherited(after)
        ? "沉井传承随对应主修生效：筑基交锋对应招式伤害 +4、承伤 −2。"
        : "沉井传承暂不生效；换回对应主修后恢复。传承仍保留。",
    );
  const equipped = (s: State) =>
    s.journey.equipped ? temperInfo(s.workshop, s.journey.equipped) : null;
  const oldTemper = equipped(before),
    newTemper = equipped(after);
  if (oldTemper?.name !== newTemper?.name) {
    if (oldTemper)
      lines.push(`卸下器纹 · ${oldTemper.name}：不再享有${oldTemper.hint}`);
    if (newTemper)
      lines.push(`生效器纹 · ${newTemper.name}：${newTemper.hint}`);
  }
  if (
    after.adventure.mist.stage !== "dormant" &&
    !after.adventure.mist.passed
  ) {
    const oldChance = mistDetails(before).chance,
      newChance = mistDetails(after).chance;
    compare("当前雾海阵势把握（上限 100%）", oldChance, newChance, "%");
    if (oldChance === 100 && newChance === 100)
      lines.push("当前雾海把握已达 100%，此次变化不会继续提高成功率。");
  }
  return lines;
}
