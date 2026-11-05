import { companionNews } from "../golden-story/companion";
import type { State } from "../world";
import { knownWorldFacts, type WorldFact } from "../world-events";
import { auctionVenues } from "../auction";
import { lotInfo } from "../auction/catalog";
import { challenges } from "../foundation-journey/content";
import type { MessageDraft } from "./sources";
/** One authored report per fact; multiple senders must not duplicate this identity. */
export function reportWorldFact(f: WorldFact): MessageDraft {
  if (f.kind === "auction-result")
    return {
      id: f.id,
      kind: "reply",
      sender: auctionVenues[f.venue].name,
      title: `第${f.edition}届散场回执`,
      body: f.won.length
        ? `本届已散场。你竞得${f.won.map((l) => `${lotInfo(l.item).name}（实付${l.paid}灵石）`).join("、")}。成交时已经交割，此信只留作凭据；如何使用仍由你决定。`
        : "本届已经散场，你没有竞得拍品。未成交不扣款，可按下届会期再作打算。",
      destination: "world",
      reliability: "public",
      expires: null,
    };
  if (f.kind === "foundation-board")
    return {
      id: f.id,
      kind: "news",
      sender: "试剑榜执事",
      title: "筑基试剑榜添了战绩",
      body: `${f.player}在筑基榜已取得${f.wins.length}场首胜，记录的对手为${f.wins.map((id) => challenges[id].foe).join("、")}。胜负以榜上记录为准；其余席位仍须亲自挑战。`,
      destination: "arena",
      reliability: "public",
      expires: null,
    };
  const content = {
    charted: [
      "退潮遗迹的潮图",
      "古渡商议过的潮路已经落在图上。退潮遗迹尚有未探之处；先在古渡准备行装，再沿潮路入府。潮图只指路，不能替你抵挡阵压。",
    ],
    "outer-cleared": [
      "外府归途的记载",
      "外府石卫已过，第一次分取机缘尚未办妥。回古渡商议镇潮印与澄息篇的取舍，再考虑内府，不必急着返身入阵。",
    ],
    "outer-reward": [
      "内府尚待再探",
      `外府取宝已定，你先取了${f.reward === "seal" ? "镇潮印" : "澄息篇"}。内府潮压更强，先兑现这份机缘、积累修行，再备行装续探。`,
    ],
    complete: [
      "退潮遗迹一行已毕",
      "两层遗迹均已走通，镇潮印与澄息篇的取得已有记录。后续温养与参悟仍须自己完成；旧潮图留作此行见闻，不再把这处旧机缘当作未取之宝。",
    ],
  }[f.phase];
  return {
    id: f.id,
    kind: f.phase === "charted" ? "opportunity" : "reply",
    sender: f.phase === "charted" ? "古渡同道" : "外海行旅记录",
    title: content[0]!,
    body: content[1]!,
    destination: "world",
    reliability: f.phase === "charted" ? "personal" : "public",
    expires: null,
  };
}
export const worldEventMessages = (s: State) =>
  knownWorldFacts(s).map(reportWorldFact);

export function companionMessage(s: State): MessageDraft | null {
  const news = companionNews(s);
  if (!news) return null;
  const titles: Record<number, string> = {
    0: "旧路短笺",
    1: "新旧两版路图",
    2: "筹备闭关",
    3: "旧信与未明近况",
    4: "出关报喜",
    5: "失利后的短笺",
    6: "再试之前",
  };
  return {
    id: `companion:${news.id}`,
    kind: "news",
    sender: s.social.gender === "male" ? "苏婉宁" : "尹照川",
    title: titles[news.id]!,
    body: news.text,
    destination: "relationship",
    reliability: "personal",
    expires: null,
  };
}
