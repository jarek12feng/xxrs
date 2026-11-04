import { nascentPromises } from './promises';
import { spiritReadiness } from "../spirit";
import { thunderExchange, thunderMethodNames } from "./thunder";
import type { State } from "../world";
import { projectInteractions } from "../story-interactions";
import {
  nascentActive as nascentActiveForView,
  nascentQuote,
  nascentTrialPreview,
  nascentStepPreview,
  type NascentAction,
} from "./rules";
export type NascentObject =
  "method" | "trial" | "letters" | "companion" | "furnace" | "chamber" | "gate";
export function nascentInteractions(s: State) {
  const n = s.nascentSoul;
  const rows: {
    label: string;
    action: NascentAction;
    object: NascentObject;
  }[] = [];
  const add = (object: NascentObject, label: string, action: NascentAction) =>
    rows.push({ object, label, action });
  if (n.thunder.battle) {
    for (const [move, label] of [
      ["guard", "护体承雷"],
      ["strike", "破开雷脉"],
      ["discern", "辨势导雷"],
    ] as const) {
      const p = thunderExchange(s, move, true)!;
      add(
        "chamber",
        `${label} · 削雷${p.damage} / 承伤${p.incoming}${p.healing ? ` / 耗草${p.herbs}回气${p.healing}` : ""}`,
        { kind: "thunderMove", move, useHerbs: true },
      );
    }
    add(
      "chamber",
      n.thunder.battle.kind === "tribulation"
        ? "散功退劫 · 丹药已耗，伤势2"
        : "退出试雷 · 可调整准备后重试",
      { kind: "withdraw" },
    );
  } else if (n.trial) {
    for (const [move, label] of [
      ["body", "护体回元"],
      ["mind", "守神调息"],
      ["break", "破开禁纹"],
    ] as const) {
      const p = nascentTrialPreview(s, move)!;
      add(
        "trial",
        `${label} · 耗丹元${p.powerCost} 回丹元${p.recover} / 身损${p.bodyLoss} 神损${p.mindLoss} / 破印${p.seals}`,
        { kind: "trialMove", move },
      );
    }
    add("trial", "撤出禁室", { kind: "withdraw" });
  } else if (n.attempt) {
    for (const [move, label] of [
      ["release", "直释丹元"],
      ["channel", "循脉导出"],
      ["anchor", "锚定识海"],
      ["observe", "照察灵流"],
      ["unite", "身神合一"],
      ["circulate", "周流相合"],
    ] as const) {
      const p = nascentStepPreview(s, move)!;
      if (!p.allowed) continue;
      add(
        "chamber",
        `${label} · 丹元${p.flow >= 0 ? "耗" : "回"}${Math.abs(p.flow)} / 心神${p.spirit >= 0 ? "耗" : "回"}${Math.abs(p.spirit)} / 稳定损${p.loss}`,
        { kind: "step", move },
      );
    }
    add("chamber", "中止叩关 · 丹药不返还，伤势2", { kind: "withdraw" });
  } else if (s.realm === 3) {
    if (!n.emerged) add("gate", "稳固半年，出关报平安", { kind: "emerge" });
    else if (["none", "deferred"].includes(n.celebration)) {
      for (const [choice, label] of [
        ["simple", "行简礼"],
        ["formal", "正式观礼"],
        ["deferred", "暂缓大典"],
      ] as const)
        for (const [office, job] of [
          ["declined", "谢绝新职务"],
          ["accepted", "承担有限护路职责"],
        ] as const)
          if (!(choice === "deferred" && n.celebration === "deferred")) add("gate", `${label}，${job}`, {
            kind: "celebrate",
            choice,
            office,
          });
    }
    if (n.emerged && n.celebration !== "none" && n.ability === "none")
      add("gate", "赴古渡潮隙，探明潮隙乱流", { kind: "survey" });
    else if (n.ability === "surveyed")
      add("gate", "展开元婴护持，稳住渡口", { kind: "shelter" });
    else if (n.ability === "sheltered")
      add("gate", "带测绘队渡过险段，带回记录", { kind: "cross" });
  } else {
    if (!n.thunder.discovered)
      add("method", "携归潮与离照所得，核对元婴续篇", {
        kind: "discoverMethod",
      });
    for (const method of ["continuity", "stillness"] as const)
      if (n.thunder.method !== method)
        add(
          "method",
          `研习${thunderMethodNames[method]} · ${method === "continuity" ? "接续原主修，破雷+8" : "守神护体，护体+6"}`,
          { kind: "studyMethod", method },
        );
    if (!n.thunder.practiced)
      add("method", "登近岸试雷台，以自身功法法宝验法", {
        kind: "practiceThunder",
      });
    if (!n.trialWon)
      add("trial", "开启禁室综合考验 · 六轮破六印", { kind: "trial" });
    if (n.trialWon && s.conclave.stage === 2)
      add("trial", "融汇丹元，突破金丹圆满", { kind: "complete" });
    if (s.conclave.stage === 3) {
      for (const [topic, choice, label] of [
        ["duty", "handover", "交接已受托的账册与职责"],
        ["duty", "decline", "说明暂不任新职，交还已领事项"],
        ["home", "letter", "循药路寄出家书"],
        ["home", "remember", "收好旧物，承认已逝的年月"],
        ["promise", "entrust", "托付仍未完成的联络与线索"],
        ["promise", "carry", "记下旧约，出关后继续承担"],
        ["companion", "explain", "向实际相识同道说明长关计划"],
        ["companion", "solitary", "独自立愿，留下急讯办法"],
      ] as const)
        if (nascentPromises(s)[topic]) add("letters", label, { kind: "commit", topic, choice });

    }
    if (!n.marrowClaimed)
      add("furnace", "将归潮灵髓转入丹匣", { kind: "claimMarrow" });
    else add("furnace", "循归潮药床轮采约定补主药", { kind: "renewMarrow" });
    if (!n.reviewed)
      add("furnace", "复核离照药理 · 行功稳定加1，每炉少耗灵草2", {
        kind: "review",
      });
    add("furnace", "自炼化婴丹 · 稳火确定成丹", {
      kind: "brew",
      method: "self",
      fire: "steady",
    });
    add("furnace", "委托化婴丹 · 确定成丹", {
      kind: "brew",
      method: "commission",
      fire: "steady",
    });
    for (const [choice, label] of [
      ["independent", "依离照阵理修复古渡旧静室"],
      ["shared", "以实测成果换用合作灵地"],
    ] as const)
      if (n.land !== choice) add("chamber", label, { kind: "land", choice });
    for (const [choice, label] of [
      ["array", "布设外护阵 · 渡劫护体加3"],
      ["friends", "约定轮值护持 · 渡劫气势加18"],
    ] as const)
      if (n.protection !== choice)
        add("chamber", label, { kind: "protection", choice });
    for (const [choice, label] of [
      [
        "balanced",
        `均衡丹元7 / 心神${7 + spiritReadiness(s).breakthroughBonus}`,
      ],
      ["flow", `丹元9 / 心神${5 + spiritReadiness(s).breakthroughBonus}`],
      [
        "spirit",
        `丹元5 / 心神${Math.min(12, 9 + spiritReadiness(s).breakthroughBonus)}`,
      ],
    ] as const)
      if (n.strategy !== choice)
        add("chamber", label, { kind: "strategy", choice });
    if (s.injury) add("chamber", "免费静养一月 · 伤势减1", { kind: "recover" });
    add(
      "chamber",
      `服一枚化婴丹 · 全程30月，预计${Math.floor((s.age + 30) / 12)}岁${(s.age + 30) % 12}月迎劫`,
      { kind: "begin" },
    );
  }
  if (!nascentActiveForView(s) && s.conclave.stage === 3) {
    if (s.social.met) add("companion", "循近期来信约见 · 半年、灵石6", { kind: "contact" });
      const bonded = s.foundationJourney.bond === "covenant";
      const lover = s.social.bonded || s.foundationJourney.bond === "promised";
      if (["none", "deferred"].includes(n.ceremony) || (n.ceremony === "solitary" && (lover || bonded))) {
        if (bonded)
          add("companion", "重温旧约，各自的远行仍由自己决定", {
            kind: "ceremony",
            choice: "renew",
          });
        else if (lover)
          add("companion", n.ceremony === "deferred" ? "再点院中灯，续议结契" : "商议结契", {
            kind: "ceremony",
            choice: "discuss",
          });
        else
          add("companion", "先安心叩关", {
            kind: "ceremony",
            choice: "solitary",
          });
        if ((lover || bonded) && n.ceremony === "none") add("companion", "先各自修行，暂缓仪式", {
          kind: "ceremony",
          choice: "defer",
        });
      }
      if (n.ceremony === "discussed") {
        add("companion", "请愿意到场的道友见证", {
          kind: "ceremony",
          choice: "witness",
        });
        add("companion", "暂缓行礼", { kind: "ceremony", choice: "defer" });
      }
      if (n.ceremony === "witnessed")
        add("companion", "礼后共餐，收好契约与旧图", {
          kind: "ceremony",
          choice: "meal",
        });
  }
  return rows.map((row) => ({
    ...row,
    ...projectInteractions(s, [row], nascentQuote)[0]!,
  }));
}
export const nascentHotspots = [
  { id: "method", label: "元婴玉简与试雷台", x: 30, y: 32 },
  { id: "trial", label: "试丹禁室", x: 29, y: 48 },
  { id: "letters", label: "信函与旧约", x: 18, y: 73 },
  { id: "companion", label: "行前约书", x: 44, y: 66 },
  { id: "furnace", label: "丹炉与药匣", x: 65, y: 64 },
  { id: "chamber", label: "灵地与护持", x: 77, y: 43 },
  { id: "gate", label: "出关石门", x: 50, y: 33 },
];

export const nascentContentBoundary = "本卷至元婴初成与首次护渡。元婴长期成长、伙伴凝婴与回星墟远行尚未开放。";
