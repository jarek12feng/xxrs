import type { State } from "../world";
import type { Destination } from "../foundation-journey/state";
import { journeyActionError } from "../foundation-journey/progression";
import { advancePlot } from "../foundation-journey/plot";
import { routeBetween, sites, type TravelMode } from "./routes";
export type WayfaringAction = { kind: "study" } | { kind: "cancel" };
export const travelLocked = (s: State) =>
  !!s.wayfaring.passage ||
  s.status !== "alive" ||
  !!(
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    s.qiJourney.node ||
    s.foundationJourney.duel ||
    s.sectContest.duel ||
    s.goldenCore.duel ||
    s.outerSea.duel ||
    s.conclave.duel
  ) ||
  s.goldenCore.expedition !== "idle" ||
  s.outerSea.location !== "home" ||
  s.conclave.location !== "away" ||
  s.sectContest.stage === "entered" ||
  !!(s.treasures.auction?.entered && !s.treasures.auction.closed);
export function studyError(s: State) {
  return travelLocked(s)
    ? "先处理眼前事件或结束行旅"
    : s.realm < 1
      ? "筑基后可研习御剑术"
      : s.wayfaring.trip
        ? "先结束当前路程"
        : s.foundationJourney.location !== "home"
          ? "回听松行前居研习"
          : s.wayfaring.swordFlight !== "none"
            ? "已研习，可选择御剑完成首次远行"
            : "";
}
export function travelQuote(
  s: State,
  to: Destination,
  mode: TravelMode = "land",
) {
  const t = s.wayfaring.trip,
    from = t?.from ?? s.foundationJourney.location;
  const route = routeBetween(from, to, mode, s.realm);
  const error = travelLocked(s)
    ? "先处理眼前事件或结束交锋"
    : !["land", "flight"].includes(mode)
      ? "未知行路方式"
      : t && (t.to !== to || t.mode !== mode)
        ? "先继续当前行程，或折返出发地"
        : mode === "flight" && s.wayfaring.swordFlight === "none"
          ? "先研习御剑术"
          : journeyActionError(s, { kind: "travel", destination: to });
  return {
    from,
    to,
    mode,
    ...route,
    remaining: t?.to === to && t.mode === mode ? t.remaining : route.months,
    error,
  };
}
function accept(s: State, id: string, text: string) {
  s.wayfaring.last = text;
  s.foundationJourney.last = text;
  s.seen = [...s.seen, id].slice(-512);
  s.log.unshift({ month: s.month, kind: "story", text });
  s.log = s.log.slice(0, 180);
  return s;
}
export function runWayfaring(
  input: State,
  a: WayfaringAction,
  id: string,
  tick: (s: State) => State,
) {
  if (a.kind === "cancel") {
    if (input.wayfaring.passage) {
      if (input.status !== "alive" || input.pending || input.social.scene)
        return input;
      const s = structuredClone(input),
        sea = s.wayfaring.passage!.route.startsWith("sea:");
      s.wayfaring.passage = null;
      const message =
        "你放弃本次航程，返回出发处。已耗年月不退，不另扣撤回时间；行装未扣除。";
      if (sea) s.outerSea.last = message;
      else s.conclave.last = message;
      return accept(s, id, message);
    }
    if (travelLocked(input) || !input.wayfaring.trip) return input;
    // The interrupted journey remains based at its last safe departure point.
    const s = structuredClone(input);
    s.wayfaring.trip = null;
    return accept(
      s,
      id,
      "你放弃此次远行，回到出发处整备。已用年月不退；不另扣撤回时间。",
    );
  }
  if (a.kind !== "study" || studyError(input)) return input;
  const s = tick(input);
  if (s.status !== "alive" || s.pending)
    return accept(s, id, "研习被打断，尚未掌握御剑起落。");
  s.wayfaring.swordFlight = "practiced";
  return accept(
    s,
    id,
    "你依行前居的御剑札记练稳了起落，耗时一月。下一次出行可御剑试行，平安抵达后便能独立驾剑远游。此术不占主修，也不要求剑道功法。",
  );
}
export function runTravel(
  input: State,
  to: Destination,
  mode: TravelMode,
  id: string,
  tick: (s: State) => State,
) {
  const quote = travelQuote(input, to, mode);
  if (quote.error || quote.months < 1) return input;
  let s = structuredClone(input);
  s.wayfaring.trip ??= {
    from: quote.from,
    to,
    mode,
    total: quote.months,
    remaining: quote.months,
  };
  while (s.wayfaring.trip!.remaining > 0) {
    const reminded = s.sectContest.reminded;
    s = tick(s);
    s.wayfaring.trip!.remaining--;
    if (
      s.status !== "alive" ||
      s.pending ||
      (!reminded && s.sectContest.reminded)
    )
      return accept(
        s,
        id,
        `前往${sites[to].name}的行程暂停，尚余 ${s.wayfaring.trip!.remaining} 月。${s.status === "dead" ? "寿元已尽，未抵达目的地。" : "处理眼前消息后，可继续剩余路程；也可放弃此行。"}`,
      );
  }
  const total = s.wayfaring.trip!.total;
  advancePlot(s, { kind: "travel", destination: to });
  s.wayfaring.trip = null;
  const first = mode === "flight" && s.wayfaring.swordFlight === "practiced";
  if (first) s.wayfaring.swordFlight = "learned";
  return accept(
    s,
    id,
    `你从${sites[quote.from].name}${mode === "flight" ? "御剑" : "沿陆路"}抵达${sites[to].name}，全程 ${total} 月。${first ? "首次御剑远行完成，你已掌握御剑术。" : ""}`,
  );
}
