import {
  queueActions,
  refineCost,
  type Activity,
  type Intent,
  type State,
} from "./core";
import { enrichReceipt } from "./journey-feedback";

export interface ActionReceipt {
  title: string;
  ritual:
    "break" | "refine" | "retreat" | "challenge" | "forge" | "duel" | null;
  unlocks?: string[];
  scene?: {
    from: string;
    to: string;
    body: string;
    unlocks: string[];
    chapter: "adventure" | "road" | "mist" | "world";
    place?: "valley" | "peak" | "sea";
  };
  person?: {
    name: string;
    portrait: string;
    response: string;
    relation: string;
  };
  tone: "success" | "warning" | "neutral";
  months: number;
  changes: { label: string; before: number; after: number; good: boolean }[];
  notes: string[];
  cost: string;
  next: string;
}

// A read-only presentation projection. No extra roll, command, or saved field.
export function actionReceipt(
  before: State,
  after: State,
  intent: Intent,
): ActionReceipt | null {
  if (
    before === after ||
    before.life !== after.life ||
    intent.type === "beginChapter"
  )
    return null;
  if (
    (intent.type === "arenaTurn" && after.social.arena.duel) ||
    (intent.type === "arenaStart" && after.social.arena.duel)
  )
    return null;
  const effective: Intent =
    intent.type === "queueTick" && before.journey.queue[0]
      ? before.journey.queue[0].action === "refine"
        ? { type: "prepare", kind: "refine" }
        : {
            type: "advance",
            activity: before.journey.queue[0].action as Activity,
            months: 1,
          }
      : intent;
  const ritual =
    effective.type === "break"
      ? "break"
      : effective.type === "prepare"
        ? effective.kind
        : effective.type === "forge"
          ? "forge"
          : effective.type === "challenge" ||
              ((effective.type === "road" ||
                effective.type === "adventure" ||
                effective.type === "mist") &&
                ["challenge", "shelteredChallenge"].includes(effective.action))
            ? "challenge"
            : null;
  const changes: ActionReceipt["changes"] = [];
  const add = (label: string, a: number, b: number, lower = false) => {
    if (a !== b)
      changes.push({ label, before: a, after: b, good: lower ? b < a : b > a });
  };
  for (const [key, label] of Object.entries({
    stones: "灵石",
    herbs: "灵草",
    pills: "筑基丹",
    qi: "修为",
    foundation: "根基",
    mastery: "剑意",
    sense: "神识",
    study: "心得",
    injury: "伤势",
    limit: "寿元上限（月）",
  })) {
    add(
      label,
      before[key as "stones"],
      after[key as "stones"],
      key === "injury",
    );
  }
  add("道友信任", before.story.trust, after.story.trust);
  add("好感", before.social.affection, after.social.affection);
  add("宗门贡献", before.journey.contribution, after.journey.contribution);
  add("灵瓶品阶", before.journey.relics.vial, after.journey.relics.vial);
  add("灵剑品阶", before.journey.relics.sword, after.journey.relics.sword);
  // Find the retained log suffix even when the 180-entry ring is full.
  const same = (a: State["log"][number], b: State["log"][number]) =>
    a.month === b.month && a.text === b.text && a.kind === b.kind;
  let count = after.log.length;
  for (let i = 0; i < after.log.length; i++) {
    if (
      after.log
        .slice(i)
        .every((entry, j) => before.log[j] && same(entry, before.log[j]))
    ) {
      count = i;
      break;
    }
  }
  const entries = after.log.slice(0, count);
  const failed =
    effective.type === "break"
      ? after.realm === before.realm
      : effective.type === "challenge"
        ? after.journey.encounters[effective.place]?.outcome === "loss"
        : effective.type === "road" && ritual
          ? !after.adventure.road.passed
          : effective.type === "mist" && ritual
            ? after.adventure.mist.stage === before.adventure.mist.stage
            : effective.type === "adventure" && ritual
              ? after.adventure.step !== "home"
              : entries.some((entry) => entry.kind === "warning");
  const dead = after.status === "dead";
  let title =
    effective.type === "advance"
      ? `${queueActions[effective.activity]}完成`
      : "行动已完成";
  if (ritual === "break")
    title =
      after.realm > before.realm
        ? "筑基已成 · 道途新启"
        : "突破未成 · 经脉受损";
  if (ritual === "refine")
    title = after.pills > before.pills ? "丹成 · 筑基丹入囊" : "炼丹中断";
  if (ritual === "retreat") title = "出关 · 根基渐稳";
  if (ritual === "forge") title = "灵器炼成";
  if (ritual === "challenge")
    title = failed ? "暂退一步 · 整备再来" : "闯关告捷";
  if (dead) title = "寿元已尽 · 此行止步";
  const labels: Partial<Record<Intent["type"], string>> = {
    supplies: "补给已入囊",
    equip: "功法已装配",
    equipRelic: "灵器已装配",
    learn: "功法已习得",
    join: "拜入师门",
    duty: "师门事务完成",
    aid: "护持已应允",
    enqueue: "修行安排已加入",
    clearQueue: "修行安排已清空",
    choose: "你的选择已记下",
    explore: "探索有了进展",
  };
  if (!ritual && !dead && labels[effective.type])
    title = labels[effective.type]!;
  const cost =
    effective.type === "prepare"
      ? effective.kind === "refine"
        ? `投炉消耗：灵草 −${refineCost(before).herbs}，灵石 −${refineCost(before).stones}。下方为含月收入的实际净变化。`
        : "闭关消耗：灵石 −8。下方为含月收入的实际净变化。"
      : "下方为本次行动的实际净变化。";
  return enrichReceipt(before, after, intent, {
    title,
    ritual,
    tone: dead || failed ? "warning" : ritual ? "success" : "neutral",
    months: Math.max(0, after.month - before.month),
    changes,
    cost,
    notes: entries.slice(0, 4).map((entry) => entry.text),
    next: dead
      ? "确认后回看此世，选择轮回传承。"
      : after.pending || after.social.scene
        ? "有新的剧情在等你，确认后继续回应。"
        : ritual === "break"
          ? after.realm
            ? "境界已从炼气晋升筑基，炼气修为已转化为新境界（归零并非损失）。回到当前冒险，查看山外的新路。"
            : "先养伤、补回修为，再炼丹或闭关固本；准备好后可以再次突破。"
          : ritual === "refine"
            ? "丹药已收入行囊。修为满 360 后，可在突破时选择服用。"
            : ritual === "challenge" && failed
              ? "线索仍在。查看当前挑战提示，提升实力或寻求帮助后再来。"
              : "成果已自动保存，可以继续行动。",
  });
}
