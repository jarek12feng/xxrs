import {
  breakthroughSuccess,
  relics,
  techniques,
  type State,
  type Technique,
  type Relic,
} from "./world";
import { growthComparison } from "./growth-feedback";
import { tempers, type Temper } from "./workshop/state";
import { formatLifeMonths } from "./cultivation";
export type GrowthPreviewRequest =
  | { kind: "relic"; id: Relic }
  | { kind: "refine"; id: Relic }
  | { kind: "temper"; id: Relic; temper: Temper }
  | { kind: "technique" | "training"; id: Technique }
  | { kind: "healing" | "rest" | "break" };
export function growthPreview(s: State, request: GrowthPreviewRequest) {
  let next = s;
  let title = "",
    note = "";
  if (request.kind === "refine" || request.kind === "temper") {
    const id = request.id;
    if (request.kind === "refine") {
      title = `${s.journey.relics[id] ? "精炼" : "取得"}${relics[id].name}后`;
      if (s.journey.relics[id] >= 2)
        return { title, note: "已精炼至二阶。", lines: [] };
      next = {
        ...s,
        journey: {
          ...s.journey,
          relics: { ...s.journey.relics, [id]: s.journey.relics[id] + 1 },
        },
      };
    } else {
      title = `${relics[id].name}刻纹后`;
      if (!Object.hasOwn(tempers[id], request.temper))
        return { title, note: "此器无法使用该器纹。", lines: [] };
      next = {
        ...s,
        workshop: {
          ...s.workshop,
          temper: { ...s.workshop.temper, [id]: request.temper },
        },
      } as State;
    }
    note = `仅比较成品效果，费用与工期见下方报价。${s.journey.equipped === id ? "此器已装备，完成后生效。" : "此器未装备；以下比较完成后再装备的效果，不会自动换装。"}`;
    next = { ...next, journey: { ...next.journey, equipped: id } };
  } else if (request.kind === "relic") {
    const id = request.id;
    title = `换上${relics[id].name}`;
    note =
      s.journey.equipped === id
        ? "当前已装备。"
        : `当前：${s.journey.equipped ? relics[s.journey.equipped].name : "未装备"}。入袋不生效，装配后才替换当前灵器。`;
    next = { ...s, journey: { ...s.journey, equipped: id } };
  } else if (request.kind === "technique" || request.kind === "training") {
    const id = request.id,
      slot = techniques[id].slot;
    const equipped = s.journey[slot] === id;
    title = `${request.kind === "training" ? "研修" : "装配"}${techniques[id].name}`;
    if (request.kind === "training") {
      if (s.growth.training[id] >= 2)
        return { title, note: "已通达本篇。", lines: [] };
      next = {
        ...s,
        growth: {
          ...s.growth,
          training: { ...s.growth.training, [id]: s.growth.training[id] + 1 },
        },
      };
      note = equipped
        ? "消耗灵石 12、灵草 2；研修后立即生效。"
        : "消耗灵石 12、灵草 2；此功法尚未装配，研修不会立即改变当前能力。以下比较研修后再装配的效果。";
    } else {
      note = equipped
        ? "当前已装配。"
        : `${s.journey.known.includes(id) ? "已习得，尚未装配。" : "求教只习得功法，仍须装配才生效。"}将替换${s.journey[slot] ? techniques[s.journey[slot]!].name : "空置功法位"}。`;
    }
    next = { ...next, journey: { ...next.journey, [slot]: id } };
  } else if (request.kind === "break") {
    title = "筑基成功后";
    next = { ...s, ...breakthroughSuccess(s) };
    note = `寿元上限 ${formatLifeMonths(s.limit)} → ${formatLifeMonths(next.limit)}；已损寿元不会补回。炼气修为转化为境界，开放功法通达与二阶灵器；仍须自行研修、精炼。`;
  } else {
    const healed = Math.min(s.injury, request.kind === "rest" ? 1 : 2);
    title = request.kind === "rest" ? "静养一月后" : "服回春散后";
    note = `伤势 ${s.injury} → ${s.injury - healed}；${request.kind === "rest" ? "不耗灵石，耗时一月；这里只比较疗伤效果，剧情可能打断行动。" : "消耗回春散 1，不推进月份。"}不恢复正在交锋中的气势。`;
    next = { ...s, injury: s.injury - healed };
  }
  return { title, note, lines: growthComparison(s, next) };
}
