import type { State, Intent } from "../world";
import { adventureOptions } from "../adventure";
import { mistError } from "../mist";
import { qiError } from "../qi-journey/rules";
import { qiSites } from "../qi-journey/content";
import { roadError } from "../road";
import { goldenQuote } from "../golden-core/rules";
import { seaQuote } from "../outer-sea/rules";
import { conclaveQuote } from "../conclave/rules";
import { passageIntent } from "./passage";
export interface MapSite {
  id: string;
  name: string;
  x: number;
  y: number;
}
const near: MapSite[] = [
  { id: "ferry", name: "雨夜渡口", x: 110, y: 380 },
  { id: "apothecary", name: "山门药庐", x: 330, y: 320 },
  { id: "forest", name: "雾林旧道", x: 580, y: 270 },
  { id: "shrine", name: "废弃山祠", x: 820, y: 160 },
];
const road: MapSite[] = [
  { id: "home", name: "听松山居", x: 100, y: 400 },
  { id: "market", name: "山下坊市", x: 300, y: 360 },
  { id: "camp", name: "山口行营", x: 490, y: 310 },
  { id: "pass", name: "青嶂关", x: 660, y: 230 },
  { id: "beyond", name: "关外旧路", x: 760, y: 320 },
  { id: "lookout", name: "云栈旅亭", x: 870, y: 160 },
];
const coast: MapSite[] = [
  { id: "home", name: "听松行前居", x: 110, y: 390 },
  { id: "wall", name: "穿云壁", x: 280, y: 300 },
  { id: "ferry", name: "外海古渡", x: 530, y: 280 },
  { id: "ruins", name: "退潮遗迹", x: 700, y: 430 },
  { id: "court", name: "诸宗会谷", x: 770, y: 170 },
  { id: "vault", name: "归潮秘境", x: 880, y: 320 },
];
const dew: MapSite[] = [
  { id: "home", name: "听松行前居", x: 180, y: 370 },
  { id: "path", name: "凝露药圃", x: 760, y: 190 },
];
export interface StoryRoute {
  domain: "opening" | "road" | "mist" | "qi" | "golden" | "sea" | "conclave";
  intent: Intent;
  from: string;
  to: string;
  title: string;
  sites: MapSite[];
  path: string[];
  distance: number;
  months: number;
  stones: number;
  herbs: number;
  error: string;
  note: string;
  startProgress: number;
  mode: "walk" | "flight" | "sail";
}
export function storyLocation(s: State, domain: StoryRoute["domain"]) {
  if (domain === "opening")
    return s.adventure.step === "home"
      ? "shrine"
      : s.adventure.step === "done"
        ? "apothecary"
        : s.adventure.step;
  if (domain === "road") return s.adventure.road.stage;
  if (domain === "mist")
    return ["dormant", "letter", "home"].includes(s.adventure.mist.stage)
      ? "home"
      : s.adventure.mist.stage;
  if (domain === "qi") return s.qiJourney.node ? "site" : "home";
  if (domain === "golden")
    return s.goldenCore.farShore
      ? "wall"
      : ["path", "won"].includes(s.goldenCore.expedition)
        ? "path"
        : "home";
  if (domain === "sea") return s.outerSea.location;
  return s.conclave.location === "away" ? "ferry" : s.conclave.location;
}
/** Read-only adapters reuse the same domain quotes as command settlement. No speculative dispatch/RNG. */
export function storyRoute(s: State, intent: Intent): StoryRoute | null {
  const base = {
    intent,
    startProgress: s.wayfaring.passage
      ? 1 - s.wayfaring.passage.remaining / s.wayfaring.passage.total
      : 0,
    months: 0,
    stones: 0,
    herbs: 0,
    error: "",
    mode: "walk" as const,
    note: "近郊短途，不另扣修行年月。",
  };
  if (intent.type === "adventure") {
    const from = storyLocation(s, "opening"),
      a = intent.action;
    const to =
      a === "depart"
        ? from === "ferry"
          ? "apothecary"
          : from === "apothecary"
            ? "forest"
            : ""
        : ["trail", "shortcut"].includes(a)
          ? "shrine"
          : a === "retreat"
            ? "apothecary"
            : ["return", "takeHerbs"].includes(a)
              ? "apothecary"
              : "";
    if (!to || to === from) return null;
    const paths: Record<string, string[]> = {
      "ferry:apothecary": ["ferry", "apothecary"],
      "apothecary:forest": ["apothecary", "forest"],
      "forest:shrine": ["forest", "shrine"],
      "shrine:apothecary": ["shrine", "forest", "apothecary"],
    };
    const path = paths[`${from}:${to}`];
    if (!path) return null;
    return {
      ...base,
      domain: "opening",
      from,
      to,
      title: "听松近郊 · 寻人山路",
      sites: near,
      path,
      distance:
        path.length === 3
          ? 45
          : from === "ferry"
            ? 15
            : from === "forest"
              ? 20
              : 25,
      error: adventureOptions(s.adventure).some((o) => o.action === a)
        ? ""
        : "先处理眼前之事",
    };
  }
  if (intent.type === "road") {
    const from = storyLocation(s, "road"),
      a = intent.action;
    const to =
      a === "market"
        ? "market"
        : a === "pass"
          ? s.adventure.road.passed
            ? "beyond"
            : "pass"
          : a === "camp" || a === "back"
            ? "camp"
            : a === "lookout"
              ? "lookout"
              : "";
    if (!to || from === to) return null;
    const order = ["home", "market", "camp", "pass", "beyond", "lookout"];
    const lo = order.indexOf(from),
      hi = order.indexOf(to);
    const path =
      lo < hi ? order.slice(lo, hi + 1) : order.slice(hi, lo + 1).reverse();
    const lengths = [30, 60, 30, 30, 120];
    return {
      ...base,
      domain: "road",
      from,
      to,
      title: "听松药路 · 青嶂归途",
      sites: road,
      path,
      distance: lengths
        .slice(Math.min(lo, hi), Math.max(lo, hi))
        .reduce((a, b) => a + b, 0),
      error: roadError(s, a),
      note: "近郊通行不另扣月；青嶂开路仍须完成现场挑战。",
    };
  }
  if (intent.type === "mist") {
    const from = storyLocation(s, "mist"),
      a = intent.action;
    const to =
      a === "accept" || a === "camp"
        ? "camp"
        : ["garden", "station", "shrine", "home"].includes(a)
          ? a
          : a === "gate"
            ? s.adventure.mist.passed
              ? "archive"
              : "gate"
            : "";
    if (!to || to === from) return null;
    const sites: MapSite[] = [
      { id: "home", name: "云栈旅亭", x: 100, y: 380 },
      { id: "camp", name: "雾岭营地", x: 280, y: 320 },
      { id: "garden", name: "旧药圃", x: 450, y: 170 },
      { id: "station", name: "废驿", x: 470, y: 410 },
      { id: "gate", name: "回声阵门", x: 650, y: 280 },
      { id: "archive", name: "寄信灯室", x: 830, y: 240 },
      { id: "shrine", name: "旧祠灯位", x: 750, y: 420 },
    ];
    return {
      ...base,
      domain: "mist",
      from,
      to,
      title: "雾岭旧路 · 寻信",
      sites,
      path: [from, to],
      distance: from === "home" || to === "home" ? 300 : 120,
      error: mistError(s, a),
      note: "沿既有旧路探访，不新增切图月份；回声阵仍须在现场应对。",
    };
  }
  if (
    intent.type === "qiJourney" &&
    (intent.action.startsWith("enter:") || intent.action === "withdraw") &&
    !s.qiJourney.trial
  ) {
    const from = storyLocation(s, "qi"),
      to = intent.action === "withdraw" ? "home" : "site";
    if (from === to || s.qiJourney.gates >= 2) return null;
    const spec = qiSites[s.qiJourney.gates]!;
    return {
      ...base,
      domain: "qi",
      from,
      to,
      title: "听松历练 · " + spec.name,
      sites: [
        { id: "home", name: "听松山居", x: 160, y: 380 },
        { id: "site", name: spec.name, x: 780, y: 190 },
      ],
      path: [from, to],
      distance: s.qiJourney.gates ? 300 : 120,
      months: to === "site" ? 1 : 0,
      stones: to === "site" ? spec.fee : 0,
      herbs: intent.action === "enter:medicine" ? 4 : 0,
      error: qiError(s, intent.action),
      note: "入境一月沿用原有历练费用；不叠加赶路月份，抵达后仍须亲自应战。",
    };
  }
  if (
    intent.type === "goldenCore" &&
    ["route", "farShore", "withdraw"].includes(intent.action.kind) &&
    !s.goldenCore.duel
  ) {
    const wall = intent.action.kind === "farShore",
      back = intent.action.kind === "withdraw";
    // Prepared supplies are still at home; abandoning them is not a journey.
    if (
      back &&
      s.goldenCore.expedition !== "path" &&
      s.goldenCore.expedition !== "won"
    )
      return null;
    const q = goldenQuote(s, intent.action),
      from = back ? "path" : "home",
      to = wall ? "wall" : back ? "home" : "path";
    return {
      ...base,
      ...q,
      domain: "golden",
      from,
      to,
      title: wall ? "金丹初行 · 穿云壁" : "凝丹筹备 · 凝露药圃",
      sites: wall ? coast.slice(0, 2) : dew,
      path: [from, to],
      distance: wall ? 7200 : 1200,
      mode: wall ? "flight" : "walk",
      note: wall
        ? "此行包含丹元护体与穿越云壁，不叠加旅行月份。"
        : "此行沿用药圃既有费用，不重复计算路程；守药交锋仍在现场进行。",
    };
  }
  if (
    intent.type === "outerSea" &&
    ["sail", "home", "enter", "return"].includes(intent.action.kind) &&
    !s.outerSea.duel
  ) {
    const from = storyLocation(s, "sea"),
      kind = intent.action.kind,
      to =
        kind === "sail"
          ? "ferry"
          : kind === "home"
            ? "home"
            : kind === "enter"
              ? "ruins"
              : "ferry";
    if (from === to) return null;
    const q = seaQuote(s, intent.action),
      long = kind === "sail" || kind === "home";
    const path = long
      ? kind === "sail"
        ? ["home", "wall", "ferry"]
        : ["ferry", "wall", "home"]
      : [from, to];
    return {
      ...base,
      ...q,
      domain: "sea",
      from,
      to,
      title: "青玄外海 · 潮路",
      sites: coast.filter(
        (p) => !["court", "vault"].includes(p.id) || s.outerSea.notice !== null,
      ),
      path,
      distance: long ? 54000 : 1800,
      mode: "sail",
      note: long
        ? "循已知海路行舟，金丹护体应对长潮；不以普通御剑速度替代航期。"
        : "入境两月、回渡一月包含候潮与探路；不会跳过遗迹守卫。",
    };
  }
  if (
    intent.type === "conclave" &&
    ["visit", "leave", "enter", "withdraw"].includes(intent.action.kind) &&
    !s.conclave.duel
  ) {
    const from = storyLocation(s, "conclave"),
      kind = intent.action.kind,
      to =
        kind === "visit"
          ? "court"
          : kind === "leave"
            ? "ferry"
            : kind === "enter"
              ? "vault"
              : "court";
    if (from === to || (kind === "withdraw" && from !== "vault")) return null;
    const q = conclaveQuote(s, intent.action),
      long = kind === "visit" || kind === "leave";
    return {
      ...base,
      ...q,
      domain: "conclave",
      from,
      to,
      title: "外海 · 诸宗会与归潮",
      sites: coast.filter((p) => ["ferry", "court", "vault"].includes(p.id)),
      path: [from, to],
      distance: long ? 18000 : 900,
      mode: long ? "sail" : "walk",
      note: long
        ? "古渡接驳与赴会引路共两月；会期已过仍可补试，旧胜绩保留。"
        : "背潮六月或主流两月包含探路与避险；返谷沿用原撤退费用。",
    };
  }
  return null;
}
export function resumedStoryRoute(s: State) {
  return s.wayfaring.passage
    ? storyRoute(s, passageIntent(s.wayfaring.passage.route))
    : null;
}
