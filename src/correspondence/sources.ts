import { tideMessages } from "../tide-survey/messages";
import { companionMessage, worldEventMessages } from "./events";
import { personalReplies } from "./personal";
import { reunionAvailable, reunionFollowup } from "../golden-reunion";
import type { State } from "../world";
import {
  auctionNotice,
  auctionVenues,
  venueAuction,
  venueIds,
} from "../auction";
import { lotInfo } from "../auction/catalog";
import { hasPactMaterial } from "../secret-pact/revision";
import type { Letter, MessageKind } from "./state";
export type MessageDraft = Omit<
  Letter,
  "received" | "read" | "followed" | "response"
>;
/** Read-only adapters: no random draws, rewards, knowledge unlocks or NPC growth. */
export function messageSources(s: State): MessageDraft[] {
  const out: MessageDraft[] = [
    ...tideMessages(s),
    ...personalReplies(s),
    ...worldEventMessages(s),
  ];
  const add = (
    id: string,
    kind: MessageKind,
    sender: string,
    title: string,
    body: string,
    destination: Letter["destination"] = "world",
    reliability: Letter["reliability"] = "personal",
    expires: number | null = null,
  ) =>
    out.push({
      id,
      kind,
      sender,
      title,
      body,
      destination,
      reliability,
      expires,
    });
  for (const venue of venueIds) {
    const saved = venueAuction(s, venue);
    // Receipt of a real catalogue establishes this venue's correspondence route.
    if (!saved && !(venue === "golden" && s.treasures.goldenKnown)) continue;
    const notice = auctionNotice(s, venue),
      def = auctionVenues[venue];
    if (!notice.announced || notice.closes <= s.month) continue;
    const catalogue =
      saved?.number === notice.number
        ? `本届目录列有${saved.lots.map((l) => lotInfo(l.item).name).join("、")}。`
        : "新届拍品须到当地查看目录。";
    add(
      `auction:${venue}:${notice.number}`,
      "notice",
      def.name,
      `第${notice.number}届会讯`,
      `${def.place}第${notice.opens}月开场，第${notice.closes}月截止入场。${catalogue}请自备灵石并预留路程；错过可候下届。`,
      "world",
      "public",
      notice.closes,
    );
  }
  const q = s.foundationJourney,
    p = s.secretPact;
  if (
    s.realm === 1 &&
    (q.location === "ferry" || hasPactMaterial(s)) &&
    ["none", "declined"].includes(p.stage)
  )
    add(
      "pact:invitation",
      "invitation",
      "叶照",
      "照玄探府之约",
      "照玄旧府罡风未歇，贺崇为补脉法而来，我想看看府内阵纹。你若愿同行，咱们先说定：散财平分，独一份的传承，当面商议。你须修至筑基中期，再从药庄、雪线或古道取妥一路主材，方能抵住那里的罡风。不必赶日子，准备好了再来。",
    );
  if (p.stage === "promised")
    add(
      "pact:accepted",
      "reply",
      "叶照",
      "照玄旧约已记下",
      "同行之约记下了。待你修为稳固、取材妥当，到照玄府外的石阶会合。若身上有伤，务必养好了再来；有别的事耽搁，捎句话便是。",
    );
  if (p.trial === "complete")
    add(
      "pact:completed",
      "news",
      "照玄同行记录",
      "照玄一行已有结果",
      `你已经走出照玄险阵。${p.manual ? "所得护脉法已留在行囊，后续仍须自己研修。" : "此行未得独占传承，撤离险阵的经历仍在。"}分宝与旧怨以当时的决定为准。`,
      "world",
      "public",
    );
  if (s.realm === 2 && s.social.met && q.contact !== "none") {
    const message = companionMessage(s);
    if (message) out.push(message);
  }
  if (
    s.realm === 2 &&
    reunionAvailable(s) &&
    s.goldenStory.reunion.stage === "none"
  )
    add(
      "reunion:invitation",
      "invitation",
      "苏婉宁",
      "古渡侧堤之约",
      "我正要去古渡旁再测一回药船侧堤。你若得闲，托驿使捎句话来，我们约在那里见面。不急着赶路——这些年你练成了什么新本事，我可等着瞧。",
      "story",
    );
  if (s.goldenStory.reunion.stage === "departed")
    add(
      "reunion:followup",
      "reply",
      "苏婉宁",
      "分别后留下的短笺",
      reunionFollowup(s),
      "story",
    );
  if (s.outerSea.notice !== null) {
    const at = s.outerSea.notice + 600;
    add(
      `conclave:notice:${at}`,
      "notice",
      "外海道友",
      "诸宗会期",
      `诸宗之会定在第${at}月。赴会的信留在古渡，路上所需的时日请早作打算。错过正会仍可补试，不必为赶会勉强涉险。`,
      "story",
      "public",
    );
    if (
      s.outerSea.reminded &&
      s.conclave.location === "away" &&
      s.conclave.wins === 0
    )
      add(
        `conclave:due:${at}`,
        "notice",
        "古渡驿使",
        "会谷来信已至",
        "五十年之约已至，道友的会谷来信留在古渡。你可安排赴会，也可先完成手边的修行。",
        "story",
      );
  }
  const t = s.sectContest;
  if (t.stage !== "unheard")
    add(
      `contest:${t.edition}`,
      "notice",
      "听松内比执事",
      "内比会讯",
      `本届内比定于第${t.starts}月开始。有意比试者，请到山门报备、整顿行装。不愿登台者，自便。`,
      "story",
      "public",
    );
  if (s.social.arena.wins > 0)
    add(
      `arena:qi:${s.social.arena.wins}`,
      "rumor",
      "听松擂台看客",
      "擂台旁的新谈资",
      `“${s.name}已经连过${s.social.arena.wins}位对手了。”台边有人转述刚记下的战绩。具体胜负仍可查听松擂台记录。`,
      "arena",
      "hearsay",
    );
  if (q.rescue > 0 && q.rescue < 4)
    add(
      "rescue:request",
      "request",
      "古道路站",
      "古道接应的消息",
      "古道险势阻住了归途，路站已接到求援。请先到路站问明内侧消息，带足补给，再作接应。切勿带伤贸然闯阵。",
      "story",
    );
  if (q.rescue === 4)
    add(
      "rescue:resolved",
      "reply",
      "古道路站",
      "接应已有回音",
      "内外接应已成，受困者已沿归路撤出。先前的求援信若还在路上，请见信的道友知悉，无须再为此奔走。",
      "story",
    );
  return out;
}
