import type { State, Intent } from "../world";
import type { StoryRoute } from "./story-routes";
import { eventView } from "../world";
import { relicJourneyError } from "../chapter";
import { arenaError, outingError } from "../social";
import {
  companionshipError,
  companionRevisitText,
} from "../companionship/rules";
import { recognitionQuote, jobName } from "../recognition/rules";

/** Authored near-country routes. Fixed task time includes preparation and return. */
export function additionalStoryRoute(
  s: State,
  intent: Intent,
): StoryRoute | null {
  function route(
    domain: StoryRoute["domain"],
    names: [string, string],
    distance: number,
    months = 0,
    error = "",
    back = false,
  ): StoryRoute {
    return {
      domain,
      intent,
      from: back ? "site" : "home",
      to: back ? "home" : "site",
      title: names[1],
      sites: [
        { id: "home", name: names[0], x: 150, y: 380 },
        { id: "site", name: names[1], x: 790, y: 190 },
      ],
      path: back ? ["site", "home"] : ["home", "site"],
      distance,
      months,
      stones: 0,
      herbs: 0,
      error,
      note: "沿用剧情原有整备与往返耗时，不重复扣月。",
      startProgress: 0,
      mode: "walk",
    };
  }
  if (intent.type === "revisitRelic")
    return route(
      "relic",
      ["听松山居", "青石遗府"],
      360,
      0,
      relicJourneyError(s),
    );
  if (
    intent.type === "choose" &&
    s.pending &&
    intent.instanceId === s.pending.id
  ) {
    const kind = s.pending.kind;
    const outward = kind === "departure" && intent.option === "go";
    const back =
      (kind === "crossing" && intent.option === "withdraw") || kind === "relic";
    if (!outward && !back) return null;
    const option = eventView(s)?.options.find((o) => o.id === intent.option);
    return route(
      "relic",
      ["听松山居", "青石遗府"],
      360,
      kind === "relic" ? 3 : 0,
      !option ? "未知选择" : option.disabled || "",
      back,
    );
  }
  if (intent.type === "visit")
    return route(
      "social",
      ["听松山居", "山门外"],
      15,
      1,
      s.social.gender !== "female" || s.social.met || s.age < 216 || s.realm < 1
        ? "此时尚不能赴约"
        : "",
    );
  if (intent.type === "outing") {
    const names = { walk: "旧路断阶", night: "灯下小院", watch: "试剑台阶" };
    return route(
      "social",
      ["听松山居", names[intent.outing]],
      intent.outing === "walk" ? 60 : 15,
      1,
      outingError(s, intent.outing),
    );
  }
  if (
    intent.type === "companionship" &&
    ["start", "revisit"].includes(intent.action)
  ) {
    const error =
      companionshipError(s) ||
      (s.companionship.stage !==
      (intent.action === "start" ? "unstarted" : "done")
        ? "先完成眼前同行事务"
        : "");
    return route(
      "companion",
      ["听松山居", "上游试灯泊点"],
      60,
      0,
      error ||
        (intent.action === "revisit" &&
        s.companionship.last === companionRevisitText(s)
          ? "此次重访已经记下"
          : ""),
    );
  }
  if (intent.type === "arenaStart" || intent.type === "arenaWithdraw") {
    const back = intent.type === "arenaWithdraw";
    const r = route(
      "arena",
      ["听松山居", "听松试剑台"],
      15,
      back ? 0 : 1,
      back ? (!s.social.arena.duel ? "尚未上台" : "") : arenaError(s),
      back,
    );
    r.stones = back ? 0 : 4;
    return r;
  }
  if (
    intent.type === "recognition" &&
    ["undertake", "routine"].includes(intent.action.kind) &&
    "tier" in intent.action
  ) {
    const a = intent.action,
      q = recognitionQuote(s, a);
    // The alchemy meeting is explicitly held at the home furnace; it is not a road journey.
    if (s.journey.branch === "dan" && a.tier === 1) return null;
    const destination = ["山口药站", "青嶂旧阵", "深山药运接驳处"][a.tier]!;
    const r = route(
      "service",
      ["听松山居", destination],
      [120, 240, 600][a.tier]!,
      q.months,
      q.error,
    );
    r.title = jobName(s, a.tier);
    r.herbs = q.herbs;
    r.sites.push({ id: "return", name: "听松山居（交接）", x: 150, y: 380 });
    r.path = ["home", "site", "return"];
    r.to = "return";
    r.distance *= 2;
    r.note = `本次为往返差事，含交接共 ${q.months} 月；完成报酬灵石 ${q.stones}，不是出行费用。`;
    return r;
  }
  return null;
}
export function additionalArrival(
  next: State,
  old: State,
  r: StoryRoute,
): boolean | undefined {
  if (next.status !== "alive") return false;
  switch (r.domain) {
    case "relic":
      return r.to === "site"
        ? next.story.stage === "crossing" && old.story.stage !== "crossing"
        : next.story.stage === "resolved" && old.story.stage !== "resolved";
    case "social":
      return (
        !!next.social.scene && next.social.scene.id !== old.social.scene?.id
      );
    case "companion":
      return (
        next.companionship.stage !== old.companionship.stage ||
        next.companionship.last !== old.companionship.last
      );
    case "arena":
      return r.to === "site"
        ? !!next.social.arena.duel && !old.social.arena.duel
        : !next.social.arena.duel && !!old.social.arena.duel;
    case "service": {
      if (r.intent.type !== "recognition" || !("tier" in r.intent.action))
        return false;
      const q = recognitionQuote(old, r.intent.action);
      return (
        !next.pending &&
        !next.social.scene &&
        next.month === old.month + q.months &&
        next.stones === old.stones + q.stones &&
        next.herbs === old.herbs - q.herbs
      );
    }
  }
}

export const additionalDomains = new Set<StoryRoute["domain"]>([
  "relic",
  "social",
  "companion",
  "arena",
  "service",
]);
