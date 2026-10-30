import type { State } from "./world";
import { cultivationStageIndex } from "./cultivation";
import { mainTraining } from "./growth";

export interface OpponentRealm {
  realm: 0 | 1;
  stage: number;
}
const stages = ["前期", "中期", "后期", "圆满"];
export const opponentRealmName = (enemy: OpponentRealm) =>
  `${enemy.realm === 1 ? "筑基" : "炼气"}${stages[enemy.stage]}`;

// These are earned capabilities, not extra rewards or a random chance to ignore a realm.
export function realmPressure(
  s: State,
  enemy: OpponentRealm,
  cooperation = false,
) {
  const playerStage = cultivationStageIndex(s);
  const gap =
    enemy.realm > s.realm
      ? 4 + enemy.stage
      : enemy.realm < s.realm
        ? 0
        : Math.max(0, enemy.stage - playerStage);
  const methods: string[] = [];
  if (
    s.realm === 1 &&
    s.foundationJourney.inheritance !== "none" &&
    s.journey.main === s.foundationJourney.inheritance &&
    mainTraining(s) === 2
  )
    methods.push("沉井传承与主修相合");
  if (s.journey.equipped !== null && s.journey.relics[s.journey.equipped] >= 2)
    methods.push("二阶灵器");
  if (cooperation) methods.push("道侣合力");
  const uncovered =
    enemy.realm > s.realm ? gap : Math.max(0, gap - methods.length);
  return {
    gap,
    methods,
    uncovered,
    damageFactor: Math.pow(0.45, uncovered),
    incomingExtra: uncovered * 12,
    description: `${opponentRealmName(enemy)}。${gap ? `高出${enemy.realm > s.realm ? "一个大境界" : `${gap}个小境界`}；${methods.length ? methods.join("、") + "支撑越阶" : "尚无越阶机缘"}。${uncovered ? `尚有境界压制：伤害降至 ${Math.round(Math.pow(0.45, uncovered) * 100)}%，承伤 +${uncovered * 12}。` : "已能抵住境界压制，仍须应对招式。"}` : "没有境界压制，胜负取决于构筑与应对。"}`,
  };
}
