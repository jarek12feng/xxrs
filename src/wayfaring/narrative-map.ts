import { lizhaoQuote } from "../lizhao/rules";
import type { State, Intent } from "../world";
import type { RouteNode } from "../landmarks";
import { destinations } from "../foundation-journey/content";
import {
  qiNarrativeDestinations,
  qiNarrativeLocation,
  qiNarrativeTravel,
} from "../qi-journey/narrative";
import { preferredTravelMode, travelLocation, travelQuote } from "./rules";
import type { TravelDestination } from "./routes";

export const inlandAtlasSites: Record<
  TravelDestination,
  { key: string; x: number; y: number }
> = {
  home: { key: "inland-home", x: 61, y: 86 },
  ferry: { key: "inland-ferry", x: 74, y: 86 },
  inn: { key: "inland-inn", x: 74, y: 65 },
  estate: { key: "inland-estate", x: 88, y: 86 },
  snow: { key: "inland-snow", x: 65, y: 27 },
  frontier: { key: "inland-frontier", x: 85, y: 46 },
  pact: { key: "inland-pact", x: 85, y: 27 },
  stele: { key: "inland-stele", x: 88, y: 65 },
};
export const showingMistRoute = (s: State) =>
  s.realm === 1 &&
  s.adventure.mist.stage !== "dormant" &&
  !s.adventure.mist.settled &&
  s.secretPact.site === "away" &&
  s.foundationJourney.location === "home" &&
  !s.wayfaring.trip;

/** Map discovery is a projection. No visits, clues or rewards are granted here. */
export function narrativeMapNodes(s: State): RouteNode[] {
  const qiLocation = qiNarrativeLocation(s);
  const qiTrips = qiNarrativeTravel(s);
  const qiPlaces = Object.entries(qiNarrativeDestinations).map(
    ([id, p], i): RouteNode => {
      const trip = qiTrips.find((t) => t.to === id);
      const active = s.realm === 0 && s.adventure.step === "done";
      const intent: Intent | undefined =
        active && trip && !trip.error
          ? { type: "qiJourney", action: trip.action }
          : undefined;
      const n = s.qiJourney.narrative;
      return {
        key: p.id,
        title: p.name,
        label: p.name,
        image: p.image,
        x: 14 + i * 18,
        y: 27,
        active,
        current: active && id !== "home" && qiLocation === id,
        visited:
          id === "home"
            ? !!n?.sectBriefed
            : id === "cave"
              ? (!!n && !["unknown", "prepared"].includes(n.phase)) ||
                n.location === "cave"
              : !!n && !["none", "warned"].includes(n.pursuit),
        intent,
        condition: active
          ? trip?.error ||
            (trip
              ? `沿药路前往，${trip.months} 月；费用含本段行路与勘路。`
              : "在现场完成历练，再循归路离开。")
          : "听松药路上的地点，沿修行与同行消息开启。",
      };
    },
  );
  const q = s.foundationJourney;
  const current = travelLocation(s);
  const visited: Record<TravelDestination, boolean> = {
    home: q.epilogue || q.reunion,
    ferry: q.ferry > 0,
    inn: q.sides.inn.step > 0,
    estate: q.growth.routes.estate.prepared || q.sides.estate.step > 0,
    snow: q.growth.routes.snow.prepared || q.sides.snow.step > 0,
    frontier: q.growth.routes.frontier.prepared || q.rescue > 0,
    pact: s.secretPact.trial !== "none",
    stele:
      s.secretPact.site === "brokenStele" || s.secretPact.pursuit === "closed",
  };
  const inland = Object.entries(inlandAtlasSites).map(
    ([id, pos]): RouteNode => {
      const to = id as TravelDestination;
      const p =
        to === "pact"
          ? {
              name: "照玄遗府",
              image: "/art/secret-pact/zhaoxuan-chamber.webp",
            }
          : to === "stele"
            ? {
                name: "断碑驿",
                image: "/art/world-story/foundation/broken-stele-inn.webp",
              }
            : {
                name: destinations[to].name,
                image: `/art/foundation-journey/${destinations[to].image}.webp`,
              };
      const quote = travelQuote(s, to, preferredTravelMode(s));
      const active = s.realm === 1 && !showingMistRoute(s);
      let intent: Intent | undefined;
      if (active && current !== to && !quote.error)
        intent =
          to === "pact" || to === "stele"
            ? {
                type: "wayfaring",
                action: {
                  kind: "visit",
                  site: to === "pact" ? "zhaoxuan" : "brokenStele",
                  mode: quote.mode,
                },
              }
            : {
                type: "foundationJourney",
                action: { kind: "travel", destination: to, mode: quote.mode },
              };
      return {
        ...pos,
        title: p.name,
        label: p.name,
        image: p.image,
        active,
        current: active && current === to,
        visited: visited[to],
        intent,
        condition: !active
          ? "青玄内陆的行路节点；修行与实际经历开启通路。"
          : current === to
            ? s.wayfaring.trip
              ? `行程已出发，尚余 ${s.wayfaring.trip.remaining} 月，处理消息后续行。`
              : "已在此处；进入现场人物与器物继续行旅。"
            : quote.error ||
              `${quote.distance} 里，${quote.remaining} 月；抵达不等于取得当地机缘。`,
      };
    },
  );
  const golden: RouteNode[] = s.realm >= 2 ? [
    {key:"lizhao-harbor",title:"离照洞天",label:"离照泊岸",image:"/art/world-story/lizhao/chamber.webp",x:61,y:46,active:s.realm===2&&s.conclave.stage>=2,current:s.lizhao.location!=="away"&&s.lizhao.location!=="bay",visited:s.lizhao.cleared||s.lizhao.location!=="away",intent:s.lizhao.location==="away"&&!lizhaoQuote(s,{kind:"visit"}).error?{type:"lizhao",action:{kind:"visit"}}:undefined,condition:s.lizhao.location!=="away"?"已在离照，沿现场通路探索、验证丹方或循潮路返回。":lizhaoQuote(s,{kind:"visit"}).error||"从外海古渡循潮路行舟六个月；抵达后仍须亲历洞天试炼。"},
    {key:"fuchao-bay",title:"伏潮湾",label:"伏潮湾",image:"/art/outer-sea/ferry.webp",x:74,y:46,active:s.lizhao.pursuit!=="none",current:s.lizhao.location==="bay",visited:!["none","rumor","warned"].includes(s.lizhao.pursuit),condition:s.lizhao.pursuit==="none"?"离照近旁的一处潮湾，尚未听闻须往此地的消息。":"先在离照泊岸打听拦舟之人的来意，再决定赴湾、绕行或和解。"},
  ] : [];
  return [...qiPlaces, ...inland, ...golden];
}

export const narrativeAtlasPaths: readonly (readonly [string, string])[] = [
  ["outer-ferry", "lizhao-harbor"],
  ["lizhao-harbor", "fuchao-bay"],
  ["outer-ferry", "conclave-court"],
  ["conclave-court", "conclave-vault"],
  ["outer-ferry", "outer-ruins"],
  ["apothecary", "qi-medicine-court"],
  ["qi-medicine-court", "qi-stone-ravine"],
  ["pass", "qi-pass-branch"],
  ["apothecary", "inland-home"],
  ["inland-home", "inland-ferry"],
  ["inland-ferry", "inland-inn"],
  ["inland-inn", "inland-estate"],
  ["inland-inn", "inland-snow"],
  ["inland-inn", "inland-frontier"],
  ["inland-inn", "inland-stele"],
  ["inland-stele", "inland-frontier"],
  ["inland-frontier", "inland-pact"],
];
