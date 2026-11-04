import { inspectInteraction } from "../story-interactions";
import { settleResources } from "../economy";
import { quoteMedicineUse } from "../medicines";
import { advanceMonths } from "../timeline";
import { goldenChance, goldenBreakthroughError, goldenSuccess } from "../progression";
import { resolveTurn, startBattle } from "../combat";
import type { State } from "../world";
import type { Move } from "../expedition/content";
import { tacticalPreview } from "../combat/game";
import { foundationPower } from "../foundation-journey/combat";
export type GoldenAction =
  | {
      kind:
        | "prepare"
        | "fight"
        | "withdraw"
        | "take"
        | "guard"
        | "break"
        | "farShore";
    }
  | { kind: "route"; route: "share" | "alone" }
  | { kind: "move"; move: Move }
  | { kind: "brew"; method: "self" | "commission" }
  | { kind: "site"; site: "rented" | "repaired" | "sect" }
  | { kind: "champion"; reward: "haven" | "guard" };
export const medicineName = "凝露芝心";
export function awardContestMilestones(s: State, previous: number) {
  const g = s.goldenCore;
  const gifts: string[] = [];
  if (previous < 1 && s.sectContest.best >= 1) {
    s.stones += 24;
    s.workshop.ward++;
    gifts.push("修行资助灵石 24、护脉丹 1");
  }
  if (previous < 2 && s.sectContest.best >= 2) {
    g.contestMedicine = true;
    g.medicine++;
    gifts.push(`${medicineName} 1 份，结丹主药已入囊`);
  }
  if (previous < 3 && s.sectContest.best >= 3) {
    g.champion = "pending";
    gifts.push("魁首培养：可在凝丹灵地与一次护持中择一");
  }
  return gifts.join("；");
}
const occupied = (s: State) =>
  s.status !== "alive" ||
  !!s.pending ||
  !!s.social.scene ||
  !!s.social.arena.duel ||
  !!s.foundationJourney.duel ||
  !!s.expedition.duel ||
  !!s.qiJourney.node ||
  !!s.sectContest.duel ||
  !!(s.treasures.auction?.entered && !s.treasures.auction.closed);
export { goldenChance } from "../progression";
export function goldenFoe(s: State) {
  const shared = s.goldenCore.route === "share";
  return {
    hp: shared ? 112 : 145,
    attack: shared ? 23 : 27,
    pattern: ["guard", "discern", "strike"] as const,
    coreOpen: false,
  };
}
export const goldenTells = [
  "石偶双臂合拢，阵风向胸前聚起：先守住来势。",
  "石偶转身封住药床，脚下三处阵眼轮流发亮：辨清真眼。",
  "阵风散去，石偶抬臂露出肩下枢轴：此时反击。",
];
export function goldenExchange(s: State, move: Move) {
  return s.goldenCore.duel
    ? tacticalPreview(s, {
        move: move,
        encounter: goldenFoe(s),
        battle: s.goldenCore.duel,
        effect: s.goldenCore.duel.effect,
        arrayCore: true,
        power: foundationPower(s),
      })
    : null;
}
export function goldenQuote(s: State, a: GoldenAction) {
  const g = s.goldenCore,
    q = s.foundationJourney;
  let stones = 0,
    herbs = 0,
    ward = 0,
    months = 0,
    error = "";
  if (
    ![
      "prepare",
      "fight",
      "withdraw",
      "take",
      "guard",
      "break",
      "farShore",
      "route",
      "move",
      "brew",
      "site",
      "champion",
    ].includes(a.kind)
  )
    error = "未知凝丹操作";
  if (occupied(s)) error = "先处理眼前事件或结束其他交锋";
  else if (q.heroine.expedition && q.rescue < 4)
    error = "先完成古道接应，再筹备凝丹";
  else if (s.realm < 1 || q.cultivation < 200)
    error = "筑基中期后再筹备凝丹机缘";
  if (g.duel) {
    if (
      a.kind === "withdraw" ||
      (a.kind === "move" && ["guard", "strike", "discern"].includes(a.move))
    )
      return { stones, herbs, ward, months, error };
    error ||= "先结束药圃交锋";
  } else if (a.kind === "move") error ||= "尚未开始药圃交锋";
  if (s.realm === 2 && a.kind !== "farShore")
    error ||= "金丹已成，先越过云壁试用新能力";
  if (a.kind === "champion") {
    if (g.champion !== "pending" || !["haven", "guard"].includes(a.reward))
      error ||= "没有待选的魁首培养";
    if (a.reward === "haven" && g.site !== "none")
      error ||= "已有可反复使用的灵地，可选择护持培养";
  } else if (a.kind === "prepare") {
    stones = 12;
    herbs = 2;
    months = 2;
    if (g.expedition !== "idle" || g.medicine + g.pills > 0)
      error ||= "已有主药或成丹，先完成眼前准备";
    if (q.cultivation < 400 || !q.growth.refined)
      error ||= "先完成灵元凝练并修至筑基后期，再赴凝露药圃";
    if (q.location !== "home") error ||= "先回听松行前居整理远行物资";
  } else if (a.kind === "route") {
    months = 1;
    if (g.expedition !== "prepared" || !["share", "alone"].includes(a.route))
      error ||= "先备好药圃行装，再决定分药或独行";
  } else if (a.kind === "fight") {
    months = 1;
    if (g.expedition !== "path") error ||= "先选好药圃路线";
    if (s.injury > 2) error ||= "先撤回静养，伤势须不超过 2";
  } else if (a.kind === "withdraw") {
    if (g.expedition === "idle") error ||= "当前未在药圃";
  } else if (a.kind === "take") {
    months = 1;
    if (g.expedition !== "won") error ||= "先破开守药石偶的禁制";
  } else if (a.kind === "brew") {
    months = a.method === "self" ? 3 : 1;
    stones = a.method === "self" ? 16 : 40;
    herbs = a.method === "self" ? 8 : 2;
    if (
      g.medicine < 1 ||
      g.pills > 0 ||
      !["self", "commission"].includes(a.method)
    )
      error ||= "需一份凝露芝心，且尚无成丹";
    if (a.method === "self" && s.study < 2)
      error ||= "自行炼制需心得 2，可研读或委托丹师";
  } else if (a.kind === "site") {
    months = a.site === "repaired" ? 3 : 1;
    stones = a.site === "rented" ? 32 : a.site === "repaired" ? 12 : 0;
    herbs = a.site === "repaired" ? 4 : 0;
    if (g.site !== "none" || !["rented", "repaired", "sect"].includes(a.site))
      error ||= "灵地已备妥或选择无效";
    if (a.site === "sect" && !g.havenCredit) error ||= "需已选择魁首灵地培养";
    if (a.site === "repaired" && s.sense < 8)
      error ||= "修复旧灵穴需神识 8，可凝神内观或租用灵地";
  } else if (a.kind === "guard") {
    months = 1;
    stones = g.guardCredit ? 0 : 16;
    ward = g.guardCredit ? 0 : 1;
    if (g.guard) error ||= "本次凝丹护持已备妥";
  } else if (a.kind === "break") {
    months = 6;
    error ||= goldenBreakthroughError(s);
  } else if (a.kind === "farShore") {
    months = 1;
    if (s.realm !== 2 || g.farShore) error ||= "金丹初成后可首次越过云壁";
  }
  if (
    !["prepare", "route", "fight", "withdraw", "take", "move"].includes(
      a.kind,
    ) &&
    g.expedition !== "idle"
  )
    error ||= "先退出药圃或取药归来";
  if (
    ["brew", "site", "guard", "break"].includes(a.kind) &&
    q.location !== "home"
  )
    error ||= "回听松行前居筹备凝丹";
  if (["entered", "finished"].includes(s.sectContest.stage))
    error ||= "先与同门道别，离开内比会场";
  if (
    !error &&
    (s.stones < stones || s.herbs < herbs || s.workshop.ward < ward)
  )
    error = `需灵石 ${stones}、灵草 ${herbs}、护脉丹 ${ward}；可劳作、采药或在工坊筹备`;
  if (!error && months && s.limit - s.age <= months)
    error = `此行需 ${months} 月，余寿不足以完成；不可跨过寿尽继续结算`;
  return { stones, herbs, ward, months, error };
}
export function goldenGoal(s: State) {
  const g = s.goldenCore;
  if (s.realm === 2)
    return g.farShore
      ? "你已越过云壁，抵达云外石台，可循海路前往外海古渡。"
      : "金丹已成：试着以丹元护体，独自越过筑基时无法穿过的云壁。";
  if (g.duel)
    return "凝露药圃交锋中：看清石偶阵眼，也可撤回，保留此前修行成果。";
  if (!g.medicine && !g.pills)
    return "争取凝露芝心：宗门内比两胜固定授予，或筑基后期赴凝露药圃取药；不必夺魁。";
  if (!g.pills) {
    const cultivation = s.foundationJourney.epilogue
      ? ""
      : "继续筑基修行，完成长风归流与归山。";
    const site = g.site === "none" ? "另需备好凝丹灵地。" : "";
    return `主药已备：自行炼制或委托丹师取得凝丹丹药。${cultivation}${site}`;
  }
  if (!s.foundationJourney.epilogue)
    return "凝丹丹药已备：继续筑基修行，完成长风归流与归山。";
  return g.site === "none"
    ? "丹药已备：租用或修复灵地，可另备护持后叩关。"
    : `可准备凝丹：当前成功把握 ${goldenChance(s)}%，每次消耗丹药一枚、六个月；失败伤势 +2，保留灵地与修行。`;
}
export function runGolden(
  input: State,
  a: GoldenAction,
  id: string,
  tick: (s: State) => State,
): State {
  const offer = inspectInteraction(input, a, goldenQuote);
  if (!offer.available) return input;
  const cost = offer.quote;
  let s = structuredClone(input);
  const elapsed = advanceMonths(s, cost.months, { tick, interrupt: s => (occupied(s)) ? "interrupted" : "" });
  s = elapsed.state;
  if (elapsed.stopped) {
      record("行程中断，尚未扣除物资；处理眼前事件后可继续筹备。");
      return finish();

  }
  if (settleResources(s, { stones: cost.stones, herbs: cost.herbs, ward: cost.ward }).error) return input;
  const g = s.goldenCore;
  if (a.kind === "champion") {
    g.champion = a.reward;
    if (a.reward === "haven") g.havenCredit = true;
    else g.guardCredit = true;
    record(
      a.reward === "haven"
        ? "师门将一处凝丹静室留给你，使用时不收灵石。"
        : "师门应下一次凝丹护持，叩关前可请长老赴约。",
    );
  }
  if (a.kind === "prepare") {
    g.expedition = "prepared";
    record(
      "你循药谱找到凝露药圃。另一名采药修士柳知微也为结丹而来，她提议合力开阵，各取一份芝心。",
    );
  }
  if (a.kind === "route") {
    g.route = a.route;
    g.expedition = "path";
    record(
      a.route === "share"
        ? "你与柳知微约好各取一份主药。她牵制外阵，你应对石偶；额外药材留给她。"
        : "你另寻一处药床，自行面对完整禁制。柳知微记下边界，双方不争同一株灵药。首通可额外取得灵石 24、清心丹 1。",
    );
  }
  if (a.kind === "fight") {
    const f = goldenFoe(s);
    g.duel = { ...startBattle(foundationPower(s).hp, f.hp), effect: "" };
    record("守药石偶抬起双臂。最多十六合；败退伤势 +1，主动撤回不加伤。");
  }
  if (a.kind === "move") {
    const p = goldenExchange(s, a.move)!,
      d = g.duel!;
    const turn = resolveTurn(d, p, {
      turnLimit: 16,
      resolution: "simultaneous",
    });
    Object.assign(d, turn.battle);
    s.herbs -= turn.herbs;
    d.effect = a.move;
    record(
      `破阵 ${p.damage}、承伤 ${p.incoming}${p.healing ? `，耗草 ${p.herbs} 回气 ${p.healing}` : ""}。${p.note}`,
    );
    if (turn.outcome === "win") {
      g.duel = null;
      g.expedition = "won";
      record("石偶停止追击，药床显露。凝露芝心就在眼前，取药归山后可炼丹。");
    } else if (turn.outcome === "loss") {
      g.duel = null;
      g.expedition = "idle";
      g.route = "none";
      s.injury = Math.min(6, s.injury + 1);
      record(
        "你退出阵风，伤势 +1。药圃位置已知，静养后可重新备齐行装；未失去修行与主线成果。",
      );
    }
  }
  if (a.kind === "withdraw") {
    g.duel = null;
    g.expedition = "idle";
    g.route = "none";
    record("你沿原路撤回，无新增伤势。已投入行装不退还，日后可再来。");
  }
  if (a.kind === "take") {
    const first = g.gathered === 0;
    if (first) {
      if (g.route === "alone") {
        s.stones += 24;
        s.growth.medicines.clarity++;
      } else {
        s.growth.medicines.healing++;
      }
    }
    g.medicine++;
    g.gathered++;
    g.expedition = "idle";
    record(
      g.route === "share"
        ? `${medicineName}一份入囊。柳知微取走约定的药材。${first ? "临别留下一瓶回春散作为首次合作谢礼。" : "你们依旧各取所需。"}`
        : `${medicineName}一份入囊。独行首通另得灵石 24、清心丹 1；重复取药不再发额外物资。`,
    );
    g.route = "none";
  }
  if (a.kind === "brew") {
    g.medicine--;
    g.pills++;
    record(
      `凝丹丹药一枚已成。${a.method === "self" ? "你按药谱缓缓合药。" : "丹师核验主药后完成委托。"}消耗灵石 ${cost.stones}、灵草 ${cost.herbs}，用时 ${cost.months} 月；主药不再留在囊中。`,
    );
  }
  if (a.kind === "site") {
    g.site = a.site;
    if (a.site === "sect") g.havenCredit = false;
    record(
      "凝丹灵地已备妥，失败后仍可使用。修复灵穴灵气稍弱，租用或师门静室更稳；都可结成同等金丹。",
    );
  }
  if (a.kind === "guard") {
    g.guard = true;
    g.guardCredit = false;
    record(
      "凝丹护持已就绪，本次叩关成功把握 +15；叩关后消耗，失败可重新准备。",
    );
  }
  if (a.kind === "break") {
    const chance = goldenChance(s);
    g.pills = quoteMedicineUse("goldenCore", { scene: "golden-breakthrough", count: g.pills, month: s.month }).remaining;
    g.guard = false;
    g.attempts++;
    g.lastChance = chance;
    let seed = s.seed;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    s.seed = seed >>> 0;
    g.lastRoll = Math.floor((s.seed / 4294967296) * 100) + 1;
    if (g.lastRoll <= chance) {
      g.formedAt = s.month;
      Object.assign(s, goldenSuccess(s));
      record(
        `丹元凝成，金丹前期。判定 ${g.lastRoll}/100，成功把握 ${chance}%。寿元总上限基准 500 年，既有减寿保留。你已能以丹元护体穿过云壁，独自走到云外石台。`,
      );
    } else {
      s.injury = Math.min(6, s.injury + 2);
      record(
        `凝丹未成：判定 ${g.lastRoll}/100，成功把握 ${chance}%。消耗丹药一枚、六个月，伤势 +2；灵地、功法和筑基成果保留。静养后可从药圃补取主药，下次把握提高 5（累计最多 10）。`,
      );
    }
  }
  if (a.kind === "farShore") {
    g.farShore = true;
    s.stones += 24;
    record(
      "你以丹元撑开护体灵光，穿过曾将筑基灵元吹散的云壁。无需借道他人的舟阵，独自踏上云外石台，带回一份高处勘路记录，获酬灵石 24。循石台看清海路后，可前往外海古渡寻找新的修行机缘。",
    );
  }
  return finish();
  function record(text: string) {
    s.goldenCore.last = text;
    s.log.unshift({ month: s.month, kind: "major", text });
    s.log = s.log.slice(0, 180);
  }
  function finish() {
    s.seen = [...input.seen, id].slice(-512);
    return s;
  }
}
