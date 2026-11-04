import { knowsInland, knowsLandmark } from './discovery';
import { lizhaoQuote } from "../lizhao/rules";
import { qiNarrativeTravel, qiNarrativeDestinations, qiNarrativeLocation } from "../qi-journey/narrative";
import { travelQuote, travelLocation, preferredTravelMode } from "./rules";
import { sites as inlandSites } from "./routes";
import { additionalStoryRoute, additionalArrival } from "./additional-story";
import { createTravelEngine } from './engine';
import { travelProfile } from './profile';
import { travelSpeeds } from './geography';
import { explorationError, places, type State, type Intent } from "../world";
import { adventureOptions } from "../adventure";
import { mistError } from "../mist";
import { qiError } from "../qi-journey/rules";
import { qiSites } from "../qi-journey/content";
import { roadError } from "../road";
import { goldenQuote } from "../golden-core/rules";
import { seaQuote } from "../outer-sea/rules";
import { conclaveQuote } from "../conclave/rules";
import { contestError } from "../sect-contest/rules";
import { expeditionError } from "../expedition/rules";
import { encounters } from "../expedition/content";
import { preparationRoutes, type PreparationRoute } from "../qi-journey/preparation";
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
  domain: "lizhao" | "inland" | "qiNarrative" | "opening" | "road" | "mist" | "qi" | "golden" | "sea" | "conclave" | "pact" | "contest" | "escort" | "valley" | "peak" | "oldSea" | "relic" | "social" | "companion" | "arena" | "service";
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
  if (domain === "lizhao") return s.lizhao.location;
  if (domain === "inland") return travelLocation(s);
  if (domain === "qiNarrative") return qiNarrativeLocation(s);
  if (domain === "valley" || domain === "peak" || domain === "oldSea") return s.journey.maps[domain === "oldSea" ? "sea" : domain] ? "site" : "home";
  if (domain === "pact") return ["inside", "betrayed"].includes(s.secretPact.stage) ? "inner" : "frontier";
  if (domain === "contest") return ["entered", "finished"].includes(s.sectContest.stage) ? "court" : "home";
  if (domain === "escort") return s.expedition.duel ? "site" : "camp";
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
function authoredStoryRoute(s: State, intent: Intent): StoryRoute | null {
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
  const pair = (domain: StoryRoute["domain"], title: string, from: string, to: string,
    names: [string, string], distance: number, quote: {error:string;months?:number;stones?:number;herbs?:number}, mode: StoryRoute["mode"] = "walk"): StoryRoute => ({
    ...base, ...quote, mode, domain, title, from, to, distance, path: [from,to],
    sites: [{id:from,name:names[0],x:160,y:380},{id:to,name:names[1],x:780,y:190}],
    note: "沿用本次剧情的整备与通行费用，不另加赶路月份；抵达后继续现场行动。",
  });
  if (intent.type==='explore' && s.journey.maps[intent.place]===0) {
    return pair(intent.place==='sea'?'oldSea':intent.place,'旧事探访 · '+places[intent.place].name,'home','site',
      [intent.place==='sea'?'雾岭旧渡':'听松山居',places[intent.place].name],intent.place==='valley'?120:intent.place==='peak'?600:900,
      {error:explorationError(s,intent.place),months:1},intent.place==='sea'?'sail':'walk');
  }
  if (intent.type === "wayfaring" && intent.action.kind === "visit") {
    const to = intent.action.site === "zhaoxuan" ? "pact" : "stele";
    const q = travelQuote(s,to,intent.action.mode ?? preferredTravelMode(s));
    return {...base,domain:"inland",title:"青玄内陆 · 循路赴约",from:q.from,to,
      sites:Object.entries(inlandSites).filter(([id])=>knowsInland(s,id as import("./routes").TravelDestination)||q.path.includes(id as import("./routes").TravelDestination)).map(([id,p])=>({id,...p})),path:q.path,
      distance:q.distance,months:q.remaining,error:q.error,
      startProgress:s.wayfaring.trip ? 1-s.wayfaring.trip.remaining/s.wayfaring.trip.total : 0,
      mode:q.mode === "flight" ? "flight" : "walk",
      note:"按完整路程结算，抵达后另行整备与探府；途经古道不授予取材成果。"};
  }
  if (intent.type === "lizhao" && ["visit","leave"].includes(intent.action.kind)) {
    const back=intent.action.kind === "leave";
    return {...pair("lizhao","外海 · 离照潮路",back?"harbor":"away",back?"away":"harbor",back?["离照泊岸","外海古渡"]:["外海古渡","离照泊岸"],36000,lizhaoQuote(s,intent.action)),mode:"sail",note:back?"循潮路返回外海古渡，整程六个月；途中若有来信，停舟处理后可续行。":"循潮路赴离照，整程六个月；途中若有来信，停舟处理后可续行。"};
  }
  if (intent.type === "qiJourney") {
    const trip = qiNarrativeTravel(s).find(r=>r.action === intent.action);
    if (trip) {
      const route=pair("qiNarrative","听松药路 · "+qiNarrativeDestinations[trip.to].name,
        trip.from,trip.to,[qiNarrativeDestinations[trip.from].name,qiNarrativeDestinations[trip.to].name],trip.distance,trip);
      return {...route,note:"入窟月份包含行路与勘路；撤回不另收费，已取得的历练成果保留。"};
    }
  }
  if (intent.type === 'sectContest' && (intent.action.kind==='enter' || (intent.action.kind==='leave' && s.sectContest.stage==='finished'))) {
    const back=intent.action.kind==='leave';
    return pair('contest','听松山门 · 宗门内比',back?'court':'home',back?'home':'court',
      back?['松间石台','听松行前居']:['听松行前居','松间石台'],15,{error:contestError(s,intent.action)});
  }
  if (intent.type==='expedition' && ['enter','withdraw'].includes(intent.action)) {
    const back=intent.action==='withdraw';
    const encounter=encounters[s.expedition.cleared];
    if(!encounter)return null;
    return pair('escort','青嶂药路 · '+encounter.name,back?'site':'camp',back?'camp':'site',
      back?[encounter.name,'山口行营']:['山口行营',encounter.name],s.expedition.cleared===2?60:30,
      {error:expeditionError(s,intent.action),months:back?0:1,stones:back?0:encounter.cost});
  }
  if (intent.type==='qiJourney' && (/^prep:(medicine|sect|wander):trial$/.test(intent.action) || (intent.action==='withdraw' && s.qiJourney.trial))) {
    const back=intent.action==='withdraw';
    const route=(back?s.qiJourney.trial:intent.action.split(':')[1]) as PreparationRoute;
    return pair('qi','听松历练 · '+preparationRoutes[route].name,back?'site':'home',back?'home':'site',
      back?[preparationRoutes[route].name,'听松山居']:['听松山居',preparationRoutes[route].name],route==='wander'?300:120,
      {error:qiError(s,intent.action),months:back?0:1});
  }
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
        : ["garden", "station", "shrine", "home", "read"].includes(a)
          ? a === "read" ? "home" : a
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
        (p) => path.includes(p.id) || (p.id === "court" ? knowsLandmark(s,"conclave-court") : p.id === "vault" ? knowsLandmark(s,"conclave-vault") : p.id === "ruins" ? knowsLandmark(s,"outer-ruins") : true),
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
      sites: coast.filter((p) => ["ferry", "court", "vault"].includes(p.id) && (p.id!=="vault" || from==="vault" || to==="vault" || knowsLandmark(s,"conclave-vault"))),
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
/** Chapters supply authored endpoints, costs and eligibility; the engine owns the itinerary.
 * Fixed chapter time already includes approach/preparation, so never add distance time twice. */
export function storyRoute(s: State, intent: Intent): StoryRoute | null {
  const route=additionalStoryRoute(s,intent) ?? authoredStoryRoute(s,intent);
  if(!route)return null;
  const traveler=travelProfile(s);
  // Crossing the cloud wall is a golden-core capability, independent of inland sword lessons.
  if(route.mode==='flight' && s.realm>=2)traveler.speeds.flight=travelSpeeds.goldenFlight;
  const mode=route.mode==='walk'?'land':route.mode;
  const engine=createTravelEngine(route.sites.map(site=>site.id),[{
    from:route.from,to:route.to,via:route.path.slice(1,-1),mode,distance:route.distance,
    minRealm:mode==='flight'?1:0,timing:{kind:'fixed',months:route.months},
  }]);
  const quote=engine.plan({from:route.from,to:route.to,mode,traveler});
  if(!quote.ok)return {...route,error:route.error || quote.error};
  return {...route,path:quote.plan.path,distance:quote.plan.distance,months:quote.plan.months};
}
export function resumedStoryRoute(s: State) {
  if (s.wayfaring.trip?.to === "pact" || s.wayfaring.trip?.to === "stele") return storyRoute(s,{type:"wayfaring",action:{kind:"visit",site:s.wayfaring.trip.to === "pact" ? "zhaoxuan" : "brokenStele",mode:s.wayfaring.trip.mode}});
  return s.wayfaring.passage
    ? storyRoute(s, passageIntent(s.wayfaring.passage.route))
    : null;
}

export function storyArrived(next:State,old:State,route:StoryRoute) {
 return additionalArrival(next,old,route) ?? (storyLocation(next,route.domain)===route.to && storyLocation(old,route.domain)!==route.to);
}
