import { qiNarrativeActive } from "../qi-journey/narrative";
import { advanceJourney } from './engine';
import { travelProfile } from './profile';
import type { State } from "../world";
import type { TravelDestination } from "./routes";
import { arrivePactSite, pactDestinationError } from "../secret-pact/rules";
import { pactActivity } from "../secret-pact/state";
import { journeyActionError } from "../foundation-journey/progression";
import { advancePlot } from "../foundation-journey/plot";
import { inlandTravel, sites, type TravelMode } from "./routes";
export type WayfaringAction = { kind: "study" } | { kind: "cancel" } | {kind:"visit";site:"zhaoxuan"|"brokenStele";mode?:TravelMode};
export const travelLocation = (s: State): TravelDestination => s.secretPact?.site === "zhaoxuan" ? "pact" : s.secretPact?.site === "brokenStele" ? "stele" : s.foundationJourney.location;
export const preferredTravelMode = (s: State): TravelMode =>
  s.wayfaring.trip?.mode ?? (s.wayfaring.swordFlight === "none" ? "land" : "flight");
export const travelLocked = (s: State) =>
  !!s.wayfaring.passage ||
  pactActivity(s.secretPact) || qiNarrativeActive(s) ||
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
        : travelLocation(s) !== "home"
          ? "回听松行前居研习"
          : s.wayfaring.swordFlight !== "none"
            ? "已研习，可选择御剑完成首次远行"
            : "";
}
export function travelQuote(
  s: State,
  to: TravelDestination,
  mode: TravelMode = "land",
) {
  const t = s.wayfaring.trip,
    from = t?.from ?? travelLocation(s);
  const planned = inlandTravel.plan({from,to,mode,traveler:travelProfile(s)});
  const matching = t?.to === to && t.mode === mode;
  const plan = matching ? t.plan : planned.ok ? planned.plan : null;
  const route = plan ? {...plan,path:plan.path as TravelDestination[]} : {path:[] as TravelDestination[],distance:0,speed:0,months:0};
  const error = travelLocked(s)
    ? "先处理眼前事件或结束交锋"
    : !["land", "flight"].includes(mode)
      ? "未知行路方式"
      : t && (t.to !== to || t.mode !== mode)
        ? "先继续当前行程，或折返出发地"
        : mode === "flight" && s.wayfaring.swordFlight === "none"
          ? "先研习御剑术"
          : !plan ? (!planned.ok ? planned.error : "无有效行程") : to === "pact" || to === "stele" ? pactDestinationError(s, to === "pact" ? "zhaoxuan" : "brokenStele") : journeyActionError(s, { kind: "travel", destination: to });
  return {
    ...route,
    from,
    to,
    mode,
    plan,
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
  if (a.kind === "visit") return runTravel(input, a.site === "zhaoxuan" ? "pact" : "stele", a.mode ?? preferredTravelMode(input), id, tick);
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
  to: TravelDestination,
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
    plan: quote.plan!,
  };
  const result=advanceJourney(s,{
    remaining:n=>n.wayfaring.trip!.remaining,
    consume:n=>{n.wayfaring.trip!.remaining--;},tick,
    interrupted:(before,n)=>n.status!=="alive" || n.pending || (!before.sectContest.reminded && n.sectContest.reminded),
  });
  s=result.state;
  if(result.stopped) return accept(s,id,
    `前往${sites[to].name}的行程暂停，尚余 ${s.wayfaring.trip!.remaining} 月。${s.status === "dead" ? "寿元已尽，未抵达目的地。" : "处理眼前消息后，可继续剩余路程；也可放弃此行。"}`);
  const total = s.wayfaring.trip!.total;
  const firstFerry = to === "ferry" && !s.foundationJourney.ferry;
  if (to === "pact" || to === "stele") {
    s.foundationJourney.location = to === "pact" ? "frontier" : "inn";
    arrivePactSite(s, to === "pact" ? "zhaoxuan" : "brokenStele");
  } else {
    s.secretPact.site = "away";
    advancePlot(s, { kind: "travel", destination: to });
  }
  const arrivalStory = firstFerry ? s.foundationJourney.last : "";
  s.wayfaring.trip = null;
  const first = mode === "flight" && s.wayfaring.swordFlight === "practiced";
  if (first) s.wayfaring.swordFlight = "learned";
  return accept(
    s,
    id,
    `你从${sites[quote.from].name}${mode === "flight" ? "御剑" : "沿陆路"}抵达${sites[to].name}，全程 ${total} 月。${first ? "首次御剑远行完成，你已掌握御剑术。" : ""}${arrivalStory}`,
  );
}
