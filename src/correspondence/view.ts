import { seaQuote } from "../outer-sea/rules";
import type { State } from "../world";
import type { Letter } from "./state";
import { auctionLocationError, auctionVenues } from "../auction/venues";
import { venueAuction, auctionTimingWarnings } from "../auction";
import { travelQuote } from "../wayfaring/rules";
import { pactDestinationError } from "../secret-pact/revision";
export function correspondenceThread(id: string): string {
  if (id.startsWith("friend:su:")) return "friend:su";
  if (id.startsWith("tide:")) return id.split(":").slice(0, 2).join(":");
  if (id.startsWith("auction:")) return id.split(":").slice(0, 3).join(":");
  if (id.startsWith("sea:ruins")) return "sea:ruins";
  if (id.startsWith("arena:foundation:")) return "arena:foundation";
  if (id.startsWith("arena:qi:")) return "arena:qi";
  if (/^(personal|answer):/.test(id)) return `contact:${id.split(":")[1]}`;
  if (id.startsWith("reunion:")) return "reunion";
  if (id.startsWith("pact:")) return "pact";
  if (id.startsWith("rescue:")) return "rescue";
  if (id.startsWith("companion:")) return "companion";
  if (id.startsWith("conclave:")) return `conclave:${id.split(":").at(-1)}`;
  return id; // Auction editions and unrelated announcements never merge.
}
export function messageThreads(letters: readonly Letter[]) {
  const groups = new Map<string, Letter[]>();
  for (const l of letters) {
    const key = correspondenceThread(l.id);
    const group = groups.get(key) ?? [];
    group.push(l);
    groups.set(key, group);
  }
  const order = new Map(letters.map((letter, index) => [letter.id, index]));
  return [...groups]
    .map(([id, items]) => ({
      id,
      letters: items,
      title:
        id === "friend:su" ? "苏婉宁的勘潮行程" : id === "contact:su"
          ? "与苏婉宁的书信"
          : id === "contact:ye"
            ? "与叶照的书信"
            : id === "reunion"
              ? "古渡重逢与同行"
              : id === "pact"
                ? "照玄探府之约"
                : id === "rescue"
                  ? "古道接应往来"
                  : id === "companion"
                    ? `${items[0]!.sender}的来信`
                    : items[0]!.title,
      latest: items[items.length - 1]!,
      unread: items.filter((l) => !l.read).length,
    }))
    .sort((a, b) => order.get(b.latest.id)! - order.get(a.latest.id)!);
}
export interface Commitment {
  id: string;
  title: string;
  place: string;
  deadline: number | null;
  travelMonths: number | null;
  preparation: string;
  destination: Letter["destination"];
}
/** Never guesses a zero journey when a route is unavailable. */
function inlandTime(s: State, to: "estate" | "home" | "pact"): number | null {
  const plans = (["land", "flight"] as const)
    .map((mode) => travelQuote(s, to, mode))
    .filter((q) => !q.error);
  return plans.length ? Math.min(...plans.map((q) => q.remaining)) : null;
}
export function commitments(s: State): Commitment[] {
  const letters = s.correspondence.letters,
    result: Commitment[] = [];
  if (
    letters.some((l) => l.id.startsWith("pact:")) &&
    s.realm === 1 &&
    ["promised", "inside", "betrayed", "resolved"].includes(
      s.secretPact.stage,
    ) &&
    s.secretPact.trial !== "complete"
  ) {
    const error = pactDestinationError(s, "zhaoxuan");
    result.push({
      id: "pact",
      title: "照玄同行之约",
      place: "照玄遗府",
      deadline: null,
      travelMonths:
        s.secretPact.site === "zhaoxuan" ? 0 : inlandTime(s, "pact"),
      preparation:
        s.secretPact.site === "zhaoxuan"
          ? "已抵达，按现场险阵与分宝进度继续。"
          : error ||
            (s.injury > 2
              ? "先将伤势养至2或以下，再入府。"
              : "修为与取材条件已具备，备好护持后赴府。"),
      destination: "world",
    });
  }
  if (
    s.realm === 2 &&
    !["none", "departed"].includes(s.goldenStory.reunion.stage)
  ) {
    const here =
      s.outerSea.location === "ferry" &&
      s.conclave.location === "away" &&
      s.lizhao.location === "away" &&
      !s.wayfaring.passage;
    const route = seaQuote(s, { kind: "sail" });
    result.push({
      id: "reunion",
      title: "古渡侧堤之约",
      place: "外海古渡 · 侧堤",
      deadline: null,
      travelMonths: here ? 0 : route.error ? null : route.months,
      preparation:
        "没有固定会期。到古渡的侧堤故人之约续做；已完成的布锚与测读保留。",
      destination: "story",
    });
  }
  for (const l of letters.filter(
    (l) => l.followed && l.id.startsWith("auction:"),
  )) {
    const [, key, edition] = l.id.split(":");
    if (key !== "market" && key !== "foundation" && key !== "golden") continue;
    const def = auctionVenues[key],
      saved = venueAuction(s, key);
    if (
      l.expires === null ||
      s.month >= l.expires ||
      (saved?.number === Number(edition) && (saved.closed || saved.entered))
    )
      continue;
    const here = !auctionLocationError(s, key);
    result.push({
      id: l.id,
      title: `${def.name}第${edition}届`,
      place: def.place,
      deadline: l.expires,
      travelMonths: here
        ? 0
        : key === "golden"
          ? seaQuote(s, { kind: "guild" }).error
            ? null
            : seaQuote(s, { kind: "guild" }).months
          : key === "foundation"
            ? inlandTime(s, "estate")
            : null,
      preparation: `第${l.expires - def.window}月开场，第${l.expires}月截止入场。准备灵石与竞价预算；关注不等于报名。`,
      destination: "world",
    });
  }
  const t = s.sectContest;
  if (
    letters.some((l) => l.id === `contest:${t.edition}` && l.followed) &&
    ["invited", "preparing"].includes(t.stage) &&
    s.month < t.starts + 12
  )
    result.push({
      id: `contest:${t.edition}`,
      title: "听松内比",
      place: "听松山门",
      deadline: t.starts + 12,
      travelMonths:
        s.foundationJourney.location === "home" &&
        s.outerSea.location === "home" &&
        !s.wayfaring.trip &&
        !s.wayfaring.passage
          ? 0
          : inlandTime(s, "home"),
      preparation: `第${t.starts}月开场，须在一年会期内回山办理赴会。`,
      destination: "story",
    });
  if (
    s.outerSea.notice !== null &&
    letters.some((l) => l.id.startsWith("conclave:") && l.followed) &&
    s.conclave.location === "away" &&
    s.conclave.wins === 0
  )
    result.push({
      id: "conclave",
      title: "诸宗会谷之约",
      place: "外海古渡 → 诸宗会谷",
      deadline: null,
      travelMonths: null,
      preparation: `第${s.outerSea.notice + 600}月正会；之后仍有补试。沿古渡已有行程赴会，原会期停关规则保留。`,
      destination: "story",
    });
  return result;
}
export function commitmentWarnings(s: State, months: number): string[] {
  if (!Number.isSafeInteger(months) || months < 0) return [];
  const entries = commitments(s),
    followedVenues = entries
      .filter((c) => c.id.startsWith("auction:"))
      .map(
        (c) =>
          auctionVenues[c.id.split(":")[1] as "market" | "foundation"].name,
      );
  const warnings = auctionTimingWarnings(s, months).filter(
    (text) => !followedVenues.some((name) => text.includes(name)),
  );
  for (const c of entries) {
    if (c.deadline === null) continue;
    const exit = s.month + months;
    if (exit >= c.deadline)
      warnings.push(
        `${c.title}：本次安排至第${exit}月，已到或超过第${c.deadline}月截止。若要赴会，请缩短安排；继续则可能错过本届。`,
      );
    else if (c.travelMonths !== null && exit + c.travelMonths >= c.deadline)
      warnings.push(
        `${c.title}：出关后尚需至少${c.travelMonths}月行程，预计第${exit + c.travelMonths}月抵达，将错过第${c.deadline}月截止。请提前出关并预留准备时间。`,
      );
    else if (c.travelMonths === null)
      warnings.push(
        `${c.title}：第${c.deadline}月截止；当前无法确认完整行程，不能保证出关后赶得上，请先在地图核对去路。`,
      );
  }
  return warnings;
}
