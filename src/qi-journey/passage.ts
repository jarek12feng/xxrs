import type { State } from "../world";
export const passageIds = ["herbs", "ward", "sense", "force"] as const;
export type Passage = (typeof passageIds)[number];
export function passagePlan(s: State, action: Passage, maxVigor: number) {
  const options = {
    herbs: {
      label: "草药护脉",
      recovery: 18,
      injury: 0,
      herbs: 3,
      ward: 0,
      cost: "灵草 3",
      error: s.herbs < 3 ? "需要灵草 3；也可辨阵或强行通过" : "",
    },
    ward: {
      label: "服护脉丹",
      recovery: 26,
      injury: 0,
      herbs: 0,
      ward: 1,
      cost: "护脉丹 1",
      error: s.workshop.ward < 1 ? "需要护脉丹 1；可提前自炼、购买或委托" : "",
    },
    sense: {
      label: "辨阵绕行",
      recovery: 6,
      injury: 0,
      herbs: 0,
      ward: 0,
      cost: "神识 8、心得 2",
      error: s.sense < 8 || s.study < 2 ? "需要神识 8、心得 2" : "",
    },
    force: {
      label: "强行通过",
      recovery: -12,
      injury: 1,
      herbs: 0,
      ward: 0,
      cost: "伤势 +1",
      error: "",
    },
  } as const;
  const p = options[action];
  // Injury reduces max vigor by five before entering the next fight.
  const nextMax = maxVigor - (Math.min(6, s.injury + p.injury) - s.injury) * 5;
  return {
    ...p,
    vigor: Math.max(1, Math.min(nextMax, s.qiJourney.vigor + p.recovery)),
  };
}
export function settlePassage(s: State, action: Passage, maxVigor: number) {
  const p = passagePlan(s, action, maxVigor);
  s.herbs -= p.herbs;
  s.workshop.ward -= p.ward;
  s.injury = Math.min(6, s.injury + p.injury);
  return p;
}
