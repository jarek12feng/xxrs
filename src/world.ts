import { freshEstateLife, validEstateLife, type EstateLife } from "./estate-life/state";
import { runEstateLife, type EstateAction } from "./estate-life/rules";
import { monthlyWorkIncome } from "./preparation-rates";
import {freshQiCultivation,validQiCultivation} from './qi-cultivation/state';
import {isCultivationAction,cultivationActive,runCultivation} from './qi-cultivation/rules';
import { guidanceNotes } from './player-guidance';
import { freshLegacyMaterialPractice, validLegacyMaterialPractice } from './golden-story/legacy-material-practice';
import { validDeath, type DeathRecord } from './mortality';
import { upgradeMaterialPractice, validMaterialPractice } from './golden-story/material-practice';
import { freshSpiritPractice, validSpiritPractice } from "./golden-story/spirit-practice";
import { upgradeCrossing, validCrossing } from "./nascent-soul/crossing";
import { freshFriendJourney, validFriendJourney, settleFriendJourney, type FriendJourney } from "./friend-journey";
import { freshTideSurvey,validTideSurvey,runTideSurvey,type TideSurvey,type TideSurveyAction } from "./tide-survey";
import { deliverWorldCalendar } from "./correspondence/calendar";
import {runRevisit,type RevisitAction} from "./world-revisits/rules";
import {freshReunion, validReunion} from './golden-reunion/state';
import { freshAssay, upgradeAssay, validAssay } from "./lizhao/assay";
import { freshCorrespondence, validCorrespondence, type Correspondence } from "./correspondence/state";
import { deliverMessages, runCorrespondence, type CorrespondenceAction } from "./correspondence/rules";
import { validAuctions, upgradeAuctions } from "./auction/state";
import { freshArtifactGrowth, validArtifactGrowth } from "./artifact-growth/state";
import { runArtifactGrowth, validArtifactState, type ArtifactAction } from "./artifact-growth/rules";
import { freshItemGrowth, type ItemGrowth } from "./item-growth/state";
import { runItemGrowth, validItemGrowth, type ItemGrowthAction } from "./item-growth/rules";
import { joinError, hasCultivationKit, grantKit, isInitiationAction } from './initiation/rules';
import { freshInitiation, validInitiation } from './initiation/state';
import { freshCovenant } from './nascent-soul/covenant';
import { freshSpirit, senseLimit, type SpiritState } from "./spirit";
import { runSpirit, validSpirit, type SpiritAction } from "./spirit/rules";
import {freshThunderPath} from "./nascent-soul/thunder-state";
import { freshGoldenStory, validGoldenStory, type GoldenStory } from "./golden-story/state";
import { runGoldenStory, type GoldenStoryAction } from "./golden-story/rules";
import { freshLizhao, validLizhao, type Lizhao } from "./lizhao/state";
import { runLizhao, lizhaoActivity, lizhaoGoal, type LizhaoAction } from "./lizhao/rules";
import { freshNascentSoul, validNascentSoul, type NascentSoul } from "./nascent-soul/state";
import { runNascent, nascentActive, nascentGoal, type NascentAction } from "./nascent-soul/rules";
import { freshQiNarrative } from "./qi-journey/narrative-state";
import { qiNarrativeActive } from "./qi-journey/narrative";
import { runAscension, type AscensionAction } from "./ascension/rules";
import { validAscension, type Ascension } from "./ascension/state";
import { settleResources } from "./economy";
import { previewEncounter, resolveEncounter } from "./combat";
import { evaluateEquipment, applyEquipmentChange } from "./equipment";
import { combatSense } from "./spirit";
import { equipmentControl, artifactReady } from "./equipment";
import { SAVE_VERSION } from './save-version';
import { inlandTravel, routeBetween } from './wayfaring/routes';
import { travelSpeeds } from './wayfaring/geography';
import { isPassageContinuation } from "./wayfaring/passage";
import { freshWayfaring, validWayfaring, type Wayfaring } from "./wayfaring/state";
import { runWayfaring, type WayfaringAction } from "./wayfaring/rules";
import { freshConclave, validConclave, goldenCap, goldenBlock, type Conclave } from "./conclave/state";
import { runConclave, conclaveActive, type ConclaveAction } from "./conclave/rules";
import {freshOuterSea, validOuterSea, type OuterSea} from "./outer-sea/state";
import {runSea,seaGoal,updateSeaCalendar,type SeaAction} from "./outer-sea/rules";
import { freshGoldenCore, validGoldenCore, type GoldenCore } from "./golden-core/state";
import { runGolden, goldenGoal, type GoldenAction } from "./golden-core/rules";
import { freshSectContest, validSectContest, type SectContest } from "./sect-contest/state";
import { runContest, discoverContest, updateContestCalendar, type ContestAction } from "./sect-contest/rules";
import { freshTreasures, validTreasures, type Treasures } from "./treasures/state";
import { runTreasure, isEquipmentAction, type TreasureAction } from "./treasures/rules";
import { freshLearning, validLearning, runLearning, type LearningChoice } from "./learning";
import { freshSecretPact, validSecretPact, upgradeSecretPact, pactActivity, type SecretPact } from "./secret-pact/state";
import { runPact, type PactAction } from "./secret-pact/rules";
import { freshRecognition, validRecognition, type Recognition } from "./recognition/state";
import { runRecognition, type RecognitionAction } from "./recognition/rules";
import { cultivationMonth, incidentalQiGain } from "./progression";
import { freshHeroine } from "./foundation-journey/heroine";
import { foundationCap, foundationBlock, freshFoundationGrowth } from "./foundation-journey/growth-state";
import { freshWorkshop, validWorkshop, type Workshop } from "./workshop/state";
import { runWorkshop, workshopQuote, type WorkshopCommand } from "./workshop/rules";
import {
  freshQiJourney,
  validQiJourney,
  qiCap,
  runQiJourney,
  qiGoal,
  type QiJourney,
  type QiAction,
} from "./qi-journey/rules";
import { cultivationMonthlyGain } from "./progression";
import {
  freshFoundationJourney,
  type FoundationJourney,
  type JourneyAction,
} from "./foundation-journey/state";
import {
  runFoundationJourney,
  validFoundationJourney,
} from "./foundation-journey/rules";
import {
  foundationGoal,
  companionPresent,
} from "./foundation-journey/progression";
import {
  freshCompanionship,
  runCompanionship,
  validCompanionship,
  type Companionship,
  type CompanionAction,
} from "./companionship/rules";
import {
  freshGrowth,
  medicines,
  validGrowth,
  runGrowth,
  type Growth,
  type GrowthCommand,
} from "./growth";
export * from "./growth";
import { expeditionGoal, familyQuestGoal } from "./expedition/progression";
import {
  freshExpedition,
  validExpedition,
  runExpedition,
  type Expedition,
  type ExpeditionAction,
} from "./expedition/rules";
import { validAdventureV10 } from "./legacy-adventure-v10";
import { validRoadV9 } from "./legacy-road-v9";
import * as chapter from "./chapter";
import {
  freshMist,
  validMist,
  runMist,
  mistGoal,
  type MistAction,
} from "./mist";
export * from "./mist";
import {
  freshRoad,
  validRoad,
  runRoad,
  roadGoal,
  type RoadAction,
} from "./road";
export * from "./road";
import { validState as validV4 } from "./legacy-v4";
import {
  freshSocial,
  validSocial,
  dispatchSocial,
  socialCommands,
  heartEvent,
  type SocialState,
  type SocialCommand,
  type Gender,
} from "./social";
export * from "./chapter";
export * from "./social";

import { techniques, canGather, canTrain, applyTechnique, techniqueChangeError, techniqueActivityEffect, grantTechnique } from "./techniques";
import type { Technique } from "./techniques";
export { techniques, canGather, canTrain, type Technique } from "./techniques";
export type Branch = "none" | "dan" | "jian";
export type Place = "valley" | "peak" | "sea";
export type TrialPlace = "peak" | "sea";
import { relics, type Relic } from "./equipment";
export { relics, type Relic } from "./equipment";
export const opponents = {
  guardian: {
    name: "石角 · 守境妖修",
    description:
      "他守着族人的药圃，误以为闯入者又来盗药。你可以闯过他的瘴阵，也可以带药与心得交涉。",
    base: 18,
  },
  raider: {
    name: "乌灯客 · 夺宝邪修",
    description:
      "他盯上了你的旧图，在必经之路布下劫阵。退回准备不会丢失线索，盲目硬闯则可能负伤。",
    base: 14,
  },
} as const;
export interface Encounter {
  kind: keyof typeof opponents;
  attempts: number;
  aid: "none" | "mentor" | "luchi";
  passed: boolean;
  lastRoll: number;
  lastChance: number;
  outcome: "none" | "win" | "loss" | "peace";
}
export type QueueAction = chapter.Activity | "refine";
export const queueActions: Record<QueueAction, string> = {
  cultivate: "吐纳",
  gather: "采药",
  train: "历练",
  work: "劳作",
  rest: "养伤",
  meditate: "凝神",
  study: "研读",
  refine: "温养丹液（六月，随后亲手掌火）",
};
export const places = {
  valley: {
    name: "回春谷",
    goal: "找到失踪采药人的旧营地",
    reward: "辨草录 · 雾岭线索",
    realm: 0,
  },
  peak: {
    name: "雾岭古道",
    goal: "循药篓刻痕寻找山中幸存者",
    reward: "照夜篇 · 雾海航图",
    realm: 1,
  },
  sea: {
    name: "雾海孤灯",
    goal: "查明那盏为归人点亮的灯",
    reward: "父亲来信 · 送信归家",
    realm: 1,
  },
} as const;
export interface Journey {
  learning: { book: boolean; relic: boolean };
  branch: Branch;
  rank: 0 | 1;
  contribution: number;
  duties: number;
  mentor: boolean;
  known: Technique[];
  main: Technique | null;
  support: Technique | null;
  maps: Record<Place, number>;
  approach: "none" | "rescue" | "trace";
  settled: boolean;
  queue: { action: QueueAction; remaining: number }[];
  relics: Record<Relic, number>;
  equipped: Relic | null;
  encounters: Record<TrialPlace, Encounter | null>;
}
import {
  freshAdventure,
  validAdventure,
  runAdventure,
  type Adventure,
  type AdventureAction,
} from "./adventure";
export * from "./adventure";
export interface State extends Omit<chapter.State, "version"> {
  version: typeof SAVE_VERSION;
  death: DeathRecord | null;
  friendJourney: FriendJourney;
  estateLife: EstateLife;
  tideSurvey: TideSurvey;
  correspondence: Correspondence;
  spirit: SpiritState;
  itemGrowth: ItemGrowth;
  goldenStory: GoldenStory;
  lizhao: Lizhao;
  nascentSoul: NascentSoul;
  ascension: Ascension | null;
  wayfaring: Wayfaring;
  conclave: Conclave;
  outerSea: OuterSea;
  goldenCore: GoldenCore;
  sectContest: SectContest;
  treasures: Treasures;
  secretPact: SecretPact;
  recognition: Recognition;
  cultivationRemainder: number;
  workshop: Workshop;
  qiJourney: QiJourney;
  foundationJourney: FoundationJourney;
  companionship: Companionship;
  growth: Growth;
  expedition: Expedition;
  adventure: Adventure;
  journey: Journey;
  social: SocialState;
}
export type Command =
  | {id:string;type:"estateLife";action:EstateAction}
  | {id:string;type:"tideSurvey";action:TideSurveyAction}
  | {id:string;type:"revisit";action:RevisitAction}
  | { id: string; type: "correspondence"; action: CorrespondenceAction }
  | {id:string;type:"artifactGrowth";action:ArtifactAction}
  | {id:string;type:"itemGrowth";action:ItemGrowthAction}
  | {id:string;type:"spirit";action:SpiritAction}
  | {id:string;type:"goldenStory";action:GoldenStoryAction}
  | {id:string;type:"lizhao";action:LizhaoAction}
  | {id:string;type:"nascentSoul";action:NascentAction}
  | { id:string; type:"ascension"; action:AscensionAction }
  | {id:string;type:"wayfaring";action:WayfaringAction}
  | {id:string;type:"conclave";action:ConclaveAction}
  | {id:string;type:"outerSea";action:SeaAction}
  | { id: string; type: "goldenCore"; action: GoldenAction }
  | { id: string; type: "sectContest"; action: ContestAction }
  | { id: string; type: "treasure"; action: TreasureAction }
  | { id: string; type: "learning"; choice: LearningChoice; equip?: boolean }
  | {id:string; type:"secretPact"; action:PactAction}
  | { id: string; type: "recognition"; action: RecognitionAction }
  | { id: string; type: "qiJourney"; action: QiAction }
  | { id: string; type: "foundationJourney"; action: JourneyAction }
  | { id: string; type: "companionship"; action: CompanionAction }
  | WorkshopCommand
  | GrowthCommand
  | { id: string; type: "expedition"; action: ExpeditionAction }
  | chapter.Command
  | SocialCommand
  | { id: string; type: "mist"; action: MistAction }
  | { id: string; type: "road"; action: RoadAction }
  | { id: string; type: "adventure"; action: AdventureAction }
  | { id: string; type: "join"; branch: Exclude<Branch, "none"> }
  | { id: string; type: "duty"; duty: "herbs" | "watch" | "copy" }
  | { id: string; type: "promote" }
  | { id: string; type: "supplies" }
  | { id: string; type: "forge" | "equipRelic"; relic: Relic }
  | { id: string; type: "aid"; place: TrialPlace; helper: "mentor" | "luchi" }
  | {
      id: string;
      type: "challenge";
      place: TrialPlace;
      mode: "fight" | "parley";
    }
  | { id: string; type: "mentor"; answer: "care" | "seek" }
  | { id: string; type: "enqueue"; action: QueueAction; repeat: number }
  | { id: string; type: "clearQueue" | "queueTick" }
  | { id: string; type: "learn"; technique: Technique }
  | { id: string; type: "equip"; technique: Technique }
  | { id: string; type: "explore"; place: Place; approach?: "rescue" | "trace" }
  | { id: string; type: "retire" | "continue" };
export type Intent = Command extends infer C
  ? C extends Command
    ? Omit<C, "id">
    : never
  : never;
const fresh = (): Journey => ({
  learning: freshLearning(),
  branch: "none",
  rank: 0,
  contribution: 0,
  duties: 0,
  mentor: false,
  known: [],
  main: null,
  support: null,
  maps: { valley: 0, peak: 0, sea: 0 },
  approach: "none",
  settled: false,
  queue: [],
  relics: { vial: 0, sword: 0 },
  equipped: null,
  encounters: { peak: null, sea: null },
});
function base(s: State): chapter.State {
  const {
    friendJourney: _friendJourney,
    estateLife: _estateLife,
    tideSurvey: _tideSurvey,
    correspondence: _correspondence,
    itemGrowth: _itemGrowth,
    wayfaring: _wayfaring,
    journey: _,
    social: __,
    adventure: ___,
    expedition: ____,
    growth: _____,
    companionship: ______,
    foundationJourney: _______,
    qiJourney: ________,
    workshop: _________,
    cultivationRemainder: __________,
    recognition: ___________,
    secretPact: ____________,
    treasures: _____________,
    sectContest: ______________,
    goldenCore: _______________,
    outerSea: ________________,
    conclave: _________________,
    ...rest
  } = s;
  return { ...rest, version: 3 };
}
function lift(
  s: chapter.State,
  journey = fresh(),
  social = freshSocial(),
  adventure = freshAdventure(true),
): State {
  return {
    ...s,
    version: SAVE_VERSION,
    death: null,
    friendJourney: freshFriendJourney(),
    estateLife: freshEstateLife(),
    tideSurvey: freshTideSurvey(),
    correspondence: freshCorrespondence(),
    itemGrowth: freshItemGrowth(),
    spirit: s.spirit ? structuredClone(s.spirit) : freshSpirit(),
    goldenStory: freshGoldenStory(),
    lizhao: freshLizhao(),
    nascentSoul: freshNascentSoul(),
    ascension: null,
    wayfaring: freshWayfaring(),
    conclave: freshConclave(),
    outerSea: freshOuterSea(),
    goldenCore: freshGoldenCore(),
    sectContest: freshSectContest(),
    treasures: freshTreasures(),
    secretPact: freshSecretPact(),
    recognition: freshRecognition(),
    cultivationRemainder: 0,
    workshop: freshWorkshop(),
    qiJourney: freshQiJourney(),
    foundationJourney: freshFoundationJourney(),
    companionship: freshCompanionship(),
    growth: freshGrowth(),
    journey,
    social,
    adventure,
    expedition: freshExpedition(),
  };
}
export function createGame(
  name: string,
  path: chapter.Path,
  seed = 12345,
  aptitude: chapter.Aptitude = "insightful",
  gender: Gender | null = null,
): State {
  const initial=chapter.createGame(name,path,seed,aptitude);
  return lift(
    {...initial,stones:0,story:{...initial.story,deadline:120}},
    fresh(),
    freshSocial(gender),
    freshAdventure(),
  );
}
export const eventView = (s: State) => {
  const event = s.pending ? chapter.eventView(base(s)) : heartEvent(s);
  if (event && s.pending?.kind === "meeting" && s.adventure.step === "done")
    return {
      ...event,
      title: "渡口再逢 · 未寄的家书",
      body:
        "救回药工后，你再次遇见陆迟。这次他提起了自己的家事，托你寄一封家书，并邀你在第十年一起寻找青石遗府的筑基机缘。" +
        (s.inherited === "bond" ? "他的旧剑又唤起了你前世的记忆。" : ""),
    };
  return event;
};
export const activeEventId = (s: State) =>
  s.pending?.id ?? s.social.scene?.id ?? "";
export const breakthroughDetails = (s: State, pill = false) =>
  chapter.breakthroughDetails(base(s), pill);
export const refineCost = (s: State) => chapter.refineCost(base(s));
export const replayHints = (s: State) => chapter.replayHints(base(s));
export const actionError = (s: State, a: chapter.Activity) =>
  s.qiJourney.cultivation.work ? "先完成或退出眼前行功与事务" :
  nascentActive(s) || s.lizhao.duel ? "先结束眼前的试炼" :
  s.realm === 3 && a === "cultivate" ? "元婴已成，先安顿出关与大典，亲自验证新得神通。" :
  s.conclave.duel || s.conclave.location === "vault" ? "先结束诸宗交锋或撤出秘境" :
  s.outerSea.location === "ruins" ? "先结束遗迹探索或撤回古渡" :
  s.goldenCore.expedition !== "idle" ? "先结束药圃探索或撤回" :
  s.realm === 2 && a === "cultivate" ? (s.status !== "alive" || s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel || s.foundationJourney.duel ? "先处理眼前事件或结束交锋" : !s.outerSea.met ? "先赴外海古渡，与当地道友相识" : s.outerSea.cultivation >= goldenCap(s) ? goldenBlock(s) : "") :
  s.sectContest.duel ? "先结束内比斗法" :
  s.realm === 1 && s.sectContest.stage === "invited" && s.sectContest.reminded && s.month < s.sectContest.starts + 12 ? "内比传来开场消息，请先决定赴会或暂不参加" :
  a === "gather" && !canGather(s) ? "先学长春诀或辨草录，再去采药"
    : a === "train" && !canTrain(s) ? "先学听松剑经，再历练剑意"
    : s.qiJourney.node
    ? "先结束秘境历练或撤回"
    : a === "cultivate" && !s.realm && s.qi >= qiCap(s)
      ? !s.qiJourney.cultivation.middle ? "灵息已满，回洞府贯通小周天，方可晋入中期" : "修为已抵瓶颈，先去历练取得晋升材料"
      : s.foundationJourney.duel
        ? "先结束筑基交锋"
        : a === "cultivate" && s.realm === 1
          ? s.status !== "alive" ||
            s.pending ||
            s.social.scene ||
            s.social.arena.duel ||
            s.expedition.duel
            ? "先处理眼前事件或结束交锋"
            : s.foundationJourney.cultivation >= foundationCap(s)
              ? foundationBlock(s)
              : ""
          : chapter.actionError(base(s), a, true);
export const preparationError = (s: State, k: "refine" | "retreat") => {
  if (k === "refine") return workshopQuote(s, { product: "foundation", method: "craft" }).error;
  const error = chapter.preparationError(base(s), k);
  return error === "先去渡口相识" && s.adventure.step === "done"
    ? "先修行至第三月，与陆迟再叙旧约"
    : error;
};
export const cultivationGain = (s: State) => cultivationMonthlyGain(s);
function log(s: State, text: string) {
  s.log.unshift({ month: s.month, text, kind: "story" });
  s.log = s.log.slice(0, 180);
}
function learn(s: State, t: Technique) {
  if (grantTechnique(s, t)) {
    log(s, `领悟「${techniques[t].name}」。可在功法栏装配。`);
  } else {
    s.stones += 12;
    log(s, `已掌握「${techniques[t].name}」，本次谢礼改为研修灵石 +12。`);
  }
}
function roll(s: State) {
  let x = s.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.seed = x >>> 0 || 1;
  return s.seed / 4294967296;
}
export function encounterDescription(s: State, kind: keyof typeof opponents) {
  return kind === "guardian" && s.adventure.mist.garden
    ? "石角认出救过药圃的你，已愿意为药队开放通路。可凭旧交和平通行，不必再送药证明来意。"
    : opponents[kind].description;
}
export function challengeDetails(s: State, p: TrialPlace) {
  const e = s.journey.encounters[p];
  if (!e) return null;
  const gear = evaluateEquipment(s, { kind: "challenge", opponent: e.kind });
  return previewEncounter({
    base: opponents[e.kind].base,
    root: s.root, sense: combatSense(s.sense), foundation: s.foundation,
    mastery: s.mastery, study: s.study,
    mainEquipped: !!s.journey.main, supportEquipped: !!s.journey.support,
    equipmentChance: gear.chance, injuryReduction: gear.injuryReduction,
    aid: e.aid !== "none", injury: s.injury, sea: p === "sea",
  });
}
export function forgeError(s: State, r: Relic) {
  if (!Object.hasOwn(relics, r)) return "未知灵器";
  return workshopQuote(s, { product: r, method: "craft" }).error;
}
export function aidError(s: State, p: TrialPlace, helper: "mentor" | "luchi") {
  const e = s.journey.encounters[p];
  if (!e || e.passed || s.journey.maps[p] !== 1) return "尚无待应对的挑战";
  if (e.aid !== "none") return "已有一位同行者，不叠加援助";
  if (helper === "mentor" && !s.journey.mentor) return "需先获得执事认可";
  if (
    helper === "luchi" &&
    (s.story.luchi !== "foundation" || s.story.trust < 3)
  )
    return "需陆迟已筑基且信任至少 3";
  return "";
}
export function nextGoal(s: State) {
  return [nextStageGoal(s), ...guidanceNotes(s)].filter(Boolean).join(" ");
}
function nextStageGoal(s: State) {
  if (s.realm === 3 || (s.realm === 2 && s.conclave.stage >= 2 && !lizhaoActivity(s))) return nascentGoal(s);
  if (lizhaoActivity(s)) return lizhaoGoal(s);
  if(s.realm===2 && s.goldenCore.farShore) return seaGoal(s);
  if(s.status === "alive" && !s.pending && (s.realm === 2 || s.foundationJourney.epilogue || s.goldenCore.expedition !== "idle")) return goldenGoal(s);
  if (s.realm === 1 && s.adventure.road.surveyed) return foundationGoal(s);
  if (s.status !== "alive" || s.pending) return chapter.nextGoal(base(s));
  if (s.social.arena.duel)
    return "擂台交锋中：查看对手意图，选择应对方式，或主动认负。时间暂停。";
  if (s.social.scene) return "眼前的人在等你的回应，完成对话后再继续修行。";
  const qiTask = qiGoal(s);
  if (
    qiTask &&
    s.adventure.step === "done" &&
    !s.pending &&
    s.qi >= 120 &&
    s.qiJourney.gates < 2
  )
    return qiTask;
  const quest = expeditionGoal(s);
  if (quest) return quest;
  if (s.adventure.mist.stage !== "dormant" && !s.adventure.mist.revisited)
    return mistGoal(s);
  if (s.adventure.road.map && !s.adventure.road.surveyed) return roadGoal(s);
  if (s.realm === 1) return foundationGoal(s);
  if (s.story.stage === "unmet" && s.adventure.step === "done")
    return "药工已平安归家。第三个月，陆迟会在渡口等你；其间可自行修炼或休整。";
  if (s.realm === 0 || s.story.stage !== "resolved")
    return chapter.nextGoal(base(s));
  if (s.journey.maps.sea < 3) return familyQuestGoal(s);
  return `家书已送达。${s.social.arena.wins < 3 ? "可前往听松擂台完成剩余对手；" : "听松擂台已完成；"}${!s.adventure.mist.garden || !s.adventure.mist.station ? "可补探药圃或废驿；" : ""}也可回看人物档案、回顾修行履历。`;
}
export function explorationError(s: State, p: Place) {
  if (!Object.hasOwn(places, p)) return "未知区域";
  if (s.journey.maps[p] >= 3) return "此地故事已完成";
  if (s.story.stage === "unmet") return "先完成渡口初逢";
  if (s.realm < places[p].realm) return "需先突破筑基";
  if (p !== "valley" && s.story.stage !== "resolved") return "先了结渡口旧约";
  if (p === "peak" && s.journey.maps.valley < 3) return "先寻找回春谷的刻痕";
  if (p === "peak" && s.journey.rank !== 1 && s.recognition.innerMonth === null && !(s.sense >= 8 && s.study >= 2))
    return "需外门资格，或神识 8、心得 2（散修识路）";
  if (p === "sea" && s.journey.maps.peak < 3) return "需雾岭航图";
  if (s.injury > 2) return "伤势需降至 2 以下或等于 2";
  return "";
}
export function promotionError(s: State) {
  if (s.journey.branch === "none") return "尚未加入宗门";
  if (s.recognition.innerMonth !== null) return "已受录内门";
  if (s.journey.rank === 1) return "已是外门弟子";
  if (s.journey.duties < 3 || s.journey.contribution < 6 || s.study < 2)
    return "需要亲历 3 次事务、贡献 6、心得 2";
  if (!s.journey.mentor) return "需先与执事谈一谈为何修行";
  return "";
}
function normalize(n: State, old: State) {
  n.death = n.life === old.life ? structuredClone(old.death) : null;
  n.friendJourney = n.life === old.life ? structuredClone(old.friendJourney) : freshFriendJourney();
  n.estateLife = n.life === old.life ? structuredClone(old.estateLife) : freshEstateLife();
  n.tideSurvey = n.life === old.life ? structuredClone(old.tideSurvey) : freshTideSurvey();
  n.correspondence = n.life === old.life ? structuredClone(old.correspondence) : freshCorrespondence();
  n.itemGrowth = n.life === old.life ? structuredClone(old.itemGrowth) : freshItemGrowth();
  if (n.status !== "alive") { n.itemGrowth.trial = null; n.itemGrowth.golden.duel = null; }
  if (n.status !== "alive") n.spirit.trial = null;
  n.goldenStory = structuredClone(old.goldenStory);
  n.lizhao = structuredClone(old.lizhao);
  n.nascentSoul = structuredClone(old.nascentSoul);
  n.ascension = n.life === old.life && n.realm === old.realm && n.status === "alive" ? structuredClone(old.ascension) : null;
  n.wayfaring = n.life === old.life ? structuredClone(old.wayfaring) : freshWayfaring();
  n.conclave = n.life === old.life ? structuredClone(old.conclave) : freshConclave();
  if(n.status!=="alive") n.conclave.duel=null;
  n.outerSea = n.life === old.life ? structuredClone(old.outerSea) : freshOuterSea();
  updateSeaCalendar(n);
  n.goldenCore = n.life === old.life ? structuredClone(old.goldenCore) : freshGoldenCore();
  if(n.status !== "alive") n.goldenCore.duel = null;
  n.sectContest = n.life === old.life ? structuredClone(old.sectContest) : freshSectContest();
  updateContestCalendar(n);
  n.treasures = n.life === old.life ? structuredClone(old.treasures) : freshTreasures();
  n.secretPact = n.life === old.life ? structuredClone(old.secretPact) : freshSecretPact();
  n.recognition = n.life === old.life ? structuredClone(old.recognition) : freshRecognition();
  n.cultivationRemainder = n.life === old.life && n.realm === old.realm ? old.cultivationRemainder : 0;
  n.qiJourney =
    n.life === old.life ? structuredClone(old.qiJourney) : freshQiJourney();
  if (n.status !== "alive") {
    n.qiJourney.cultivation.work = null;
    n.qiJourney.node = 0;
    n.qiJourney.duel = null;
    n.qiJourney.trial = null;
    if (n.qiJourney.narrative) {
      n.qiJourney.narrative.location = "home";
      n.qiJourney.narrative.duel = null;
      if (n.qiJourney.narrative.phase === "challenge") n.qiJourney.narrative.phase = "prepared";
      if (n.qiJourney.narrative.pursuit === "fighting") n.qiJourney.narrative.pursuit = "warned";
    }
    n.secretPact.hazard = null;
  }
  if (!n.realm) n.qi = Math.min(n.qi, qiCap(n));
  n.foundationJourney =
    n.life === old.life
      ? structuredClone(old.foundationJourney)
      : freshFoundationJourney();
  if (n.status !== "alive") n.foundationJourney.duel = null;
  n.companionship =
    n.life === old.life
      ? structuredClone(old.companionship)
      : freshCompanionship();
  n.workshop = n.life === old.life ? structuredClone(old.workshop) : freshWorkshop();
  n.growth = n.life === old.life ? structuredClone(old.growth) : freshGrowth();
  n.expedition =
    n.life === old.life ? structuredClone(old.expedition) : freshExpedition();
  if (n.status !== "alive") n.expedition.duel = null;
  if (n.status === "dead") {
    n.social.scene = null;
    n.social.arena.duel = null;
  }
  if (n.status === "complete" && old.status === "alive") {
    if (old.journey.settled) {
      n.legacy = old.legacy;
      n.earned = old.earned;
      n.log = n.log.filter(
        (l) => !(l.month === n.month && l.text === n.result),
      );
    } else {
      log(
        n,
        "筑基篇已记入修行履历，你的道途仍在继续。山外的雾岭与孤灯，正等你探访。",
      );
    }
    n.status = "alive";
    n.journey.settled = true;
  }
  // Milestone and eventual death must not award the same life's legacy twice.
  if (old.journey.settled && n.status === "dead") {
    n.legacy = old.legacy;
    n.earned = old.earned;
  }
  settleFriendJourney(old,n);
  deliverWorldCalendar(old,n);
  return n;
}
function wayfaringMonth(s: State): State {
  return normalize(lift(chapter.travelMonth(base(s), "御剑研习"),structuredClone(s.journey),structuredClone(s.social),structuredClone(s.adventure)),s);
}
function workshopMonth(s: State, label = "开炉筹备"): State {
  return normalize(lift(chapter.travelMonth(base(s), label), structuredClone(s.journey), structuredClone(s.social), structuredClone(s.adventure)), s);
}
export function dispatch(input: State, c: Command): State {
  const next = dispatchCommand(input, c);
  if (next !== input) {
    if (next.status === "dead" && !next.death && next.age >= next.limit) next.death = { cause: "lifespan", month: next.month, age: next.age, realm: next.realm };
    if (next.realm !== input.realm || next.status !== "alive" || next.pills < input.pills || next.goldenCore.pills < input.goldenCore.pills) next.ascension = null;
    updateSeaCalendar(next);
    updateContestCalendar(next);
    discoverContest(next,c);
    settleFriendJourney(input,next);
    deliverWorldCalendar(input,next);
    deliverMessages(next);
    if (!next.realm) next.qi = Math.min(next.qi, qiCap(next));
    if ((!next.realm && next.qi === qiCap(next)) || (next.realm === 1 && next.foundationJourney.cultivation === foundationCap(next)) || (next.realm === 2 && next.outerSea.cultivation === goldenCap(next))) next.cultivationRemainder = 0;
  }
  return next;
}
function dispatchCommand(input: State, c: Command): State {
  if (!c.id || input.seen.includes(c.id)) return input;
  if (input.status === "dead" && !["next", "beginChapter"].includes(c.type)) return input;
  if (c.type === "correspondence") return runCorrespondence(input, c.action, c.id);
  if(!hasCultivationKit(input) && !['adventure','choose','join','next','beginChapter'].includes(c.type)
    && !(c.type === 'qiJourney' && (isInitiationAction(c.action) || c.action.startsWith('origin:')))) return input;
  if(c.type==='qiJourney' && isCultivationAction(c.action))return runCultivation(input,c.action,c.id,s=>workshopMonth(s,'修行与历练'));
  if(cultivationActive(input))return input;
  if(input.pending?.kind==='relic' && !input.qiJourney.cultivation.relic)return input;
  if(c.type==='duty')return runCultivation(input,`cultivation:${c.duty}`,c.id,s=>workshopMonth(s,'师门行程'));
  if (input.itemGrowth.golden.duel && c.type !== "artifactGrowth" && c.type !== "choose") return input;
  if (c.type === "artifactGrowth") return runArtifactGrowth(input,c.action,c.id,s=>workshopMonth(s,"法宝温养"));
  if (input.itemGrowth.trial && c.type !== "itemGrowth" && c.type !== "choose") return input;
  if (c.type === "itemGrowth") return runItemGrowth(input,c.action,c.id,s=>workshopMonth(s,"遗物整备"));
  if (input.spirit.trial && c.type !== "spirit" && c.type !== "choose") return input;
  if (c.type === "spirit") return runSpirit(input,c.action,c.id,s=>workshopMonth(s,"炼神调息"));
  if (input.status === "alive" && qiNarrativeActive(input) && c.type !== "qiJourney" && c.type !== "choose") return input;
  if (input.status === "alive" && pactActivity(input.secretPact) && c.type !== "secretPact" && c.type !== "choose" && !(c.type === "foundationJourney" && (["move","withdraw"].includes(c.action.kind) || (c.action.kind === "battle" && c.action.battle === "pactRival")))) return input;
  if (input.secretPact.site !== "away" && c.type === "foundationJourney" && c.action.kind !== "travel" && !["move","withdraw"].includes(c.action.kind) && !(c.action.kind === "battle" && c.action.battle === "pactRival")) return input;
  if (c.type === "ascension") return runAscension(input,c.action,c.id,dispatchCommand,s=>workshopMonth(s,"收势调息"));
  if (input.ascension && !input.pending && !(input.ascension.step === 3 && (input.ascension.realm === 0 ? c.type === "break" : c.type === "goldenCore" && c.action.kind === "break"))) return input;
  if (input.wayfaring.passage && !(c.type === "choose" || (c.type === "wayfaring" && c.action.kind === "cancel") || isPassageContinuation(input,c))) return input;
  if (input.wayfaring.trip && !(c.type === "choose" || c.type === "wayfaring" || (c.type === "foundationJourney" && c.action.kind === "travel"))) return input;
  if (nascentActive(input) && c.type !== "nascentSoul" && c.type !== "choose") return input;
  if (input.lizhao.duel && c.type !== "lizhao" && c.type !== "choose") return input;
  if (c.type === "goldenStory" && lizhaoActivity(input)) return input;
  if (c.type === "goldenStory") return runGoldenStory(input,c.action,c.id,workshopMonth);
  if (c.type === "estateLife") return runEstateLife(input,c.action,c.id,s=>workshopMonth(s,"药庄合作"));
  if (c.type === "tideSurvey") return runTideSurvey(input,c.action,c.id,workshopMonth);
  if (c.type === "revisit") return runRevisit(input,c.action,c.id);
  if (c.type === "lizhao") return runLizhao(input,c.action,c.id,workshopMonth);
  if (c.type === "nascentSoul") return runNascent(input,c.action,c.id,workshopMonth);
  if (lizhaoActivity(input) && !["choose","advance","queue","queueTick","equipRelic","treasure","learning","supplies"].includes(c.type) && !(c.type === "wayfaring" && c.action.kind === "cancel")) return input;
  if (c.type === "wayfaring") return runWayfaring(input,c.action,c.id,wayfaringMonth);
  if(c.type === "conclave") return runConclave(input,c.action,c.id,s => workshopMonth(s,c.action.kind === "wait" ? "留居候约" : "开炉筹备"));
  if(input.conclave.duel || input.conclave.location === "vault") return input;
  const localEquipment = c.type === "treasure" && isEquipmentAction(c.action);
  const guildAuction = c.type === "treasure" && input.outerSea.location === "guild" && ["catalog","enter","bid","pass","leave","wait","budget"].includes(c.action.kind);
  if(!localEquipment && conclaveActive(input) && ["outerSea","goldenCore","foundationJourney","road","mist","explore","expedition","recognition","secretPact","treasure","sectContest","beginChapter","next"].includes(c.type)) return input;
  if(c.type === "outerSea") return runSea(input,c.action,c.id,workshopMonth);
  if(input.outerSea.location === "ruins") return input;
  if(!localEquipment && !guildAuction && input.outerSea.location !== "home" && ["foundationJourney","road","mist","explore","expedition","recognition","secretPact","treasure","sectContest"].includes(c.type)) return input;
  if (c.type === "goldenCore") return runGolden(input,c.action,c.id,s=>workshopMonth(s,c.action.kind === "break" ? "闭关行功" : "凝丹筹备"));
  if (input.goldenCore.expedition !== "idle") return input;
  if (c.type === "sectContest") return runContest(input,c.action,c.id,workshopMonth);
  if (input.sectContest.duel) return input;
  if (c.type === "treasure") return runTreasure(input,c.action,c.id,workshopMonth);
  if (input.treasures.auction?.entered && !input.treasures.auction.closed) return input;
  if (c.type === "learning") return runLearning(input, c.choice, c.id, c.equip);
  if (c.type === "secretPact") return runPact(input,c.action,c.id,(s) => normalize(lift(chapter.travelMonth(base(s),"秘境赴约"),structuredClone(s.journey),structuredClone(s.social),structuredClone(s.adventure)),s));
  if (c.type === "recognition") return runRecognition(input, c.action, c.id, (s) =>
    normalize(lift(chapter.travelMonth(base(s), "领队行程"), structuredClone(s.journey), structuredClone(s.social), structuredClone(s.adventure)), s));
  if (c.type === "qiJourney")
    return runQiJourney(input, c.action, c.id, (s) =>
      normalize(
        lift(
          chapter.travelMonth(base(s)),
          structuredClone(s.journey),
          structuredClone(s.social),
          structuredClone(s.adventure),
        ),
        s,
      ),
    );
  if (input.qiJourney.node) return input;
  if (c.type === "break" && chapter.breakthroughError(input)) return input;
  if (c.type === "foundationJourney")
    return runFoundationJourney(input, c.action, c.id, (s) =>
      normalize(
        lift(
          chapter.travelMonth(base(s)),
          structuredClone(s.journey),
          structuredClone(s.social),
          structuredClone(s.adventure),
        ),
        s,
      ),
    );
  if (input.foundationJourney.duel) return input;
  if (
    !companionPresent(input) &&
    ["visit", "background", "outing", "confess", "companionship"].includes(
      c.type,
    )
  )
    return input;
  if (!companionPresent(input) && c.type === "mist" && c.action === "companion")
    return input;

  if (c.type === "companionship")
    return runCompanionship(input, c.action, c.id);
  if (c.type === "workshop" || c.type === "forge" || c.type === "brew" || (c.type === "prepare" && c.kind === "refine")) {
    if (c.type === "forge" && !Object.hasOwn(relics, c.relic)) return input;
    if (c.type === "brew" && !Object.hasOwn(medicines, c.medicine)) return input;
    const order = c.type === "workshop" ? c.order : { product: c.type === "forge" ? c.relic : c.type === "brew" ? c.medicine : "foundation" as const, method: "craft" as const };
    return runWorkshop(input, order, c.id, workshopMonth);
  }
  if (c.type === "trainTechnique" || c.type === "consume")
    return runGrowth(input, c);
  if (c.type === "expedition")
    return runExpedition(input, c.action, c.id, (s) =>
      normalize(
        lift(
          chapter.travelMonth(base(s)),
          structuredClone(s.journey),
          structuredClone(s.social),
          structuredClone(s.adventure),
        ),
        s,
      ),
    );
  if (input.expedition.duel) return input;
  if (c.type === "mist") return runMist(input, c.action, c.id);
  if (c.type === "road") return runRoad(input, c.action, c.id);
  if (c.type === "adventure") {
    const n = runAdventure(input, c.action, c.id);
    if (
      n !== input &&
      input.adventure.step !== "done" &&
      n.adventure.step === "done" &&
      n.status === "alive"
    ) {
      n.adventure.result += "温蘅请你回药坪谈求学：营救只是相识，愿入宗者还须引荐与拜师；愿作散修者可另议传法与报酬。";
    }
    return n;
  }
  if (
    socialCommands.includes(c.type) ||
    (c.type === "choose" && !input.pending && input.social.scene)
  ) {
    return dispatchSocial(input, c as SocialCommand, (s) =>
      normalize(lift(chapter.travelMonth(base(s), "同行与赴台"), structuredClone(s.journey), structuredClone(s.social), structuredClone(s.adventure)), s),
    );
  }
  if (input.social.scene || input.social.arena.duel) return input;
  if (
    [
      "advance",
      "prepare",
      "choose",
      "break",
      "revisitRelic",
      "next",
      "beginChapter",
    ].includes(c.type)
  ) {
    const command = c as chapter.Command;
    if (command.type === "advance") {
      if (
        !Number.isInteger(command.months) ||
        command.months < 1 ||
        command.months > (command.activity === "cultivate" ? 120 : 12)
      )
        return input;
      let n = input;
      for (let i = 0; i < command.months; i++) {
        if (actionError(n, command.activity)) break;
        const b = base(n);
        if (
          n.realm === 1 &&
          command.activity === "cultivate" &&
          n.foundationJourney.cultivation >= foundationCap(n)
        )
          break;
        const result =
          n.realm >= 1 && command.activity === "cultivate"
            ? chapter.travelMonth(b)
            : chapter.dispatch(b, { ...command, id: c.id, months: 1 }, true);
        if (result === b) break;
        const old = n;
        n = normalize(
          lift(
            result,
            structuredClone(n.journey),
            structuredClone(n.social),
            structuredClone(n.adventure),
          ),
          n,
        );
        if (n.status === "alive") {
          const a = command.activity;
          const cultivation = a === "cultivate" ? cultivationMonth({ ...n, qi: old.qi }) : null;
          if (cultivation) n.cultivationRemainder = cultivation.remainder;
          if (n.realm === 0 && cultivation)
            n.qi = Math.min(qiCap(n), old.qi + cultivation.gain);
          if (n.realm === 0 && a !== "cultivate")
            n.qi = Math.min(qiCap(n), old.qi + incidentalQiGain(old, a));
          const techniqueEffect = techniqueActivityEffect(n, a);
          n.herbs += techniqueEffect.herbs;
          if (techniqueEffect.preventInjury) n.injury = old.injury;
          n.study = Math.min(4, n.study + techniqueEffect.study);
          if (n.realm === 2) {
            n.qi=old.qi;
            n.outerSea.cultivation=Math.min(goldenCap(n),old.outerSea.cultivation+(cultivation?.gain??0));
            if(cultivation?.gain) log(n,`金丹修行 +${n.outerSea.cultivation-old.outerSea.cultivation}（${n.outerSea.cultivation}/${goldenCap(n)}）。`);
          }
          if (n.realm === 1) {
            n.qi = old.qi;
            const gain = cultivation?.gain ?? 0;
            n.foundationJourney.cultivation = Math.min(
              foundationCap(n),
              old.foundationJourney.cultivation + gain,
            );
            if (gain)
              log(
                n,
                `筑基修行 +${n.foundationJourney.cultivation - old.foundationJourney.cultivation}（${n.foundationJourney.cultivation}/600）。`,
              );
          }
          const prefix = {
            cultivate: "",
            train: "历练剑意",
            gather: "采药得",
            work: "山下劳作",
            study: "研读残卷",
            meditate: "凝神内观",
            rest: "静养经脉",
          }[a];
          const values = (
            [
              ["qi", "修为"],
              ["mastery", "剑意"],
              ["sense", "神识"],
              ["study", "心得"],
              ["herbs", "灵草"],
              ["stones", "灵石"],
              ["injury", "伤势"],
            ] as const
          )
            .filter(([key]) => n[key] !== old[key])
            .map(
              ([key, label]) =>
                `${label} ${n[key] - old[key] > 0 ? "+" : ""}${n[key] - old[key]}`,
            );
          const entry = prefix
            ? n.log.find(
                (l) => l.month === n.month && l.text.startsWith(prefix),
              )
            : null;
          const actual = `${queueActions[a]}：${values.join("、") || "属性未变"}。已计入功法效果。`;
          if (entry) entry.text = actual;
          else log(n, actual);
        }
        // One user command owns a batch; intermediate months do not own its id.
        n.seen = old.seen;
        if(n.outerSea.reminded && !old.outerSea.reminded) break;
        if (
          (!old.sectContest.reminded && n.sectContest.reminded) ||
          n.pending ||
          n.status !== "alive" ||
          (n.realm === 0 && old.qi < 360 && n.qi === 360)
        )
          break;
      }
      if (n === input) return input;
      n.seen = [...input.seen, c.id].slice(-512);
      return n;
    }
    const b = base(input),
      result = chapter.dispatch(b, command);
    if (result === b) return input;
    if (c.type === "next" || c.type === "beginChapter")
      return lift({...result,stones:0,story:{...result.story,deadline:120}}, fresh(), freshSocial(), freshAdventure());
    return normalize(
      lift(
        result,
        ["next", "beginChapter"].includes(c.type)
          ? fresh()
          : structuredClone(input.journey),
        ["next", "beginChapter"].includes(c.type)
          ? freshSocial()
          : structuredClone(input.social),
        ["next", "beginChapter"].includes(c.type)
          ? freshAdventure()
          : structuredClone(input.adventure),
      ),
      input,
    );
  }
  if (c.type === "continue") {
    if (input.status !== "complete" || input.age >= input.limit) return input;
    const n = structuredClone(input);
    n.status = "alive";
    n.journey.settled = true;
    n.seen = [...n.seen, c.id].slice(-512);
    log(n, "你收起前篇卷宗，再次踏上山外的路。");
    return n;
  }
  if (input.status !== "alive" || input.pending) return input;
  let s = structuredClone(input);
  const accept = () => {
    s.seen = [...input.seen, c.id].slice(-512);
    if (!s.realm) s.qi = Math.min(s.qi, qiCap(s));
    return s;
  };
  // Expeditions and duties spend one real month; death wins over their rewards.
  const travel = () => {
    const b = base(s),
      n = chapter.dispatch(b, {
        id: c.id,
        type: "advance",
        activity: "work",
        months: 1,
      });
    s = normalize(lift(n, s.journey, s.social, s.adventure), input);
    if (s.status === "alive") {
      s.stones -= monthlyWorkIncome(b); // no labour income while travelling
      s.log = s.log.filter(
        (l) => !(l.month === s.month && l.text === `山下劳作，灵石 +${monthlyWorkIncome(b)}。`),
      );
    }
    return s.status === "alive";
  };
  switch (c.type) {
    case "supplies":
      if (settleResources(s, {stones: 8}, {herbs: 4}).error) return input;
      log(s, "坊市购得灵草四株，可用于灵器炼制、炼丹或与守境妖修交涉。");
      return accept();
    case "equipRelic": {
      const { error } = applyEquipmentChange(s, { kind: "equip", id: c.relic });
      // Preserve the existing command receipt for re-equipping the same item.
      if (error && error !== "已装配") return input;
      return accept();
    }
    case "aid":
      if (
        !["peak", "sea"].includes(c.place) ||
        !["mentor", "luchi"].includes(c.helper) ||
        aidError(s, c.place, c.helper)
      )
        return input;
      s.journey.encounters[c.place]!.aid = c.helper;
      log(
        s,
        c.helper === "luchi"
          ? "你与陆迟分定守阵的位置：“这次，我来护住你的背后。”本关援助 +20，失败后仍会陪你重试。"
          : "执事答应为你护持阵眼：“准备好了再来，我等你。”本关援助 +20，失败后仍有效。",
      );
      return accept();
    case "challenge": {
      if (
        !["peak", "sea"].includes(c.place) ||
        explorationError(s, c.place) ||
        s.journey.maps[c.place] !== 1 ||
        !["fight", "parley"].includes(c.mode)
      )
        return input;
      const e = s.journey.encounters[c.place];
      if (!e || e.passed) return input;
      if (
        c.mode === "parley" &&
        (e.kind !== "guardian" ||
          (!s.adventure.mist.garden && (s.herbs < 6 || s.study < 2)))
      )
        return input;
      if (c.mode === "fight" && s.stones < 4) return input;
      const details = challengeDetails(s, c.place)!;
      if (!travel()) return accept();
      const current = s.journey.encounters[c.place]!;
      current.attempts++;
      if (c.mode === "parley") {
        if (!s.adventure.mist.garden) s.herbs -= 6;
        current.passed = true;
        current.outcome = "peace";
        log(
          s,
          s.adventure.mist.garden
            ? "石角认出救过药圃的你，主动撤去瘴阵：“救草的恩情我记得。药队可从这里走。”凭旧交通行，不耗灵草。"
            : "你带来灵草，解释采药人的来意。石角收起瘴阵：“原来你不是来夺药的。走吧，别惊扰族人。”交涉通关，不掷骰。",
        );
      } else {
        s.stones -= 4;
        const result = resolveEncounter(details, s.seed);
        const value = result.roll;
        s.seed = result.seed;
        current.lastRoll = value;
        current.lastChance = result.chance;
        current.passed = result.outcome === "win";
        current.outcome = result.outcome;
        if (current.passed)
          log(
            s,
            `你闯过${opponents[current.kind].name}的阻拦。判定 ${value}/100，把握 ${details.chance}%。原先的准备终于派上了用场。`,
          );
        else {
          s.injury = Math.min(6, s.injury + result.injury);
          log(
            s,
            `挑战未过：${opponents[current.kind].name}迫你退回。判定 ${value}/100，把握 ${details.chance}%，伤势 +${details.damage}。线索与灵器保留；先养伤、精炼灵器、凝神固本，或请道友护持后再来。`,
          );
        }
      }
      if (current.passed) {
        s.journey.maps[c.place] = 2;
        log(
          s,
          c.place === "peak"
            ? s.journey.approach === "rescue"
              ? "获救采药人的路标指向海边：陆迟的父亲还活着，是雾海的守灯人。"
              : "越过阻拦，你在石壁读到一行刻字：去雾海，找守灯人。"
            : "灯塔内，守灯人认出了旧剑刻痕。他受托维持引航阵，尚不能离开，却能托你带信回家。",
        );
      }
      return accept();
    }
    case "enqueue":
      if (
        !Object.hasOwn(queueActions, c.action) ||
        !Number.isInteger(c.repeat) ||
        c.repeat < 1 ||
        c.repeat > 12 ||
        s.journey.queue.length >= 8
      )
        return input;
      s.journey.queue.push({ action: c.action, remaining: c.repeat });
      return accept();
    case "clearQueue":
      if (!s.journey.queue.length) return input;
      s.journey.queue = [];
      return accept();
    case "queueTick": {
      const task = input.journey.queue[0];
      if (!task) return input;
      const error =
        task.action === "refine"
          ? preparationError(input, "refine")
          : actionError(input, task.action);
      if (error) return input;
      const n = dispatch(
        input,
        task.action === "refine"
          ? { id: c.id, type: "prepare", kind: "refine" }
          : { id: c.id, type: "advance", activity: task.action, months: 1 },
      );
      if (n === input) return input;
      if (task.action === "refine" && n.pills <= input.pills && n.qiJourney.cultivation.work?.kind!=="alchemy") return n;
      n.journey.queue[0].remaining--;
      if (
        !n.journey.queue[0].remaining ||
        (task.action === "rest" && n.injury === 0) ||
        (task.action === "cultivate" &&
          (n.realm === 2 ? n.outerSea.cultivation >= goldenCap(n) : n.realm === 1
            ? n.foundationJourney.cultivation >= foundationCap(n)
            : n.qi >= qiCap(n)))
      )
        n.journey.queue.shift();
      return n;
    }
    case "mentor":
      if (
        s.journey.branch === "none" ||
        s.journey.duties < 3 ||
        s.journey.mentor ||
        !["care", "seek"].includes(c.answer)
      )
        return input;
      s.journey.mentor = true;
      if (c.answer === "care") {
        s.herbs += 4;
        log(
          s,
          "你说修行是为了护住身边的人。执事把四株灵草放到你手中：“记住今天的话。雾岭里，也有人在等救援。”",
        );
      } else {
        s.study = Math.min(4, s.study + 1);
        log(
          s,
          "你说想亲眼看看山外的世界。执事翻开旧卷：“山外路远，光有心气不够。先把行气的根基练稳。”心得 +1。",
        );
      }
      return accept();
    case "join":
      if (
        s.journey.branch !== "none" ||
        !["dan", "jian"].includes(c.branch) ||
        !!joinError(s)
      )
        return input;
      grantKit(s,'sect');
      s.journey.branch = c.branch;
      learn(s, c.branch === "dan" ? "herb" : "guard");
      log(
        s,
        c.branch === "dan"
          ? "丹堂执事温蘅收你为记名弟子：“学会救人，才算读懂丹方。”"
          : "剑院执事季衡收你为记名弟子：“握剑的手抬稳。门中弟子出山要护送药队，明日卯时来演武场。”",
      );
      s.qiJourney.narrative.initiation.last = '你在门册上落名行礼。执事发下一只粗制储物袋、下品灵石十二枚，药队另付营救与试阵酬谢十二枚；基础功法可自选一册。已领过散修入道物资者不重复领取。袋中只能收纳随身物资，不能容纳活物。';
      log(s,s.qiJourney.narrative.initiation.last);
      if (s.story.luchi !== "distant")
        log(
          s,
          "陆迟听说你入门，送来一张旧营地草图：“若有一日能进雾岭，替我留心这道刻痕。”",
        );
      return accept();
    case "promote":
      if (promotionError(s)) return input;
      s.journey.contribution -= 6;
      s.journey.rank = 1;
      s.journey.mentor = true;
      {
        const t = s.journey.branch === "dan" ? "spring" : "blade";
        if (s.journey.known.includes(t)) {
          if (s.growth.training[t] < 1) {
            s.growth.training[t] = 1;
            log(s, "师门指点将已有主修提升至熟练，装配后生效。");
          } else {
            s.stones += 12;
            log(s, "主修已熟练，师门另赠研修灵石 12。");
          }
        } else learn(s, t);
      }
      log(
        s,
        "你凭亲历与心得成为外门弟子。执事递来雾岭通行令：“山中路险，查明去向便回来。”",
      );
      return accept();
    case "learn":
      if (techniqueChangeError(s, { kind: "learn", id: c.technique })) return input;
      // The same techniques are accessible to independent cultivators.
      s.stones -= 20;
      learn(s, c.technique);
      log(s, "在坊市与散修交换心得，读懂一册功法。");
      return accept();
    case "equip":
      if (applyTechnique(s, { kind: "equip", id: c.technique }).error) return input;
      return accept();
    case "explore": {
      if (explorationError(s, c.place)) return input;
      const step = s.journey.maps[c.place];
      if (c.place !== "valley" && step === 1) return input; // Must resolve the encounter, never click past it.
      if (
        c.place === "valley" &&
        step === 1 &&
        (!["rescue", "trace"].includes(c.approach ?? "") ||
          (c.approach === "rescue" && s.herbs < 2))
      )
        return input;
      if (!travel()) return accept();
      s.journey.maps[c.place]++;
      if (c.place !== "valley" && step === 0) {
        const kind = roll(s) < 0.5 ? "guardian" : "raider";
        s.journey.encounters[c.place] = {
          kind,
          attempts: 0,
          aid:
            s.story.luchi === "foundation" &&
            s.story.trust >= 3 &&
            (s.adventure.mist.partner === "luchi" || c.place === "sea")
              ? "luchi"
              : "none",
          passed: false,
          lastRoll: 0,
          lastChance: 0,
          outcome: "none",
        };
        log(
          s,
          `前路遇阻：${opponents[kind].name}。${encounterDescription(s, kind)}`,
        );
      }
      if (c.place === "valley") {
        if (step === 0)
          log(
            s,
            "回春谷：旧营地的药篓上有三道刻痕。崖边传来呼救，另一侧的足迹正被雨水冲淡。",
          );
        if (step === 1) {
          s.journey.approach = c.approach!;
          if (c.approach === "rescue") {
            s.herbs -= 2;
            s.story.trust = Math.min(6, s.story.trust + 1);
            log(
              s,
              "你先救起受伤的采药人。他认出了刻痕，愿替你向陆迟报平安。信任 +1。",
            );
          } else {
            s.stones += 8;
            log(
              s,
              "你先保住被雨水侵蚀的笔记，拾得灵石 8。返回时采药人已由同伴救走，你没能问出他的见闻。",
            );
          }
        }
        if (step === 2) {
          learn(s, "herb");
          log(
            s,
            "营地笔记指向雾岭。山门守卫提醒：炼气之躯难抵山瘴；筑基后凭通行令，或自行识阵，才能深入。",
          );
        }
      }
      if (c.place === "peak") {
        if (step === 0)
          log(
            s,
            s.journey.rank === 1
              ? "外门令牌换来守山人的信任，他指给你一条隐秘栈道。"
              : "你用神识辨认山瘴与阵纹，以研读所得独自走过栈道。散修也有自己的路。",
          );
        if (step === 2) {
          learn(s, "lantern");
          log(
            s,
            "雾岭尽头，你收下航图与功法谢礼。纸背写着：灯不灭，归人便有路。雾海孤灯已开放。",
          );
        }
      }
      if (c.place === "sea") {
        if (step === 0)
          log(
            s,
            s.story.choice === "gift"
              ? "陆迟与你并肩登船。他第一次主动说起父亲教他握剑的模样。"
              : "你独自登船，把那封旧家书收进衣襟。此行也是为了兑现自己说过的话。",
          );
        if (step === 2) {
          s.stones += 20;
          log(
            s,
            "你把守灯人的亲笔信交到陆迟母亲手里。她先摸了摸落款，才将信展开：“这个收笔，还是老样子。”陆迟没有催她。读到父亲仍须留守，她把窗边的灯挪到桌上：“既然信能送来，就替我回一句，家里的门没换。”陆迟接过空白信纸，终于不再望着山路等一个影子。家书已送达。灵石 +20。",
          );
        }
      }
      return accept();
    }
    case "retire":
      if (!s.journey.settled || s.realm !== 1 || s.story.stage !== "resolved")
        return input;
      s.status = "complete";
      log(s, "你收起这一程的卷宗。休整之后，仍可继续自己的道途。");
      return accept();
  }
  return input;
}
export function validState(x: unknown): x is State {
  return validWorldState(x, SAVE_VERSION);
}
function validWorldState(
  x: unknown,
  version: 60 | 59 | 58 | 57 | 56 | 55 | 54 | 53 | 52 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51,
): boolean {
  if (!x || typeof x !== "object") return false;
  const s = x as State,
    j = s.journey;
  if (
    (x as { version: unknown }).version !== version ||
    (version >= 60 && !validEstateLife(s.estateLife)) ||
    (version >= 59 && (!validQiCultivation(s.qiJourney?.cultivation) || !Number.isInteger(s.qiJourney.trialProgress) || s.qiJourney.trialProgress<0 || s.qiJourney.trialProgress>4)) ||
    (version >= 57 && !validDeath(s)) ||
    (version >= 56 && s.goldenStory?.practice && s.goldenStory.practice.topic !== "spirit" && !(version >= 58 ? validMaterialPractice(s.goldenStory.practice.material) : validLegacyMaterialPractice(s.goldenStory.practice.material))) ||
    (version >= 55 && s.goldenStory?.practice?.topic === "spirit" && !validSpiritPractice(s.goldenStory.practice.spirit)) ||
    (version >= 54 && !validCrossing(s.nascentSoul?.crossing, s.nascentSoul?.ability)) ||
    (version >= 52 && !validFriendJourney(s, version < 53)) ||
    (version >= 50 && !validTideSurvey(s)) ||
    (version >= 49 && !validReunion(s)) ||
    (version >= 48 && !validAssay(s.lizhao?.assay, !!s.lizhao?.cleared, !!s.lizhao?.recipeVerified, version < 51)) ||
    (version >= 47 && !validCorrespondence(s.correspondence, s.month)) ||
    (version >= 44 && !validItemGrowth(s)) ||
    (version >= 45 && !validArtifactGrowth(s.itemGrowth?.golden)) ||
    (version >= 41 && !validSpirit(s)) ||
    (version < 41 && s.sense > senseLimit(s.realm)) ||
    (version < 39 && (s.realm > 2 || s.conclave?.stage > 2)) ||
    (version >= 39 && (!validGoldenStory(s,version<42,version<58) || !validLizhao(s) || !validNascentSoul(s,version<40,version<42))) ||
    (version >= 39 && s.conclave.stage === 3 && (!s.nascentSoul.trialWon || !s.lizhao.cleared || !s.lizhao.recipeVerified)) ||
    (version >= 39 && s.lizhao.location !== "away" && (s.realm !== 2 || s.outerSea.location !== "ferry" || s.conclave.location !== "away" || nascentActive(s))) ||
    (version >= 39 && (s.lizhao.duel || nascentActive(s)) && (s.status !== "alive" || s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel || s.foundationJourney.duel || s.sectContest.duel || s.conclave.duel || s.outerSea.duel || s.qiJourney.node || s.ascension || s.wayfaring.trip || s.wayfaring.passage || (s.treasures.auction?.entered && !s.treasures.auction.closed))) ||
    (version >= 36 && (!validAscension(s.ascension,s.realm) || (s.ascension && (s.status !== "alive" || s.qiJourney?.node || s.foundationJourney?.duel || s.goldenCore?.expedition !== "idle" || s.social?.scene || s.social?.arena?.duel || s.expedition?.duel || s.sectContest?.duel || s.wayfaring?.trip || s.wayfaring?.passage || s.outerSea?.location !== "home" || s.conclave?.location !== "away" || (s.treasures?.auction?.entered && !s.treasures.auction.closed))))) ||
    (version >= 38 && s.secretPact?.site !== "away" && (s.realm !== 1 || (s.secretPact?.site === "zhaoxuan" ? s.foundationJourney?.location !== "frontier" : s.foundationJourney?.location !== "inn"))) ||
    (version >= 38 && s.secretPact?.hazard && (s.status !== "alive" || s.pending || s.social?.scene || s.ascension || s.wayfaring?.trip || s.wayfaring?.passage || s.foundationJourney?.duel || s.social?.arena?.duel || s.expedition?.duel || s.sectContest?.duel)) ||
    (version >= 32 && !validWayfaring(s)) ||
    (version < 35 && s.sense > 12) ||
    (version >= 31 && !validConclave(s,version<37)) ||
    (version >= 30 && !validOuterSea(s)) ||
    (version >= 29 && !validGoldenCore(s)) ||
    (version < 29 && s.realm > 1) ||
    (version >= 28 && !validSectContest(s)) ||
    (version >= 27 && !validTreasures(s.treasures,s.realm,version < 35)) ||
    (version >= 23 && (!Number.isInteger(s.cultivationRemainder) || s.cultivationRemainder < 0 || s.cultivationRemainder >= 240)) ||
    (version >= 25 && !validSecretPact(s.secretPact,s.month,s.realm,s.foundationJourney?.won ?? [],s.foundationJourney?.duel?.id,version < 38)) ||
    (version >= 24 && !validRecognition(s.recognition, s.month, s.realm, s.journey?.branch)) ||
    !j ||
    (version >= 43 && !validInitiation(s.qiJourney?.narrative?.initiation)) ||
    (version >= 26 && !validLearning(j.learning)) ||
    !chapter.validState(version >= 41 ? base(s) : {...base(s),spirit:undefined}) ||
    !validSocial(s) ||
    (version >= 21 && !validWorkshop(s.workshop, j.relics, s.realm)) ||
    (version >= 19 && !validQiJourney(s, version < 20, version >= 38)) ||
    (version >= 16 && !validCompanionship(s)) ||
    (version >= 17 && !validFoundationJourney(s, version < 18, version < 22)) ||
    !(version === 10
      ? validAdventureV10(s.adventure)
      : validAdventure(s.adventure)) ||
    !validRoad(s.adventure.road, s) ||
    !validMist(s) ||
    (version >= 12 && !validExpedition(s)) ||
    (version >= 13 && !validGrowth(s,version < 35))
  )
    return false;
  if(version < 49 && (s.outerSea?.location === "guild" || s.treasures?.auction?.venue === "golden"))return false;
  if (version >= 46 && !validAuctions(s, version < 49)) return false;
  if (version >= 45 && !validArtifactState(s)) return false;
  if (version >= 35 && (equipmentControl(s).error || s.treasures.artifacts.some(id => !artifactReady(s, id)))) return false;
  const integer = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  return (
    ["none", "dan", "jian"].includes(j.branch) &&
    integer(j.rank, 1) &&
    integer(j.contribution) &&
    integer(j.duties) &&
    typeof j.mentor === "boolean" &&
    (j.rank !== 1 || j.mentor) &&
    (!j.mentor || (j.branch !== "none" && j.duties >= 3)) &&
    (j.branch !== "none" ||
      (j.rank === 0 && j.duties === 0 && j.contribution === 0)) &&
    Array.isArray(j.known) &&
    j.known.length <= 6 &&
    new Set(j.known).size === j.known.length &&
    j.known.every((t) => Object.hasOwn(techniques, t)) &&
    [j.main, j.support].every(
      (t, i) =>
        t === null ||
        (j.known.includes(t) &&
          techniques[t].slot === (i === 0 ? "main" : "support")),
    ) &&
    !!j.maps &&
    ["valley", "peak", "sea"].every((p) => integer(j.maps[p as Place], 3)) &&
    (j.maps.peak === 0 || (j.maps.valley === 3 && s.realm >= 1)) &&
    (j.maps.sea === 0 || j.maps.peak === 3) &&
    ["none", "rescue", "trace"].includes(j.approach) &&
    (j.maps.valley >= 2 ? j.approach !== "none" : j.approach === "none") &&
    typeof j.settled === "boolean" &&
    (!j.settled || (s.realm >= 1 && s.story.stage === "resolved")) &&
    Array.isArray(j.queue) &&
    j.queue.length <= 8 &&
    j.queue.every(
      (q) =>
        q &&
        Object.hasOwn(queueActions, q.action) &&
        integer(q.remaining, 12) &&
        q.remaining > 0,
    ) &&
    !!j.relics &&
    ["vial", "sword"].every((r) => integer(j.relics[r as Relic], 2)) &&
    (j.equipped === null ||
      (Object.hasOwn(relics, j.equipped) && j.relics[j.equipped] > 0)) &&
    !!j.encounters &&
    (["peak", "sea"] as const).every((p) => {
      const e = j.encounters[p];
      if (!e) return e === null && j.maps[p] === 0;
      return (
        j.maps[p] >= 1 &&
        Object.hasOwn(opponents, e.kind) &&
        integer(e.attempts) &&
        ["none", "mentor", "luchi"].includes(e.aid) &&
        typeof e.passed === "boolean" &&
        e.passed === j.maps[p] >= 2 &&
        integer(e.lastRoll, 100) &&
        integer(e.lastChance, 100) &&
        ["none", "win", "loss", "peace"].includes(e.outcome) &&
        e.passed === ["win", "peace"].includes(e.outcome) &&
        (e.outcome === "none" ? e.attempts === 0 : e.attempts > 0)
      );
    })
  );
}
export function migrateSave(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=60)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===59){
    if(!validWorldState(x,59))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeEstateLife(x);
  next.estateLife=freshEstateLife();
  next.version=SAVE_VERSION;
  if(!validState(next))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeEstateLife(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=59)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===58){
    if(!validWorldState(x,58))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeQiCultivation(x);
  next.qiJourney.trialProgress ??= 0;
  next.qiJourney.cultivation=validQiCultivation(next.qiJourney.cultivation)?next.qiJourney.cultivation:{...freshQiCultivation(),middle:next.realm>0||next.qi>=120,relic:["self","gift"].includes(next.story.choice)||next.crafted>0};
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:59},59))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeQiCultivation(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=58)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===57){
    if(!validWorldState(x,57))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforePracticeAgency(x);
  const p=next.goldenStory.practice;
  if(p && p.topic!=='spirit')p.material=upgradeMaterialPractice(p.topic,p.material,p.step);
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:58},58))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforePracticeAgency(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=57)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===56){
    if(!validWorldState(x,56))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeMortality(x);
  next.death=null;
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:57},57))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeMortality(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=56)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===55){
    if(!validWorldState(x,55))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeMaterialPractice(x);
  const p=next.goldenStory.practice;
  if(p && p.topic!=='spirit')p.material=freshLegacyMaterialPractice(p.topic,p.step) as unknown as NonNullable<typeof p.material>;
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:56},56))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeMaterialPractice(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=55)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===54){
    if(!validWorldState(x,54))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeSpiritPractice(x);
  const p=next.goldenStory.practice;
  if(p?.topic==='spirit')p.spirit=freshSpiritPractice(p.step);
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:55},55))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeSpiritPractice(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=54)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===53){
    if(!validWorldState(x,53))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeCrossing(x);
  next.nascentSoul.crossing=upgradeCrossing(next.nascentSoul.ability);next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:54},54))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeCrossing(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=53)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===52){
    if(!validWorldState(x,52))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeFriendVisit(x);
  next.friendJourney.visitedAt=null;next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:53},53))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeFriendVisit(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=52)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===51){
    if(!validWorldState(x,51))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  } else next=migrateBeforeFriendJourney(x);
  next.friendJourney=freshFriendJourney();next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:52},52))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeFriendJourney(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=51)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===50){
    if(!validWorldState(x,50))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  } else next=migrateBeforeAssayAgency(x);
  next.lizhao.assay=upgradeAssay(next.lizhao.assay);next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:51},51))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeAssayAgency(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=50)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===49){
    if(!validWorldState(x,49))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  }else next=migrateBeforeTideSurvey(x);
  next.tideSurvey=freshTideSurvey();next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:50},50))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeTideSurvey(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=49)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===48){
    if(!validWorldState(x,48))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  } else next=migrateBeforeReunion(x);
  next.goldenStory.reunion=freshReunion();
  next.treasures.goldenKnown=false;
  next.treasures.auctionArchive.golden=null;
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:49},49))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeReunion(x:unknown):State {
  return migrateBeforeGoldenAuction(x);
}
function migrateBeforeGoldenAuction(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=48)throw new Error('未知或损坏的存档，原档未修改。');
  let next:State;
  if(x && typeof x==='object' && 'version' in x && x.version===47){
    if(!validWorldState(x,47))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  } else next=migrateBeforeAssay(x);
  next.lizhao.assay=freshAssay();
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:48},48))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeAssay(x:unknown):State {
  if(validState(x))return structuredClone(x);
  if(x && typeof x === 'object' && 'version' in x && typeof x.version === 'number' && x.version>=47)throw new Error('未知或损坏的存档，原档未修改。');
  let next: State;
  if(x && typeof x === 'object' && 'version' in x && x.version === 46) {
    if(!validWorldState(x,46))throw new Error('旧存档损坏，原档未修改。');
    next=structuredClone(x) as State;
  } else next=upgradeAuctions(migrateBeforeAuction(x));
  // Initialize only at the final migration boundary. Never fabricate historical mail.
  next.correspondence=freshCorrespondence();
  next.version=SAVE_VERSION;
  if(!validWorldState({...next,version:47},47))throw new Error('旧存档无法安全迁移，原档未修改。');
  return next;
}
function migrateBeforeAuction(x:unknown):State {
  if(x && typeof x === "object" && "version" in x && x.version === 45 && validWorldState(x,45)) return structuredClone(x) as State;
  if(x && typeof x === "object" && "version" in x && x.version === 44) {
    if(!validWorldState(x,44)) throw new Error("旧存档损坏，原档未修改。");
    const n=structuredClone(x) as State;
    n.version=SAVE_VERSION;
    n.itemGrowth.golden=freshArtifactGrowth();
    if(!validWorldState({...n,version:45},45)) throw new Error("旧存档无法安全迁移，原档未修改。");
    return n;
  }
  if(x && typeof x === "object" && "version" in x && x.version === 43) {
    if(!validWorldState(x,43)) throw new Error("旧存档损坏，原档未修改。");
    const n={...structuredClone(x) as State, version:SAVE_VERSION, itemGrowth:freshItemGrowth()};
    if(!validWorldState({...n,version:45},45)) throw new Error("旧存档无法安全迁移，原档未修改。");
    return n;
  }
  if(x && typeof x === 'object' && 'version' in x && x.version === 42) {
    if(!validWorldState(x,42)) throw new Error('旧存档损坏，原档未修改。');
    const n=upgradeImportantScenes(structuredClone(x) as State);
    n.version=SAVE_VERSION;
    if(!validWorldState({...n,version:45},45)) throw new Error('旧存档无法安全迁移，原档未修改。');
    return n;
  }
  if(x && typeof x==='object' && 'version' in x && x.version===41) {
    if(!validWorldState(x,41)) throw new Error('旧存档损坏，原档未修改。');
    const n=upgradeImportantScenes(structuredClone(x) as State);
    n.version=SAVE_VERSION;
    if(!validWorldState({...n,version:45},45)) throw new Error('旧存档无法安全迁移，原档未修改。');
    return n;
  }
  if(x && typeof x === "object" && "version" in x && x.version === 40) {
    if(!validWorldState(x,40)) throw new Error("旧存档损坏，原档未修改。");
    const n = upgradeImportantScenes({...structuredClone(x) as State, version:SAVE_VERSION, spirit:freshSpirit()});
    if(!validWorldState({...n,version:45},45)) throw new Error("旧存档无法安全迁移，原档未修改。");
    return n;
  }
  if(x && typeof x==='object' && 'version' in x && x.version===39){
    if(!validWorldState(x,39))throw new Error('旧存档损坏，原档未修改。');
    const n=structuredClone(x) as State;
    n.spirit=freshSpirit();
    n.nascentSoul.thunder=freshThunderPath();
    // Preserve an already-earned realm without inventing a historical thunder battle.
    if(n.realm===3)n.nascentSoul.thunder.legacyCompleted=true;
    if(n.nascentSoul.attempt){
      n.nascentSoul.attempt=null;
      n.nascentSoul.pills++;
      n.nascentSoul.last='凝婴流程已补全元婴续篇与天劫。原行功安全收势，本次已服丹药退回一枚，已耗年月保留；研法、试雷后可重新叩关。';
    }
    upgradeImportantScenes(n);
    n.version=SAVE_VERSION;
    if(!validWorldState({...n,version:45},45))throw new Error('旧存档无法安全迁移，原档未修改。');
    return n;
  }
  if (x && typeof x === "object" && "version" in x && x.version === 38) {
    if (!validWorldState(x,38)) throw new Error("旧存档损坏，原档未修改。");
    return upgradeNarrative(structuredClone(x) as State);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 37) {
    if (!validWorldState(x,37)) throw new Error("旧存档损坏，原档未修改。");
    return upgradeNarrative(structuredClone(x) as State);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 36) {
    if (!validWorldState(x,36)) throw new Error("旧存档损坏，原档未修改。");
    return upgradeConclave(structuredClone(x) as State);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 35) {
    if (!validWorldState(x,35)) throw new Error("旧存档损坏，原档未修改。");
    return upgradeConclave({...structuredClone(x) as State,version:SAVE_VERSION,ascension:null});
  }
  if (x && typeof x === "object" && "version" in x && x.version === 34) {
    if (!validWorldState(x, 34)) throw new Error("旧存档损坏，原档未修改。");
    return upgradeSpirit(structuredClone(x) as State);
  }
  if(x && typeof x==='object' && 'version' in x && (x.version===32 || x.version===33)) {
    const previous=structuredClone(x) as State;
    if(!previous.wayfaring || (x.version===32 && Object.hasOwn(previous.wayfaring,'passage'))) throw new Error("旧旅行存档损坏，原档未修改。");
    if(x.version===32)previous.wayfaring.passage=null;
    const trip=previous.wayfaring.trip;
    if(trip) {
      if(Object.hasOwn(trip,'plan') || trip.total!==routeBetween(trip.from,trip.to,trip.mode,previous.realm).months)throw new Error("旧行程损坏，原档未修改。");
      const quote=inlandTravel.plan({from:trip.from,to:trip.to,mode:trip.mode,traveler:{realm:previous.realm,speeds:{land:travelSpeeds.land,flight:previous.realm>=2?travelSpeeds.goldenFlight:travelSpeeds.foundationFlight},effects:[]}});
      if(!quote.ok)throw new Error("旧行程损坏，原档未修改。");
      trip.plan=quote.plan;
    }
    previous.version=34 as State["version"];
    if(!validWorldState(previous,34)) throw new Error("旧旅行存档损坏，原档未修改。");
    return upgradeSpirit(previous);
  }
  if(x && typeof x==='object' && 'version' in x && typeof x.version==='number' && x.version>=32) throw new Error("未知或损坏的存档，原档未修改。");
  const old=migratePrevious(x);
  const next={...old,version:SAVE_VERSION,wayfaring:freshWayfaring()};
  return upgradeSpirit(next);
}
function migratePrevious(x: unknown): State {
  if (validWorldState(x,31)) return structuredClone(x) as State;
  if(x && typeof x === "object" && "version" in x && x.version===30){
    const candidate={...structuredClone(x),conclave:freshConclave()} as State;
    if(!validWorldState(candidate,30)) throw new Error("旧存档损坏，原档未修改。");
    return {...candidate,version:SAVE_VERSION};
  }
  if(x && typeof x === "object" && "version" in x && x.version===29){
    if(!validWorldState(x,29)) throw new Error("旧存档损坏，原档未修改。");
    return {...structuredClone(x) as State,version:SAVE_VERSION,conclave:freshConclave(),outerSea:freshOuterSea()};
  }
  if (x && typeof x === "object" && "version" in x && x.version === 28) {
    if (!validWorldState(x,28)) throw new Error("旧存档损坏，原档未修改。");
    return {...structuredClone(x) as State,version:SAVE_VERSION,conclave:freshConclave(),outerSea:freshOuterSea(),goldenCore:freshGoldenCore()};
  }
  if (x && typeof x === "object" && "version" in x && x.version === 27) {
    if (!validWorldState(x,27)) throw new Error("旧存档损坏，原档未修改。");
    return {...structuredClone(x) as State,version:SAVE_VERSION,conclave:freshConclave(),outerSea:freshOuterSea(),goldenCore:freshGoldenCore(),sectContest:freshSectContest()};
  }
  if (x && typeof x === "object" && "version" in x && x.version === 26) {
    if (!validWorldState(x,26)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({...structuredClone(x) as State,version:27,treasures:{...freshTreasures(),equipped:null}});
  }
  if (x && typeof x === "object" && "version" in x && x.version === 25) {
    if (!validWorldState(x, 25)) throw new Error("旧存档损坏，原档未修改。");
    const n = structuredClone(x) as State;
    n.version = SAVE_VERSION;
    n.conclave = freshConclave();
    n.outerSea = freshOuterSea();
    n.goldenCore = freshGoldenCore();
    n.sectContest = freshSectContest();
    n.treasures = freshTreasures();
    n.journey.learning = { book: n.adventure.step === "done", relic: n.expedition.cleared > 0 };
    return n;
  }
  if (x && typeof x === "object" && "version" in x && x.version === 24) {
    if (!validWorldState(x,24)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({...structuredClone(x) as State,version:25,secretPact:freshSecretPact()});
  }
  if (x && typeof x === "object" && "version" in x && x.version === 23) {
    if (!validWorldState(x, 23)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({ ...structuredClone(x) as State, version: 24, recognition: freshRecognition() });
  }
  if (x && typeof x === "object" && "version" in x && x.version === 22) {
    if (!validWorldState(x, 22)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({ ...structuredClone(x) as State, version: 23, cultivationRemainder: 0 });
  }
  if (x && typeof x === "object" && "version" in x && x.version === 21) {
    if (!validWorldState(x, 21)) throw new Error("旧存档损坏，原档未修改。");
    const n = structuredClone(x) as State;
    // No invented milestones: earlier foundation runs must start a new character.
    if (n.realm === 1) throw new Error("筑基成长规则已重构，请备份原档并新建角色；原档未修改。");
    n.version = SAVE_VERSION;
    n.conclave = freshConclave();
    n.outerSea = freshOuterSea();
    n.goldenCore = freshGoldenCore();
    n.sectContest = freshSectContest();
    n.treasures = freshTreasures();
    n.journey.learning = { book: n.adventure.step === "done", relic: n.expedition.cleared > 0 };
    n.secretPact = freshSecretPact();
    n.recognition = freshRecognition();
    n.cultivationRemainder = 0;
    n.foundationJourney.growth = freshFoundationGrowth();
    n.foundationJourney.heroine = freshHeroine();
    return n;
  }
  if (x && typeof x === "object" && "version" in x && x.version === 20) {
    if (!validWorldState(x, 20)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({ ...structuredClone(x) as State, version: 21, workshop: freshWorkshop() });
  }
  if (x && typeof x === "object" && "version" in x && x.version === 19) {
    if (!validWorldState(x, 19)) throw new Error("旧存档损坏，原档未修改。");
    const old = structuredClone(x) as State;
    // No invented contacts or route completions. Current playtest rules start unearned.
    return migratePrevious({
      ...old,
      version: 20,
      qiJourney: {
        ...freshQiJourney(),
        ...old.qiJourney,
        people: freshQiJourney().people,
        preparations: freshQiJourney().preparations,
        trial: null,
      },
    });
  }
  if (x && typeof x === "object" && "version" in x && x.version === 18) {
    if (!validWorldState(x, 18)) throw new Error("旧存档损坏，原档未修改。");
    const old = structuredClone(x) as State;
    const q = freshQiJourney();
    // Honor already reached stages; do not fabricate battles, items or NPC meetings.
    q.gates = old.realm || old.qi >= 360 ? 2 : old.qi >= 240 ? 1 : 0;
    const upgraded = {
      ...old,
      version: 20 as const,
      qiJourney: q,
      limit: old.limit,
    };
    if (validWorldState(upgraded, 20)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 17) {
    if (!validWorldState(x, 17)) throw new Error("旧存档损坏，原档未修改。");
    const old = structuredClone(x) as State;
    const upgraded = {
      ...old,
      version: 18 as const,
      foundationJourney: {
        ...old.foundationJourney,
        epilogue: false,
        aftermath: { estate: false, snow: false, inn: false },
        sharedMoment: false,
        duel: old.foundationJourney.duel
          ? { ...old.foundationJourney.duel, ruleset: 1 as const }
          : null,
      },
    };
    if (validWorldState(upgraded, 18)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 16) {
    if (!validWorldState(x, 16)) throw new Error("旧存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(x),
      version: 17,
      foundationJourney: freshFoundationJourney(),
    };
    if (validWorldState(upgraded, 17)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 15) {
    if (!validWorldState(x, 15)) throw new Error("旧存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(x),
      version: 16,
      companionship: freshCompanionship(),
    };
    if (validWorldState(upgraded, 16)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 14) {
    if (!validWorldState(x, 14)) throw new Error("旧存档损坏，原档未修改。");
    const old = structuredClone(x) as State;
    const upgraded = {
      ...old,
      version: 15 as const,
      social: { ...old.social, origins: [] },
    };
    if (validWorldState(upgraded, 15)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 13) {
    if (!validWorldState(x, 13)) throw new Error("旧存档损坏，原档未修改。");
    return migratePrevious({ ...(structuredClone(x) as State), version: 14 });
  }
  if (x && typeof x === "object" && "version" in x && x.version === 12) {
    if (!validWorldState(x, 12)) throw new Error("旧存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(x),
      version: 14,
      growth: freshGrowth(),
    };
    if (validWorldState(upgraded, 14)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 11) {
    if (!validWorldState(x, 11)) throw new Error("旧存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(x),
      version: 12,
      expedition: freshExpedition(),
    };
    if (validWorldState(upgraded, 12)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 10) {
    if (!validWorldState(x, 10)) throw new Error("旧存档损坏，原档未修改。");
    const old = structuredClone(x) as State;
    const upgraded = {
      ...old,
      version: 11,
      adventure: {
        ...old.adventure,
        rescueChoice: old.adventure.step === "done" ? "legacy" : "none",
      },
    };
    if (validWorldState(upgraded, 11)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 9) {
    const old = x as State;
    if (
      !validAdventureV10(old.adventure) ||
      !validRoadV9(old.adventure.road, old)
    )
      throw new Error("旧行路存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 10,
      adventure: {
        ...structuredClone(old.adventure),
        road: {
          ...structuredClone(old.adventure.road),
          solution: old.adventure.road.passed ? "legacy" : "none",
          prepared: "none",
        },
      },
    };
    if (validWorldState(upgraded, 10)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原档未修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 8) {
    const old = x as State;
    if (!validAdventureV10(old.adventure))
      throw new Error("旧冒险存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 9,
      adventure: { ...structuredClone(old.adventure), mist: freshMist() },
    };
    return migratePrevious(upgraded);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 7) {
    const old = x as State;
    if (
      !validAdventureV10(old.adventure) ||
      !old.adventure.road ||
      typeof old.adventure.road !== "object"
    )
      throw new Error("旧行路存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 9,
      adventure: {
        ...structuredClone(old.adventure),
        mist: freshMist(),
        road: {
          ...structuredClone(old.adventure.road),
          discoveries: [],
          lastApproach: "direct",
        },
      },
    };
    return migratePrevious(upgraded);
  }
  if (x && typeof x === "object" && "version" in x && x.version === 6) {
    const old = x as State;
    if (!validAdventureV10(old.adventure))
      throw new Error("旧冒险存档损坏，原档未修改。");
    const upgraded = {
      ...structuredClone(old),
      version: 10,
      adventure: {
        ...structuredClone(old.adventure),
        road: freshRoad(),
        mist: freshMist(),
      },
    };
    if (validWorldState(upgraded, 10)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原始数据未被修改。");
  }
  if (x && typeof x === "object" && "version" in x && x.version === 5) {
    const upgraded = {
      ...structuredClone(x),
      version: 10,
      adventure: freshAdventure(true),
    };
    if (validWorldState(upgraded, 10)) return migratePrevious(upgraded);
    throw new Error("旧存档损坏，原始数据未被修改。");
  }
  if (validV4(x))
    return migratePrevious({
      ...structuredClone(x),
      version: 10,
      social: freshSocial(),
      adventure: freshAdventure(true),
    });
  if (
    x &&
    typeof x === "object" &&
    "version" in x &&
    typeof x.version === "number" &&
    x.version >= 4
  )
    throw new Error("存档格式不受支持或已损坏，原始数据未被修改。");
  const old = chapter.migrateSave(x),
    s = lift(old);
  s.journey.learning = { book: s.adventure.step === "done", relic: false };
  s.journey.settled = old.status === "complete";
  return s;
}

function upgradeSpirit(s: State): State {
  const old = s.treasures.equipped as unknown as import("./equipment").Treasure | null;
  s.treasures.equipped = Array.isArray(old) ? old : old ? [old] : [];
  s.treasures.artifacts = [];
  s.growth.medicines.spirit = 0;
  // Preserve ownership and attunement. Old automatic artifact bonuses become explicit deployment.
  // Never invent cultivation; an over-budget old auxiliary is retained in inventory.
  if (equipmentControl(s).error) {
    s.treasures.equipped = [];
    s.treasures.last = "御器规则已更新：原辅器暂收回储物袋，神识容量足够后可重新出战。";
  }
  if (s.outerSea.attuned || s.conclave.attuned) {
    const notice = "御器规则已更新：已温养法宝保留，但需在安全处按神识容量重新选择出战；原自动战力加成已停止。战中不能换装，可先撤退重整。";
    s.treasures.last = [s.treasures.last, notice].filter(Boolean).join(" ");
    s.log.unshift({ month: s.month, kind: "warning", text: notice });
    s.log = s.log.slice(0, 180);
  }
  s.version = SAVE_VERSION;
  s.ascension = null;
  return upgradeConclave(s);
}

function upgradeConclave(s:State):State {
  s.version=SAVE_VERSION;
  s.conclave.victories=[];
  if(s.conclave.duel) s.conclave.duel.effort=null;
  return upgradeNarrative(s);
}

function upgradeNarrative(s: State): State {
  s.spirit = freshSpirit();
  s.goldenStory ??= freshGoldenStory();
  s.lizhao ??= freshLizhao();
  s.nascentSoul ??= freshNascentSoul();
  upgradeImportantScenes(s);
  s.version = SAVE_VERSION;
  s.qiJourney.narrative ??= freshQiNarrative();
  s.secretPact = upgradeSecretPact(s.secretPact);
  if (!validWorldState({...s,version:45},45)) throw new Error("旧存档损坏，原档未修改。");
  return s;
}

function upgradeImportantScenes(s:State):State {
 s.itemGrowth = freshItemGrowth();
 s.qiJourney.narrative ??= freshQiNarrative();
 // Migration preserves existing membership; it never invents an admission or repeats childhood.
 s.qiJourney.narrative.initiation = {...freshInitiation(),arrival:'legacy',kit:'legacy'};
 s.goldenStory.practice ??= null;
 s.goldenStory.teachingPracticeResults ??= [];
 s.nascentSoul.covenant ??= freshCovenant();
 return s;
}
