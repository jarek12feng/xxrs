import { assayMoves, assayLabels, assayMethod } from "./assay";
import type { State } from "../world";
import { projectInteractions } from "../story-interactions";
import { lizhaoQuote, type LizhaoAction } from "./rules";
export function lizhaoOptions(s: State) {
  const l = s.lizhao,
    rows: { label: string; action: LizhaoAction; object: string }[] = [];
  const add = (object: string, label: string, action: LizhaoAction) =>
    rows.push({ object, label, action });
  if (l.duel) return [];
  if (l.location === "away") add("path", "循海路赴离照", { kind: "visit" });
  if (l.location === "harbor") {
    if (l.route === "none") {
      add("friends", "与药船修士合作探路 · 行装较省、伤害 +3", {
        kind: "route",
        route: "cooperate",
      });
      add("friends", "独立勘探 · 自筹行装，保留自己的成果", {
        kind: "route",
        route: "independent",
      });
    } else if (!l.cleared) {
      if (l.preparation !== "ward")
        add("supplies", "准备护潮符 · 每合承伤 −8", {
          kind: "prepare",
          preparation: "ward",
        });
      if (l.preparation !== "purify")
        add("supplies", "准备净药囊 · 每合积毒 −10", {
          kind: "prepare",
          preparation: "purify",
        });
      add("path", l.outerCleared ? "直抵内层 · 取药交锋有陨落风险" : "踏上分潮石道", {
        kind: "enter",
      });
    }
    if (s.injury || l.recovery)
      add("supplies", "治伤排毒 · 伤势 −2，残毒清除", { kind: "recover" });
    if (l.cleared) {
      add("path", "前往旧丹室", { kind: "chamber" });
      if (l.recipeVerified)
        add("supplies", "轮取一份定性辅药", { kind: "resupply" });
    }
    if (l.pursuit === "rumor")
      add("friends", "听药船管事带来的航线消息", { kind: "rumor" });
    if (l.pursuit === "warned") {
      add("friends", "雇伴同行 · 应战承伤 −6", {
        kind: "respond",
        response: "company",
      });
      add("friends", "先赴浅礁设伏 · 前两合伤害 +14", {
        kind: "respond",
        response: "ambush",
      });
      add("friends", "绕北侧旧航道 · 半年，结束此次追索", { kind: "bypass" });
    }
    add("exit", "返回外海古渡", { kind: "leave" });
  }
  if (l.location === "outer") {
    add("path", l.outerCleared ? "深入药池 · 内层有陨落风险，可先回港整备" : "应对分潮禁阵", {
      kind: l.outerCleared ? "deeper" : "fight",
    });
    add("exit", "沿石道回港", { kind: "return" });
  }
  if (l.location === "inner") {
    add("path", l.cleared ? "进入旧丹室" : "应对守炉傀儡、亲自取药 · 气势耗尽或积毒100会陨落", {
      kind: l.cleared ? "chamber" : "fight",
    });
    add("exit", "沿石道回港", { kind: "return" });
  }
  if (l.location === "chamber") {
    if (!l.recipeVerified) {
      if(l.assay.phase==="idle")add("furnace", "备普通灵草试炉 · 不动封存辅药", {kind:"verify"});
      else {
        for (const move of assayMoves) {
          const q = assayMethod(s, move);
          const forecast = move === "discard" ? "封存辅药保留" :
            `${q.months}月 · 潮息${q.next.tide} / 分药${q.next.separation} / 负担${q.next.strain}${q.next.phase === "stable" ? " · 药理验成" : move === "bind" ? " · 将失稳，药性保留" : ""}`;
          add("furnace", `${assayLabels[move]} · ${forecast}`, {kind:"assay",move});
        }
      }
    }
    add("exit", "带着药瓶回港", { kind: "return" });
  }
  if (
    ["harbor", "chamber"].includes(l.location) &&
    l.recipeVerified &&
    l.allocation === "none"
  ) {
    add("friends", "公开排潮记录，余药按出力分取", {
      kind: "allocate",
      allocation: "share",
    });
    add("friends", "保留自己的所得，不动他人订药", {
      kind: "allocate",
      allocation: "private",
    });
    add("friends", "扣下邵荃订药 · 多得一份，可能遭追索；日后补药加价", {
      kind: "allocate",
      allocation: "seize",
    });
  }
  if (l.location === "bay") {
    if (l.pursuit === "confront")
      add("opponent", "应战韩砺舟 · 气势耗尽或积毒100会陨落，可主动撤离", { kind: "fight" });
    add("opponent", "赔偿原订户、当面解除雇契", { kind: "negotiate" });
    if (l.pursuit === "defeated") {
      add("opponent", "带雇契归港，揭露私雇夺药", { kind: "expose" });
      add("opponent", "命他断约，放他负伤离去", { kind: "spare" });
      add("opponent", "杀死韩砺舟 · 他不再出现，私人接应断绝", {
        kind: "kill",
      });
    }
    add("exit", "循退路回港，暂缓应对", { kind: "withdraw" });
  }
  return projectInteractions(s, rows, lizhaoQuote).map((row, i) => ({
    ...row,
    object: rows[i]!.object,
  }));
}
