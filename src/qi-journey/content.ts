import type { InitiationAction } from '../initiation/rules';
import type { QiNarrativeAction } from "./narrative";
import type { PersonAction } from "./people";
import type { PreparationAction } from "./preparation";
import type { Move } from "../expedition/content";
export const qiSites = [
  {
    name: "药谷淬脉泉",
    material: "凝露草",
    stage: 1,
    qi: 120,
    fee: 6,
    image: "/art/qi-progression/medicine-valley-spring.webp",
    intro:
      "温蘅指向山谷：凝露草只在淬脉泉旁结露。先看住泉口妖兽，再取一株温养经脉。",
    enemies: [
      {
        name: "赤背岩獾",
        identity: "redback-badger",
        kind: "妖兽",
        image: "/art/qi-people-beasts/redback-badger.webp",
        trait: "背甲护体：没有露腹时反击伤害降低 4。",
        hp: 76,
        attack: 15,
        pattern: ["guard", "strike", "discern"] as Move[],
        tells: [
          "岩獾伏低身体，背甲绷紧。",
          "扑击落空，腹部露出。",
          "碎石间传来两处爪声。",
        ],
      },
      {
        name: "护泉青鳞蟒",
        identity: "spring-python",
        kind: "妖兽",
        image: "/art/qi-people-beasts/spring-python.webp",
        trait: "借水藏身：倒影起手时若未辨影，承伤增加 3。",
        hp: 100,
        attack: 18,
        pattern: ["discern", "guard", "strike", "guard"] as Move[],
        tells: [
          "水面倒影先动，真身仍在草下。",
          "蛇尾横扫泉口。",
          "吐息后鳞甲短暂张开。",
          "盘身收紧，准备再扫。",
        ],
      },
    ],
  },
  {
    name: "青石遗府·凝元内府",
    material: "凝元晶髓",
    stage: 2,
    qi: 240,
    fee: 10,
    image: "/art/qi-progression/qingshi-inner-platform.webp",
    intro:
      "青石遗府的丹方旁藏有内府图，须先探府取得。成丹能助筑基，但要让经脉承受药力，还需取出石台中的凝元晶髓。",
    enemies: [
      {
        name: "巡廊石傀",
        identity: "corridor-guardian",
        kind: "傀儡",
        image: "/art/qi-people-beasts/corridor-guardian.webp",
        trait: "假身护阵：正确辨影时伤害额外增加 3。",
        hp: 112,
        attack: 18,
        pattern: ["discern", "strike", "guard"] as Move[],
        tells: [
          "两具假身映在廊柱上。",
          "阵纹回收，胸口失去遮护。",
          "石臂抬起，廊顶落尘。",
        ],
      },
      {
        name: "凝元守台傀儡",
        identity: "platform-guardian",
        kind: "傀儡",
        image: "/art/qi-people-beasts/platform-guardian.webp",
        trait: "阵核开合：先守势蓄力，再反击；或辨影后接反击。",
        hp: 150,
        attack: 20,
        pattern: ["guard", "discern", "strike", "guard"] as Move[],
        tells: [
          "双臂蓄起石屑，重砸将落。",
          "石台亮起假阵眼。",
          "阵核露出，光芒暂熄。",
          "脚下石台震动，余波将至。",
        ],
      },
    ],
  },
] as const;
export const qiRoutes = {
  medicine: {
    name: "药理护身",
    hint: "灵草 4；气势上限 +12。对护泉青蟒守住一合，可诱出下合鳞缝并减轻来势。",
  },
  sword: { name: "剑意开路", hint: "剑意 4；伤害 +3，承伤 +1，适合速战。" },
  array: {
    name: "识阵寻隙",
    hint: "神识 8、心得 2；正确辨影时额外伤害 +3、承伤 −2。",
  },
} as const;
export type QiAction =
  | InitiationAction
  | QiNarrativeAction
  | PersonAction
  | PreparationAction
  | "buy:healing"
  | "buy:sword"
  | "buy:vial"
  | "enter:medicine"
  | "enter:sword"
  | "enter:array"
  | "guard"
  | "strike"
  | "discern"
  | "withdraw"
  | "herbs"
  | "sense"
  | "force"
  | "ward"
  | "relic"
  | "meridian"
  | "refine"
  | "mentor"
  | "artisan"
  | "commission:herbs"
  | "commission:healing"
  | "commission:survey";
export const commissions = {
  herbs: {
    name: "温蘅：药庐补货",
    need: "交付灵草 4",
    reward: "灵石 16；筹备淬脉泉护身药",
    text: "温蘅收好药篓，付清药钱：“别空手进泉谷。若走药理一路，多带几株护身。”",
  },
  healing: {
    name: "季衡：护送队伤药",
    need: "交付回春散 2；炼气中期开放",
    reward: "灵石 24；门内弟子另得贡献 2",
    text: "季衡把药递给归队弟子：“伤药收下，工钱在此。想试身手便去听松榜，看看自己还差在哪一招。”",
  },
  survey: {
    name: "郁青：内府行路图",
    need: "完成淬脉，心得 2、神识 8",
    reward: "灵石 20；为凝元内府筹措补给",
    text: "郁青照着你的泉谷记录补齐图角，付下图资：“内府的石台还在运转。若要进去，先备好退路。”",
  },
} as const;
