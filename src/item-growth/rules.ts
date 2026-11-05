import { nascentActive } from "../nascent-soul/rules";
import type { State } from "../world";
import { spiritInterruption } from "../spirit/rules";
import { spiritReadiness } from "../spirit";
import { quoteSettlement, settleResources } from "../economy";
import { advanceMonths } from "../timeline";
import { storageProfile, validItemGrowthData, type CacheMove } from "./state";
export type ItemGrowthAction =
  | { kind: "inspect" | "withdraw" | "expand" | "restore" }
  | { kind: "enter"; preparation: "sense" | "iron" }
  | { kind: "move"; move: CacheMove }
  | { kind: "collect"; method: "carry" | "pack" }
  | { kind: "reforge"; relic: "sword" | "vial" };
export const cachePhases = ["松动外环", "暗流回卷", "匣口收束"] as const;
export const reforgeEffect = {
  sword: "反击伤害+3，正确辨影伤害+1；装配后生效，保留原器纹。",
  vial: "守势承伤−2，正确辨影承伤−1；装配后生效，仍遵守承伤下限。",
} as const;
export function cacheSite(s: State) {
  return (
    s.realm === 1 &&
    s.foundationJourney.location === "ferry" &&
    s.foundationJourney.won.includes("well") &&
    s.secretPact.site === "away"
  );
}
export function itemGrowthInterruption(s: State) {
  return (
    spiritInterruption(s) ||
    (nascentActive(s) ? "先结束当前行功或试雷" : "") ||
    (s.spirit.trial ? "先结束识海探阵" : "") ||
    (s.sectContest.stage === "entered" ? "先离开宗门大会" : "")
  );
}
export function cachePreview(s: State, move: CacheMove) {
  const t = s.itemGrowth.trial;
  if (!t) return null;
  const turn = t.turn;
  const progress =
    move === "observe"
      ? turn === 0
        ? 2
        : 1
      : move === "brace"
        ? turn === 1
          ? 1
          : 0
        : turn === 0
          ? 2
          : 3;
  const loss =
    move === "observe"
      ? turn === 0
        ? 0
        : turn === 1
          ? 2
          : 1
      : move === "brace"
        ? -1
        : turn === 1
          ? 5
          : turn === 0
            ? 3
            : 2;
  return {
    progress,
    loss,
    stability: Math.min(8, Math.max(0, t.stability - loss)),
    phase: cachePhases[turn],
  };
}
export function itemGrowthQuote(s: State, a: ItemGrowthAction) {
  const p = s.itemGrowth;
  let error = itemGrowthInterruption(s),
    months = 0,
    stones = 0,
    iron = 0;
  const need = (bad: boolean, message: string) => {
    if (bad && !error) error = message;
  };
  const workshop = () =>
    need(
      s.foundationJourney.location !== "home" ||
        s.outerSea.location !== "home" ||
        s.conclave.location !== "away",
      "回听松行前居与坊市整备",
    );
  need(
    !!p.trial && !["move", "withdraw"].includes(a.kind),
    "先收束石匣禁制，或循原路撤回",
  );
  switch (a.kind) {
    case "inspect":
      need(!cacheSite(s), "击退沉井石偶后，在无名渡侧室查看石匣");
      need(p.discovered, "已经辨明石匣来历");
      break;
    case "enter":
      need(!cacheSite(s) || !p.discovered, "先在沉井侧室查看石匣");
      need(!!p.ring || !!p.trial, "已取得遗戒或正在解禁");
      need(!["sense", "iron"].includes(a.preparation), "未知定阵方式");
      need(s.injury > 2, "先将伤势养至2以下或等于2");
      need(
        a.preparation === "sense" && spiritReadiness(s).effectiveSense < 12,
        "自行定阵需有效神识12；也可用玄铁料1稳阵",
      );
      iron = a.preparation === "iron" ? 1 : 0;
      months = 1;
      break;
    case "move":
      need(
        !p.trial || !["observe", "brace", "reach"].includes(a.move),
        "当前没有可应对的石匣禁制",
      );
      break;
    case "withdraw":
      need(!p.trial, "当前未在石匣解禁");
      break;
    case "collect":
      need(!cacheSite(s) || !p.discovered, "在沉井侧室辨明余材后收取");
      need(p.collected >= 2, "两块沉纹器髓已经取尽，不再刷新");
      need(!["carry", "pack"].includes(a.method), "未知收取方式");
      need(
        a.method === "carry" && storageProfile(p).remaining < 2,
        "一块器髓需大件载荷2；可扩容、取戒或请渡工分匣封装",
      );
      stones = a.method === "pack" ? 12 : 0;
      break;
    case "expand":
      workshop();
      need(p.reinforced || !!p.ring, "现有容器已足够，无须另扩旧袋");
      stones = 32;
      months = 1;
      break;
    case "restore":
      workshop();
      need(p.ring !== 1, "先取得尚未修复的栖尘戒");
      need(
        s.spirit.manual !== "learned" || spiritReadiness(s).effectiveSense < 18,
        "需研修分念诀且有效神识18，才能分辨内层空间",
      );
      stones = 24;
      months = 3;
      break;
    case "reforge":
      workshop();
      need(!["sword", "vial"].includes(a.relic), "未知主器");
      need(
        s.realm < 1 || s.journey.relics[a.relic] !== 2,
        "先将所选灵器精炼至二阶",
      );
      need(!!p.reforged[a.relic], "此器已经重铸");
      need(p.ore + p.packedOre < 1, "需从沉井侧室带回沉纹器髓1");
      stones = 24;
      iron = 1;
      months = 3;
      break;
    default:
      error = "未知道具成长行动";
  }
  if (!error) error = quoteSettlement(s, { stones, iron }).error;
  return { error, months, stones, iron };
}
export function runItemGrowth(
  input: State,
  a: ItemGrowthAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (!id || input.seen.includes(id)) return input;
  const quote = itemGrowthQuote(input, a);
  if (quote.error) return input;
  let s = structuredClone(input);
  const record = (text: string) => {
    s.itemGrowth.last = text;
    s.log.unshift({ month: s.month, kind: "story", text });
    s.log = s.log.slice(0, 180);
  };
  const elapsed = advanceMonths(s, quote.months, {
    tick,
    interrupt: (s) =>
      s.status !== "alive" || s.pending || s.social.scene ? "interrupted" : "",
  });
  s = elapsed.state;
  if (elapsed.stopped) {
    record(
      "筹备暂歇：已耗年月保留，未扣灵石或材料，也未取得新成果。先处理眼前变故，再安排。",
    );
    s.seen = [...s.seen, id].slice(-512);
    return s;
  }
  if (settleResources(s, { stones: quote.stones, iron: quote.iron }, {}).error)
    return input;
  const p = s.itemGrowth;
  switch (a.kind) {
    case "inspect":
      p.discovered = true;
      record(
        "石匣铭文说，旧主人原想修复沉井的空间禁制，终在寿元将尽时留下栖尘戒与两块沉纹器髓：“稳住回卷，再取我未成之器。”戒的外层仍可收物，内层封闭；匣外器髓可重铸旧灵器。先辨松动外环，回卷时托住阵脚，待匣口收束再取戒。",
      );
      break;
    case "enter":
      p.trial = { turn: 0, stability: 6, progress: 0 };
      record(
        "你将神念与石匣外环接上。三段禁制内解开6重纹路且稳定度仍大于0，便能取戒。强取失败伤势+1；收念撤回不添伤，已用准备不退。",
      );
      break;
    case "move": {
      const v = cachePreview(s, a.move)!,
        t = p.trial!;
      t.stability = v.stability;
      t.progress += v.progress;
      t.turn++;
      record(
        `${v.phase}：解禁+${v.progress}，稳定度${v.loss > 0 ? "−" : "+"}${Math.abs(v.loss)}；现余${t.stability}，纹路${t.progress}/6。`,
      );
      if (t.stability === 0 || t.turn === 3) {
        if (t.stability > 0 && t.progress >= 6) {
          p.ring = 1;
          record(
            "回卷归于匣口，你接住落下的栖尘戒。神念探入，外层已有四份大件载荷，足以一次带走两块沉纹器髓；内层仍有封印，分念诀研修后可再尝试修复。先收取余材，再决定为哪件旧器重铸。",
          );
        } else {
          s.injury = Math.min(6, s.injury + 1);
          record(
            "空间回卷将你的手推离石匣，伤势+1。戒与余材仍留在原处；现有家当未损，可静养后重新准备。",
          );
        }
        p.trial = null;
      }
      break;
    }
    case "withdraw":
      p.trial = null;
      record(
        "你沿已辨明的阵纹收回神念，未添伤势。准备年月与材料不返还，石匣仍可再探。",
      );
      break;
    case "collect":
      p.collected++;
      if (a.method === "carry") p.ore++;
      else p.packedOre++;
      record(
        a.method === "carry"
          ? `沉纹器髓收入${storageProfile(p).name}，占大件载荷2。回听松坊市可用它重铸二阶灵剑或灵瓶；本处余材仅剩${2 - p.collected}块。`
          : `渡工将器髓分匣封装，花灵石12，作为普通封装材料携带，不占大件载荷。回听松可重铸旧器；本处余材仅剩${2 - p.collected}块。`,
      );
      break;
    case "expand":
      p.reinforced = true;
      record(
        "坊市匠人补齐储物袋的承载纹，大件载荷1→2。如今能自行带回一块沉纹器髓；普通补给收纳照旧。",
      );
      break;
    case "restore":
      p.ring = 2;
      record(
        "你依分念诀分开内外两道神念，接续戒中断纹。三月后栖尘戒内外贯通，大件载荷4→6，内层可隔存药材：自炼或委托回春散、清心丹、养神丹与护脉丹，每炉节省灵草1。突破丹与购买成品不减料。",
      );
      break;
    case "reforge":
      if (p.ore) p.ore--;
      else p.packedOre--;
      p.reforged[a.relic] = true;
      record(
        `${a.relic === "sword" ? "听松灵剑" : "归元灵瓶"}重铸完成。沉纹器髓融入旧器，原精炼与器纹保留。${reforgeEffect[a.relic]}带到沉井试运、雪线或下一场交锋，便能用出新得的器性。`,
      );
      break;
  }
  s.seen = [...s.seen, id].slice(-512);
  return s;
}
export function validItemGrowth(s: State) {
  const p = s.itemGrowth;
  if (!validItemGrowthData(p)) return false;
  if (
    p.discovered &&
    (s.realm < 1 || !s.foundationJourney?.won?.includes("well"))
  )
    return false;
  if (p.ring === 2 && (s.spirit?.manual !== "learned" || s.sense < 18))
    return false;
  if (
    (p.reforged.sword && s.journey?.relics.sword !== 2) ||
    (p.reforged.vial && s.journey?.relics.vial !== 2)
  )
    return false;
  if (p.trial && (!cacheSite(s) || itemGrowthInterruption(s))) return false;
  return true;
}
