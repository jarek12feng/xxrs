import {battleConclusion} from './battle-conclusion';
import { senseLimit } from "./spirit";
import { treasures, treasureIds } from "./treasures/catalog";
import { pactView } from "./secret-pact/view";
import { recognitionView, advancementChanges } from "./recognition/view";
import { foundationGoal } from "./foundation-journey/progression";
import { foundationBoard } from "./foundation-journey/view";
import { trialBoard } from "./world-ambition";
import {
  queueActions,
  refineCost,
  type Activity,
  type Intent,
  type State,
} from "./core";
import { expeditionGoal } from "./expedition/progression";
import { foundationPower } from "./foundation-journey/combat";
import { readiness } from "./combat/game";
import { routePayoff } from "./route-payoff";
import { growthComparison } from "./growth-feedback";
import { enrichReceipt } from "./journey-feedback";

import type { ActionProcess } from "./action-process";
import { milestoneFeedback, type MilestoneFeedback } from "./milestone-feedback";
export interface ActionReceipt {
  milestone?: MilestoneFeedback;
  equipment?: { id: string; stage: string };
  process?: ActionProcess;
  title: string;
  ritual:
    "break" | "refine" | "retreat" | "challenge" | "forge" | "duel" | null;
  unlocks?: string[];
  spotlight?: boolean;
  returnTo?: "relationship" | "world" | "gear" | "arena" | "sect";
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
  payoff?: string[];
  cost: string;
  next: string;
}

// A read-only presentation projection. No extra roll, command, or saved field.
function baseActionReceipt(
  before: State,
  after: State,
  intent: Intent,
): ActionReceipt | null {
  // Mail keeps its response beside the immutable letter, without replaying an old scene receipt.
  if (intent.type === "correspondence") return null;
  if (intent.type === "ascension") {
    if (intent.action !== "commit") return null;
    const result = actionReceipt(before, after, before.realm === 0 ? {type:"break",pill:true} : {type:"goldenCore",action:{kind:"break"}});
    if (result && before.ascension) {
      result.notes = [...before.ascension.history, ...result.notes];
      if (before.realm === 1) {
        result.title = after.realm === 2 ? "金丹已成 · 云壁之外" : after.pending ? "行功暂歇 · 先回应来信" : "凝丹未成 · 收势再备";
        result.spotlight = true;
        result.next = after.realm === 2 ? "以丹元护体独自越过云壁，踏上外海道途。" : "已保留灵地与历练成果，可养伤补药后再行功。";
      }
      if (after.realm > before.realm) {
        const a = before.realm ? foundationPower(before) : readiness(before), b = after.realm ? foundationPower(after) : readiness(after);
        result.payoff = [...(result.payoff ?? []), `同一套功法器物：基础伤害 ${a.damage} → ${b.damage}，护体 ${a.armor} → ${b.armor}。下一程仍按实际敌人与招式结算。`];
      }
    }
    return result;
  }
  if (
    intent.type === "expedition" ||
    before === after ||
    before.life !== after.life ||
    intent.type === "beginChapter"
  )
    return null;
  if (
    (intent.type === "artifactGrowth" && !!after.itemGrowth.golden.duel) ||
    (intent.type === "itemGrowth" && !!after.itemGrowth.trial) ||
    (intent.type === "spirit" && !!after.spirit.trial) ||
    (intent.type === "lizhao" && !!after.lizhao.duel) ||
    (intent.type === "nascentSoul" && !!(after.nascentSoul.trial || after.nascentSoul.attempt)) ||
    (intent.type === "conclave" && !!after.conclave.duel) ||
    (intent.type === "outerSea" && !!after.outerSea.duel) ||
    (intent.type === "foundationJourney" && !!after.foundationJourney.duel) ||
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
  add(
    "筑基修行",
    before.foundationJourney.cultivation,
    after.foundationJourney.cultivation,
  );
  add("神识上限", senseLimit(before.realm,before.spirit), senseLimit(after.realm,after.spirit));
  add("识海创伤", before.spirit.trauma, after.spirit.trauma, true);
  add("金丹修行", before.outerSea.cultivation, after.outerSea.cultivation);
  add("道友信任", before.story.trust, after.story.trust);
  add("好感", before.social.affection, after.social.affection);
  add("宗门贡献", before.journey.contribution, after.journey.contribution);
  add(
    "回春散",
    before.growth.medicines.healing,
    after.growth.medicines.healing,
  );
  add(
    "清心丹",
    before.growth.medicines.clarity,
    after.growth.medicines.clarity,
  );
  add("养神丹", before.growth.medicines.spirit, after.growth.medicines.spirit);
  add("护脉丹", before.workshop.ward, after.workshop.ward);
  add("玄铁料", before.workshop.iron, after.workshop.iron);
  for (const id of treasureIds) add(treasures[id].name, before.treasures.owned[id], after.treasures.owned[id]);
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
  if (ritual === "forge") title = failed ? "炼器中断" : "灵器炼成";
  if (ritual === "challenge")
    title = failed ? "暂退一步 · 整备再来" : "闯关告捷";
  if (dead) title = after.death && after.death.cause !== "lifespan" ? "身陨道止 · 此生落笔" : "寿元已尽 · 此行止步";
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
  if (effective.type === "workshop" && !dead)
    title = failed ? "制作中断 · 未扣材料" : "丹药与法器 · 准备完成";
  if (effective.type === "wayfaring" && !dead) title = after.pending ? "行程暂歇" : "御剑与行路";
  if (effective.type === "promote") title = "晋升外门 · 师门谢礼";
  if (after.realm > before.realm) {
    const qi = changes.find((c) => c.label === "修为");
    if (qi) {
      qi.label = "炼气修为转化";
      qi.good = true;
    }
  }
  if (effective.type === "trainTechnique") title = "功法研修完成";
  const growthNotes = [
    "outerSea",
    "conclave",
    "equip",
    "equipRelic",
    "trainTechnique",
    "forge",
    "workshop",
  ].includes(effective.type) || before.injury !== after.injury || before.realm !== after.realm || before.foundationJourney.cultivation !== after.foundationJourney.cultivation
    ? growthComparison(before, after)
    : [];
  const newlyKnown = after.journey.known.filter((id) => !before.journey.known.includes(id));
  if (newlyKnown.some((id) => after.journey.main !== id && after.journey.support !== id))
    growthNotes.push("新功法已习得；尚未装配的功法不会改变当前能力，可到功法页比较后装配。");
  if ((["vial", "sword"] as const).some((id) => after.journey.relics[id] > before.journey.relics[id] && after.journey.equipped !== id))
    growthNotes.push("新灵器或品阶已入袋；尚未装备，不提供装备加成。可到储物袋比较后装备。");
  const advancement = advancementChanges(before, after);
  if (advancement.length) {
    if (before.realm === after.realm && !dead) title = advancement[0]!;
    growthNotes.push(...advancement);
  }
  if(effective.type === "itemGrowth" && !dead) { title=after.itemGrowth.ring>before.itemGrowth.ring?"栖尘戒 · 空间已开":effective.action.kind==="reforge"?"旧器重铸":"沉井遗物"; growthNotes.push(after.itemGrowth.last); }
  if(effective.type === "spirit" && !dead) { title=after.spirit.trauma>before.spirit.trauma?"识海受创 · 调息再来":effective.action.kind==="study"?"分念诀已通 · 识海拓展":effective.action.kind==="refine"?"玉髓炼化 · 神识破限":"炼神行旅"; growthNotes.push(after.spirit.last); }
  if(effective.type === "revisit" && !dead){ title="旧地回访 · 按约补给"; growthNotes.push(after.log[0]?.text ?? ""); }
  if(effective.type === "goldenStory" && !dead){ title="外海道途 · 交谈与亲历"; growthNotes.push(after.goldenStory.last); }
  if(effective.type === "lizhao" && !dead){ title=after.lizhao.cleared&&!before.lizhao.cleared?"离照取药 · 机缘在手":"离照行旅"; growthNotes.push(after.lizhao.last); }
  if(effective.type === "nascentSoul" && !dead){ title=after.realm>before.realm?"元婴已成":after.conclave.stage>before.conclave.stage?"金丹圆满":"凝婴道途"; growthNotes.push(after.nascentSoul.last); }
  if(effective.type === "conclave" && !dead){title=after.conclave.stage>before.conclave.stage?"丹元凝成 · 境界精进":after.conclave.depth>before.conclave.depth?"归潮取宝":"诸宗会谷";growthNotes.push(after.conclave.last);}
  if (effective.type === "outerSea" && !dead) {title=after.outerSea.cleared>before.outerSea.cleared?"遗迹告捷 · 机缘入手":"外海行旅";growthNotes.push(after.outerSea.last);}
  if (effective.type === "treasure" && !dead) { title = failed ? "宝物行程中断" : "宝物与拍卖会"; growthNotes.push(after.treasures.last); }
  if (effective.type === "secretPact" && !dead) title = "照玄之约";
  if (effective.type === "recognition" && !dead) title = effective.action.kind === "inner" ? "回山受录" : effective.action.kind === "appoint" ? "受托任职" : effective.action.kind === "resign" ? "交还行牌" : effective.action.kind === "defer" ? "暂缓任用" : "委托归来";
  if (after.social.arena.wins > before.social.arena.wins) {
    title = trialBoard(after).title;
    growthNotes.push(trialBoard(after).response);
  }
  const ranked =
    after.foundationJourney.board.wins.length >
    before.foundationJourney.board.wins.length;
  const journeyWin =
    after.foundationJourney.won.length > before.foundationJourney.won.length;
  const journeyLoss =
    effective.type === "foundationJourney" &&
    effective.action.kind === "move" &&
    !!before.foundationJourney.duel &&
    !after.foundationJourney.duel &&
    !journeyWin;
  if (journeyLoss) title = "本场败退 · 整备再来";
  if (ranked) {
    title = `筑基试剑榜 · ${foundationBoard(after).title}`;
  } else if (journeyWin) title = "挑战告捷 · 机缘入囊";
  const completedPreparation =
    !before.foundationJourney.condensation &&
    after.foundationJourney.condensation;
  const inherited =
    before.foundationJourney.inheritance !==
    after.foundationJourney.inheritance;
  if (completedPreparation) title = "周天贯流已成 · 去试长风归流";
  const chapterComplete =
    !before.foundationJourney.epilogue && after.foundationJourney.epilogue;
  if (chapterComplete) title = "长风归山 · 筑基篇终";
  if (inherited) title = "沉井传承领悟 · 装配后亲手试用";
  const cost =
    effective.type === "prepare"
      ? effective.kind === "refine"
        ? `投炉消耗：灵草 −${refineCost(before).herbs}，灵石 −${refineCost(before).stones}。所得所耗见下方。`
        : "闭关消耗：灵石 −8。所得所耗见下方。"
      : "本次得失";
  const payoff = routePayoff(before, after, intent);
  return enrichReceipt(before, after, intent, {
    title,
    returnTo:
      effective.type === "secretPact" ? "world" : effective.type === "recognition" ? "sect" : effective.type === "foundationJourney"
        ? before.foundationJourney.duel?.id.startsWith("rank")
          ? "arena"
          : "world"
        : undefined,
    spotlight:
      chapterComplete ||
      completedPreparation ||
      inherited ||
      ranked ||
      journeyWin ||
      effective.type === "secretPact" ||
      effective.type === "recognition" ||
      effective.type === "promote" ||
      (effective.type === "choose" &&
        (before.pending?.kind === "relic" || !!before.social.scene)) ||
      (effective.type === "road" &&
        ["healPass", "cutPass", "restorePass"].includes(effective.action)) ||
      (effective.type === "mist" &&
        ["read", "illuminate"].includes(effective.action)),
    ritual,
    tone:
      dead || failed || journeyLoss
        ? "warning"
        : ritual || journeyWin
          ? "success"
          : "neutral",
    months: Math.max(0, after.month - before.month),
    changes,
    cost,
    payoff,
    notes: [
      ...(before.realm === 0 && after.realm === 1
        ? [
            `筑基护体：青嶂交锋减伤 ${readiness(before).armor} → ${readiness(after).armor}，基础伤害 ${readiness(before).damage} → ${readiness(after).damage}（招式另计）。`,
          ]
        : []),
      ...payoff,
      ...growthNotes,
      ...entries.slice(0, 4).map((entry) => entry.text),
    ],
    next: effective.type === "secretPact" && !dead ? pactView(after).next : effective.type === "recognition" && !dead ? recognitionView(after).next : ranked
      ? foundationBoard(after).next
      : effective.type === "foundationJourney" && !dead
        ? foundationGoal(after)
        : dead
          ? "确认后回看修行履历，可读取存档或另启新程。"
          : after.pending || after.social.scene
            ? "有新的剧情在等你，确认后继续回应。"
            : ritual === "break"
              ? after.realm
                ? `境界已从炼气晋升筑基，炼气修为已转化为新境界（归零并非损失）。${expeditionGoal(after) || "功法通达与灵器精炼已开放，回到当前行路查看后续目标。"}`
                : "先养伤、补回修为，再炼丹或闭关固本；准备好后可以再次突破。"
              : ritual === "refine"
                ? failed
                  ? "材料仍在，处理眼前事件后可重新安排炼制。"
                  : "丹药已收入行囊。修为满 360 后可叩关，每次必消耗一枚；失败后可依丹方补炼。"
                : ritual === "challenge" && failed
                  ? "线索仍在。查看当前挑战提示，提升实力或寻求帮助后再来。"
                  : "成果已自动保存，可以继续行动。",
  });
}

export function actionReceipt(before:State,after:State,intent:Intent):ActionReceipt|null {
  const battle=battleConclusion(before,after,intent);
  const receipt=baseActionReceipt(before,after,intent);
  if(battle){
    const changes:ActionReceipt['changes']=[];
    for(const [key,label] of [['stones','灵石'],['herbs','灵草'],['injury','伤势'],['qi','修为']] as const){
      if(before[key]!==after[key])changes.push({label,before:before[key],after:after[key],good:key==='injury'?after[key]<before[key]:after[key]>before[key]});
    }
    return {...receipt,title:receipt?.title && receipt.title!=='行动已完成'?`${battle.title} · ${receipt.title}`:battle.title,tone:battle.tone,ritual:receipt?.ritual??null,spotlight:true,months:after.month-before.month,changes:receipt?.changes?.length?receipt.changes:changes,notes:[battle.body,...(receipt?.notes??[])],cost:receipt?.cost||'本场实际得失',next:receipt?.next||battle.next};
  }
  if(receipt && after.qiJourney.cultivation.work?.kind==='alchemy' && !before.qiJourney.cultivation.work){
    receipt.title='主辅药已入炉 · 请亲手掌火';receipt.ritual=null;receipt.process=undefined;receipt.spotlight=false;receipt.notes=[after.qiJourney.cultivation.last];receipt.next='进入丹炉现场，调节火候、析药、调和与成丹。';
  }
  if(receipt && before.qiJourney.cultivation.work && !after.qiJourney.cultivation.work){
    receipt.title=after.crafted>before.crafted?'筑基丹 · 开炉成丹':after.qiJourney.cultivation.relic&&!before.qiJourney.cultivation.relic?'遗府封纹 · 破禁成功':after.qiJourney.cultivation.middle&&!before.qiJourney.cultivation.middle?'炼气中期 · 小周天贯通':after.qiJourney.cultivation.roots>before.qiJourney.cultivation.roots?'玉髓芝已收入药匣':after.journey.duties>before.journey.duties?'师门委托 · 验收完成':'收势退回';
    receipt.spotlight=true;receipt.notes=[after.qiJourney.cultivation.last];
  }
  if(receipt && after.month>before.month && intent.type==='advance'){
    const span=after.month-before.month;
    const age=(n:number)=>`${Math.floor(n/12)}岁${n%12?`又${n%12}月`:''}`;
    const season=(month:number)=>['春','夏','秋','冬'][Math.floor((month%12)/3)];
    receipt.notes.unshift(`山中${season(before.month)}去${season(after.month)}来，实际过去${span>=12?`${Math.floor(span/12)}年`:''}${span%12?`${span%12}个月`:''}。年龄 ${age(before.age)} → ${age(after.age)}。`);
  }
  if (receipt) {
    receipt.milestone = milestoneFeedback(before, after);
    if (receipt.milestone) receipt.spotlight = true;
  }
  return receipt;
}
