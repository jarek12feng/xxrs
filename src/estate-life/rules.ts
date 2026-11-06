import type { State } from "../world";
import { activityInterruption } from "../scene-activity";
import { revisitView } from "../world-revisits/projection";
import { revisitLocation } from "../world-revisits/rules";
import {
  quoteSettlement,
  settleResources,
  type ResourceAmounts,
} from "../economy";
import { advanceMonths } from "../timeline";
import type { EstateJob } from "./state";
export type EstateAction =
  | "medicine"
  | "escort"
  | "dry"
  | "cool"
  | "separate"
  | "ridge"
  | "canal"
  | "repair"
  | "herbs"
  | "stones"
  | "learn"
  | "cancel"
  | "buy";
export const estateActions: EstateAction[] = [
  "medicine",
  "escort",
  "dry",
  "cool",
  "separate",
  "ridge",
  "canal",
  "repair",
  "herbs",
  "stones",
  "learn",
  "cancel",
  "buy",
];
export function estateQuote(s: State, a: EstateAction) {
  const life = s.estateLife,
    w = life.work;
  let error = activityInterruption(s),
    months = 0;
  let cost: ResourceAmounts = {},
    reward: ResourceAmounts = {};
  if (!estateActions.includes(a)) error ||= "未知药庄操作";
  if (!revisitLocation(s, "estate")) error ||= "先回晴川药庄，当面办理";
  if (s.ascension || s.nascentSoul.attempt || s.nascentSoul.trial)
    error ||= "先完成眼前行功";
  if (a === "buy") {
    cost = revisitView(s, "estate")?.offers[0]?.cost ?? { stones: 8 };
    reward = { herbs: 4 };
  } else if (a === "medicine" || a === "escort") {
    if (w) error ||= "手头已有一份合作，可先完成或交还";
    if (s.month < life.availableAt[a])
      error ||= `下一批${a === "medicine" ? "潮药" : "护运"}在第${life.availableAt[a]}月备齐；可做别事或按需买药`;
    if (
      a === "medicine" &&
      !s.journey.known.some((k) => k === "spring" || k === "herb")
    )
      error ||= "需先学长春诀或辨草录，才能辨认待制药材";
    if (a === "escort" && s.injury > 1) error ||= "护运前先静养至伤势不超过1";
    cost = a === "medicine" ? { herbs: 2 } : {};
    months = a === "medicine" ? 1 : 0;
  } else if (a === "learn") {
    if (w) error ||= "先交清手头合作，再用完整记录求教";
    if (life.packing) error ||= "已学会分层封药";
    if (!life.completed.medicine && !life.completed.escort)
      error ||= "岑霁想先看一份亲手完成的制药或护运记录";
    months = 1;
  } else {
    if (!w) error ||= "尚未接下合作";
    if (["dry", "cool", "separate"].includes(a)) {
      if (w?.kind !== "medicine") error ||= "需在制药案上操作";
      if (a === "dry") {
        months = 1;
        if (w && w.progress === 0) error ||= "湿气已尽，不必再加热";
        if (w && w.strain + 2 > 4) error ||= "余热过高，先摊凉，避免毁药";
      }
      if (a === "cool" && w?.strain === 0) error ||= "药叶已凉";
      if (a === "separate") {
        if (w?.progress === 0) error ||= "湿气已尽";
        cost = life.packing ? {} : { herbs: 1 };
      }
    }
    if (["ridge", "canal", "repair"].includes(a)) {
      if (w?.kind !== "escort") error ||= "需先接下分批护运";
      if (s.injury > 1) error ||= "先静养至伤势不超过1，再搬运药篓";
      if (a !== "repair" && w && w.progress >= 3)
        error ||= "三批药篓均已交到，回案领取报酬";
      const wear = life.packing ? 1 : 2;
      if (a === "ridge" && w && w.strain + wear > 4)
        error ||= "篓架已松，再走短坡会散药；可整修或走水渠长路";
      if (a === "repair" && w?.strain === 0) error ||= "篓架完好，无需整修";
      months = a === "canal" ? 2 : 1;
    }
    if (a === "herbs" || a === "stones") {
      if (
        w &&
        (w.kind === "medicine"
          ? w.progress !== 0 || w.strain > 1
          : w.progress !== 3)
      )
        error ||=
          w.kind === "medicine"
            ? "湿气须尽、余热不超过1，才能封存交药"
            : "先护送完三批药篓";
      months = w?.kind === "medicine" ? 2 : 0;
      reward = a === "herbs" ? { herbs: 6 } : { stones: 12 };
    }
  }
  error ||= quoteSettlement(s, cost, reward).error;
  return { error, months, cost, reward };
}
export function runEstateLife(
  input: State,
  a: EstateAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (!id || input.seen.includes(id)) return input;
  const q = estateQuote(input, a);
  if (q.error) return input;
  let s = structuredClone(input);
  if (settleResources(s, q.cost, {}).error) return input;
  const advanced = advanceMonths(s, q.months, {
    tick,
    interrupt: activityInterruption,
  });
  s = advanced.state;
  const l = s.estateLife;
  let text = "";
  if (advanced.stopped) {
    text =
      "合作被眼前事务打断，已耗年月与材料不退；本步尚未完成，没有领取报酬。原有记录保留，可待事了再来。";
  } else if (a === "buy") {
    if (settleResources(s, {}, q.reward).error) return input;
    text = "你按药庄现价买下灵草4，可用于现有丹方与行前整备。";
  } else if (a === "medicine" || a === "escort") {
    l.work = { kind: a, progress: a === "medicine" ? 4 : 0, strain: 0 };
    text =
      a === "medicine"
        ? "岑霁把潮药铺在案上。你已备好辅药，药叶湿气4、余热0，待你自行安排处理。"
        : "药工把三批药篓的交接签交给你。每送一批都回庄交签；短坡颠簸，沿渠路远，可以分批安排。";
  } else if (a === "learn") {
    l.packing = true;
    text =
      "你带着实际合作记录，与岑霁亲试分层封药：制潮药时分层不再耗灵草，护运短坡的篓架损耗由2降为1。两处都能继续用。";
  } else if (a === "cancel") {
    l.work = null;
    text =
      "你将未完的药案或护运签交还药庄。已耗物资与年月保留，没有报酬；以后仍可重新合作。";
  } else if (a === "herbs" || a === "stones") {
    if (settleResources(s, {}, q.reward).error) return input;
    const kind = l.work!.kind;
    l.completed[kind] = Math.min(1e9, l.completed[kind] + 1);
    l.availableAt[kind] = s.month + 12;
    l.work = null;
    text = `${kind === "medicine" ? "潮药封存复核通过，岑霁收下你的药性记录" : "三批药篓完好交接，药工在护运签上记下你的名字"}。你选择领取${a === "herbs" ? "灵草6" : "灵石12"}，可用于下一程备药。下一批同类合作在十二月后备齐，无需留庄等候。`;
  } else {
    const w = l.work!;
    if (a === "dry") {
      w.progress = Math.max(0, w.progress - 2);
      w.strain += 2;
      text = "你用一个月缓烘药叶，湿气降低2、余热增加2。";
    }
    if (a === "cool") {
      w.strain = Math.max(0, w.strain - 2);
      text = "你把药叶摊开，余热散去2。";
    }
    if (a === "separate") {
      w.progress--;
      w.strain = Math.max(0, w.strain - 1);
      text = l.packing
        ? "你依分层封药手法隔开湿叶，不耗辅药，湿气与余热各减1。"
        : "你以一份干灵草隔开湿叶，湿气与余热各减1。";
    }
    if (a === "ridge" || a === "canal") {
      w.progress++;
      if (a === "ridge") w.strain += l.packing ? 1 : 2;
      text = `第${w.progress}批药篓已交到，你回庄交签。${a === "ridge" ? `短坡往返一月，篓架损耗增加${l.packing ? 1 : 2}。` : "沿渠往返两月，药篓未增加损耗。"}`;
    }
    if (a === "repair") {
      w.strain = Math.max(0, w.strain - 2);
      text = "你用一个月重编篓架并试载，损耗降低2。";
    }
  }
  l.last = text;
  s.foundationJourney.last = text;
  s.log.unshift({ month: s.month, kind: "major", text });
  s.log = s.log.slice(0, 180);
  s.seen = [...s.seen, id].slice(-512);
  return s;
}
export function estateRelationship(s: State) {
  const l = s.estateLife;
  if (l.packing)
    return "岑霁留着与你共同复核的封药记录，愿意与你讨论下一批药材的处置。";
  if (l.completed.medicine)
    return "岑霁认可你亲手处理的药性记录，愿意用这份记录教你分层封药。";
  if (l.completed.escort)
    return "药工记得你护送来的完整药篓。岑霁愿意与你复盘运输中的药性变化。";
  return "药庄按交接验药，不问宗门出身。岑霁正在整理潮药记录，药工也缺能护送药篓的人手。";
}
export const jobName = (kind: EstateJob) =>
  kind === "medicine" ? "潮药处理" : "分批护运";
