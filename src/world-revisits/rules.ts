import type { State } from "../world";
import { activityInterruption } from "../scene-activity";
import { quoteSettlement, settleResources } from "../economy";
import { revisitView, type RevisitSite } from "./projection";
export type RevisitAction = { site: RevisitSite; offer: "herbs" | "spirit" };
/** Exact physical site; projection itself remains usable in notes and tests anywhere. */
export function revisitLocation(s: State, site: RevisitSite): boolean {
  if (site === "estate")
    return (
      s.realm === 1 &&
      s.foundationJourney.location === "estate" &&
      s.secretPact.site === "away" &&
      s.sectContest.stage !== "entered" &&
      s.outerSea.location === "home"
    );
  if (site === "ferry")
    return (
      s.realm === 2 &&
      s.outerSea.location === "ferry" &&
      s.conclave.location === "away" &&
      s.lizhao.location === "away"
    );
  return site === "lizhao" && s.realm === 2 && s.lizhao.location === "harbor";
}
export function revisitQuote(s: State, a: RevisitAction) {
  const offer = revisitView(s, a.site)?.offers.find((v) => v.id === a.offer);
  let error = activityInterruption(s);
  if (
    s.ascension ||
    s.nascentSoul.trial ||
    s.nascentSoul.attempt ||
    s.itemGrowth.trial ||
    s.spirit.trial
  )
    error ||= "先完成眼前行功";
  if (!revisitLocation(s, a.site)) error ||= "回到对应旧地，再当面办理补给";
  if (!offer) error ||= "尚无这段亲历留下的补给渠道";
  const cost = offer?.cost ?? {},
    reward = offer?.reward ?? {};
  error ||= quoteSettlement(s, cost, reward).error;
  return {
    error,
    cost,
    reward,
    months: 0,
    label: offer?.label ?? "",
    reason: offer?.reason ?? "",
  };
}
export function runRevisit(input: State, a: RevisitAction, id: string): State {
  if (input.seen.includes(id)) return input;
  const q = revisitQuote(input, a);
  if (q.error) return input;
  const s = structuredClone(input);
  if (settleResources(s, q.cost, q.reward).error) return input;
  const text = `${q.label}已交接。${q.reason}这张补给单已照价结清。`;
  s.log.unshift({ month: s.month, kind: "major", text });
  s.log = s.log.slice(0, 180);
  if (a.site === "estate") s.foundationJourney.last = text;
  else if (a.site === "ferry") s.outerSea.last = text;
  else s.lizhao.last = text;
  s.seen = [...s.seen, id].slice(-512);
  return s;
}
