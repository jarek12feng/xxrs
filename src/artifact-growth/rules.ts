import type { State } from "../world";
import { workshopLock } from "../workshop/rules";
import { spiritReadiness } from "../spirit";
import { executeBattleAction, startBattle, type Move } from "../combat";
import { tacticalPreview, readiness } from "../combat/game";
import { evaluateEquipment, artifactReady } from "../equipment";
import { advanceMonths } from "../timeline";
export type ArtifactAction =
  | { kind: "hear" | "attune" | "withdraw" | "prove" }
  | { kind: "claim"; preparation: "sense" | "herbs" }
  | { kind: "cultivate"; artifact: "tideSeal" | "spiritPearl" }
  | { kind: "move"; move: Move };
export function artifactSite(s: State) {
  return (
    s.realm >= 2 &&
    s.outerSea.met &&
    s.outerSea.location === "ferry" &&
    s.conclave.location === "away" &&
    ["away", "harbor"].includes(s.lizhao.location)
  );
}
export function artifactQuote(s: State, a: ArtifactAction) {
  const p = s.itemGrowth.golden;
  let error = workshopLock(s),
    months = 0,
    stones = 0,
    herbs = 0;
  const need = (bad: boolean, text: string) => {
    if (bad && !error) error = text;
  };
  need(!artifactSite(s), "先回外海古渡或离照港，与药船修士会合");
  need(
    !!s.lizhao.duel ||
      !!s.itemGrowth.trial ||
      !!s.spirit.trial ||
      !!s.nascentSoul.thunder.battle ||
      !!s.nascentSoul.attempt ||
      !!s.nascentSoul.trial ||
      !!s.ascension ||
      !!s.secretPact.hazard ||
      !!s.qiJourney.narrative.duel ||
      (!!s.treasures.auction?.entered && !s.treasures.auction.closed),
    "先结束当前探索或行功",
  );
  if (p.duel) {
    need(a.kind !== "move" && a.kind !== "withdraw", "先结束器室交锋或撤回");
  } else need(a.kind === "move" || a.kind === "withdraw", "当前不在器室交锋中");
  switch (a.kind) {
    case "hear":
      need(p.heard, "旧器谱已经读过");
      break;
    case "claim":
      need(!p.heard, "先在古渡听闻旧器谱");
      need(
        s.lizhao.location !== "harbor" || !s.lizhao.outerCleared,
        "先走通离照分潮石道，再回港准备可选器室",
      );
      need(p.blade !== "none", "剑胚已经取得，不会重复出现");
      need(!["sense", "herbs"].includes(a.preparation), "未知准备方式");
      need(s.injury > 2, "先将伤势养至2以下或等于2");
      need(
        a.preparation === "sense" && spiritReadiness(s).effectiveSense < 28,
        "自行定潮需有效神识28；也可用灵草6护住识海",
      );
      stones = 12;
      herbs = a.preparation === "herbs" ? 6 : 0;
      months = 3;
      break;
    case "attune":
      need(p.blade !== "embryo", "先在离照旧器室争取潮纹剑胚");
      need(spiritReadiness(s).effectiveSense < 24, "温养需有效神识24");
      stones = 24;
      months = 6;
      break;
    case "prove":
      need(p.blade !== "attuned" || p.proven, "先温养潮纹剑；试罡只需完成一次");
      need(
        !s.treasures.artifacts.includes("tideBlade"),
        "先在行囊出战潮纹剑；它占御器容量10",
      );
      months = 1;
      break;
    case "cultivate":
      need(!["tideSeal", "spiritPearl"].includes(a.artifact), "未知法宝");
      need(!artifactReady(s, a.artifact), "先取得并温养原法宝");
      need(
        a.artifact === "tideSeal"
          ? p.seal || s.outerSea.cleared < 2
          : p.pearl || s.conclave.depth < 2,
        "需亲历对应秘境深处，且此宝尚未续炼",
      );
      stones = 24;
      herbs = 4;
      months = 6;
      break;
    case "move":
      need(!["strike", "guard", "discern"].includes(a.move), "未知招式");
      break;
    case "withdraw":
      break;
    default:
      error = "未知器物行动";
  }
  need(s.stones < stones, `需灵石${stones}`);
  need(s.herbs < herbs, `需灵草${herbs}`);
  return { error, months, stones, herbs };
}
export function artifactEnemy(s: State) {
  return {
    name:
      s.itemGrowth.golden.duel?.kind === "proof"
        ? "罡衣试剑石偶"
        : "旧器室守匣傀儡",
    realm: 2 as const,
    stage: 2,
    hp: s.itemGrowth.golden.duel?.kind === "proof" ? 240 : 320,
    attack: 40,
    pattern: ["guard", "strike", "discern"] as const,
  };
}
export function artifactExchange(s: State, move: Move) {
  const d = s.itemGrowth.golden.duel;
  if (!d) return null;
  const e = artifactEnemy(s),
    correct = e.pattern[d.turn % 3] === move;
  const effect = evaluateEquipment(s, {
    kind: "turn",
    move,
    correct,
    previousMove: d.effect as Move,
  });
  const breaking = effect.sources.some(
    (x) => x.source === "tideBlade" && x.effect === "sequence",
  );
  const open = d.effect === "discern" || breaking;
  const quote = tacticalPreview(s, {
    battle: d,
    encounter: e,
    move,
    effect: d.effect,
    adjustments: [
      {
        phase: "exchange",
        damage: open ? 0 : -8,
        incoming: d.preparation === "herbs" ? -3 : -1,
        note: open
          ? breaking
            ? "潮纹剑借蓄势破开罡衣，本合不受罡衣减伤。"
            : "沿前合辨出的罡隙出手，本合不受罡衣减伤。"
          : "罡衣尚合：伤害−8；先辨影，或以潮纹剑守后反击破罡。",
      },
    ],
  });
  return quote ? { ...quote, breaking } : null;
}
export function runArtifactGrowth(
  input: State,
  a: ArtifactAction,
  id: string,
  tick: (s: State) => State,
): State {
  if (!id || input.seen.includes(id)) return input;
  const q = artifactQuote(input, a);
  if (q.error) return input;
  let s = structuredClone(input);
  const elapsed = advanceMonths(s, q.months, {
    tick,
    interrupt: (n) =>
      n.status !== "alive" ||
      n.pending ||
      n.social.scene ||
      (n.outerSea.reminded && !input.outerSea.reminded)
        ? "interrupted"
        : "",
  });
  s = elapsed.state;
  const p = s.itemGrowth.golden;
  const record = (text: string) => {
    p.last = text;
    s.log.unshift({ month: s.month, kind: "story", text });
    s.log = s.log.slice(0, 180);
  };
  if (elapsed.stopped)
    record("潮息被眼前变故打断。已度过的年月保留，未扣材料，也未取得新成果。");
  else {
    s.stones -= q.stones;
    s.herbs -= q.herbs;
    switch (a.kind) {
      case "hear":
        p.heard = true;
        record(
          "药船修士翻出旧器谱：离照分潮石道旁有一间废弃器室，封着未完成的潮纹剑胚。守匣傀儡仍在护器。先打通石道，再带护神药或凝神定潮前往；剑胚与主药分属两路，取不取都不影响凝婴。成器后守势或辨影蓄势，下一次正确反击可破罡；御器容量10，要与印珠取舍。",
        );
        break;
      case "claim":
      case "prove":
        p.duel = {
          ...startBattle(readiness(s).hp, a.kind === "claim" ? 320 : 240),
          kind: a.kind === "claim" ? "claim" : "proof",
          effect: "none",
          broken: false,
          preparation: a.kind === "claim" ? a.preparation : "sense",
        };
        record(
          (a.kind === "claim"
            ? "你沿侧路走入器室。"
            : "你来到药船旁的试罡石台，唤醒试剑石偶。") +
            "傀儡护罡尚合；辨影后可沿缝出手，成器后也可守势蓄剑再反击。最多十八合，败退伤势+1，主动撤退不加伤，准备不退，可休养后重来。",
        );
        break;
      case "withdraw":
        p.duel = null;
        record("你退回药船。未添伤势，已用准备不退，剑胚与旧宝保留。");
        break;
      case "attune":
        p.blade = "attuned";
        record(
          "六个月潮息温养，剑胚裂痕渐合，潮纹剑成。先在行囊出战，再赴试罡石台；普通反击不会额外破罡，须守势或辨影蓄势后正确反击。每次反击耗去前招蓄势，连攻不触发。",
        );
        break;
      case "cultivate":
        if (a.artifact === "tideSeal") p.seal = true;
        else p.pearl = true;
        record(
          a.artifact === "tideSeal"
            ? "镇潮印融入内府潮图：正确守势额外减伤3。"
            : "定神珠依归潮深层拓本续炼：正确辨影额外减伤3。",
        );
        break;
      case "move": {
        const d = p.duel!,
          r = executeBattleAction(
            d,
            s.herbs,
            { turnLimit: 18, resolution: "journey" },
            () => artifactExchange(s, a.move),
          )!;
        Object.assign(d, r.battle);
        d.broken ||= r.exchange.breaking;
        d.effect = a.move;
        s.herbs = r.remainingHerbs;
        record(
          `第${d.turn}合：伤敌${r.damage}，承伤${r.incoming}，回气${r.healing}。${r.exchange.note}`,
        );
        if (r.outcome === "win") {
          p.duel = null;
          if (d.kind === "claim") {
            p.blade = "embryo";
            record(
              "守匣傀儡停转，你亲手解下潮纹剑胚。旧主未成的锋刃仍有裂痕，需回港温养；此处再无第二份剑胚。",
            );
          } else {
            p.proven = d.broken;
            record(
              d.broken
                ? "试罡石偶收住阵势。你亲自以潮纹剑破开罡衣；蓄势与破罡已可用于后续行险，这场试剑不发额外灵石或材料。"
                : "你击倒石偶，但未以潮纹剑蓄势破罡。可再次试剑：守势或辨影后，在反击窗口出剑。",
            );
          }
        } else if (r.outcome === "loss") {
          p.duel = null;
          s.injury = Math.min(6, s.injury + 1);
          record(
            "器室阵势将你逼退，伤势+1。回港静养后可重试；旧器与已得剑胚保留。",
          );
        }
        break;
      }
    }
  }
  s.seen = [...input.seen, id].slice(-512);
  return s;
}

/** Cross-domain save invariants, called after the ordinary chapter validators. */
export function validArtifactState(s: State) {
  const p = s.itemGrowth.golden;
  if (
    s.realm < 2 &&
    (p.heard || p.blade !== "none" || p.seal || p.pearl || p.duel)
  )
    return false;
  if (p.blade !== "none" && !s.lizhao.outerCleared) return false;
  if (p.seal && (!s.outerSea.attuned || s.outerSea.cleared < 2)) return false;
  if (p.pearl && (!s.conclave.attuned || s.conclave.depth < 2)) return false;
  if (
    p.duel &&
    (artifactQuote(s, { kind: "withdraw" }).error ||
      p.duel.enemy > (p.duel.kind === "claim" ? 320 : 240) ||
      (p.duel.kind === "claim" &&
        (!s.lizhao.outerCleared || s.lizhao.location !== "harbor")) ||
      (p.duel.kind === "proof" && !s.treasures.artifacts.includes("tideBlade")))
  )
    return false;
  return true;
}
