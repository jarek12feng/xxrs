import { friendVisitQuote, visitFriend } from "../friend-journey/visit";
import { supplyQuote, friendConfirmQuote, confirmFriend } from "../friend-journey";
import type { State } from "../world";
import { activityInterruption } from "../scene-activity";
import { pactQuote, runPact } from "../secret-pact/rules";
import {
  companionNews,
  goldenStoryQuote,
  runGoldenStory,
} from "../golden-story/rules";
import { messageSources } from "./sources";
import { LETTER_LIMIT, type Letter } from "./state";
import {
  personalQuote,
  outgoingLetter,
  replyId,
  type WriteAction,
} from "./personal";
export type CorrespondenceAction =
  | { kind: "supplyFriend" }
  | { kind: "visitFriend" }
  | WriteAction
  | { kind: "collect" }
  | {
      kind: "read" | "follow" | "accept" | "decline" | "confirm";
      letter: string;
    };
/** Called only on a private command draft, once after settlement, never in render. */
export function deliverMessages(s: State): boolean {
  if (s.status !== "alive") return false;
  const letters = s.correspondence.letters;
  const ids = new Set(letters.map((l) => l.id));
  let changed = false;
  for (const source of messageSources(s)) {
    if (ids.has(source.id) || letters.length >= LETTER_LIMIT) continue;
    letters.push({
      ...source,
      received: s.month,
      read: false,
      followed: false,
      response: "none",
    });
    ids.add(source.id);
    changed = true;
  }
  return changed;
}
export function messageStatus(s: State, l: Letter): string {
  if(l.id.startsWith("friend:su:")) {
    const f=s.friendJourney.facts.find(f=>`friend:su:${f.id}`===l.id);
    return f?.confirmedAt!=null ? `第${f.confirmedAt}月已核验` : l.reliability==='hearsay'?'沿途转述，等本人回信':'可核验本人来信';
  }
  if (l.id.startsWith("tide:"))
    return l.id.endsWith(":result") ||
      Number(l.id.split(":")[1]) === s.tideSurvey.edition
      ? "本次已有行旅结果"
      : l.expires !== null && s.month >= l.expires
        ? "本次已涨潮，可候下次"
        : "先到古渡核对潮期与行装";
  if (l.id.startsWith("personal:"))
    return s.correspondence.letters.some((reply) => reply.id === replyId(l.id))
      ? "已有回执"
      : "已寄出，候回音";
  if (l.id.startsWith("sea:ruins"))
    return s.outerSea.cleared === 2
      ? "此行已完成，旧信留存"
      : "仍有后续，可查看去路与准备";
  if (l.id.startsWith("auction:") && l.id.endsWith(":result"))
    return "本届已散场，成交已交割";
  if (l.id.startsWith("auction:")) {
    const [, venue, number] = l.id.split(":");
    const saved =
      s.treasures.auction?.venue === venue
        ? s.treasures.auction
        : s.treasures.auctionArchive[venue as "market" | "foundation"];
    if (saved?.number === Number(number) && saved.closed) return "本届已散场";
  }
  if (l.expires !== null && s.month >= l.expires)
    return "已过入场日期，可候下届";
  if (l.id.startsWith("pact:")) {
    if (s.secretPact.trial === "complete") return "此行已完成";
    if (s.secretPact.stage === "resolved") return "分宝已定，仍须走出险阵";
    if (["inside", "betrayed"].includes(s.secretPact.stage))
      return "已赴约，历练尚未结束";
    if (s.secretPact.stage === "promised") return "已约同行，无固定期限";
    if (s.secretPact.stage === "declined") return "已暂谢绝，日后仍可商议";
    if (s.realm !== 1) return "此阶段不能赴此约";
  }
  if (l.id === "reunion:invitation")
    return s.goldenStory.reunion.stage === "none"
      ? "可回信相约，现场仍须亲自前往"
      : s.goldenStory.reunion.stage === "departed"
        ? "同行已完成，各赴前程"
        : "已约古渡，未完测读可续做";
  if (l.id === "rescue:request")
    return s.foundationJourney.rescue === 4
      ? "接应已完成"
      : "按古道现有进度继续接应";
  if (
    l.id.startsWith("companion:") &&
    s.goldenStory.companionLetters.includes(Number(l.id.split(":")[1]))
  )
    return "已核验并记入人物经历";
  if (
    l.id.startsWith("contest:") &&
    ["finished", "deferred"].includes(s.sectContest.stage)
  )
    return "本届已有安排，以山门现况为准";
  if (l.id.startsWith("conclave:") && s.conclave.wins > 0)
    return "已有赴会战绩，可在现场续行";
  return l.response === "none"
    ? "已送达"
    : l.response === "declined"
      ? "已婉拒"
      : l.response === "confirmed"
        ? "已核验"
        : "已答应";
}
export function correspondenceQuote(s: State, a: CorrespondenceAction): string {
  const error = activityInterruption(s);
  if (error) return error;
  if (
    s.ascension ||
    s.nascentSoul.attempt ||
    s.itemGrowth.trial ||
    s.spirit.trial
  )
    return "先完成眼前行功";
  if (a.kind === "collect") return "";
  if (a.kind === "visitFriend") return friendVisitQuote(s);
  if (a.kind === "supplyFriend") return supplyQuote(s);
  if (a.kind === "write") return personalQuote(s, a);
  const l = s.correspondence.letters.find((l) => l.id === a.letter);
  if (!l) return "尚未收到这封信";
  if (a.kind === "read") return l.read ? "这封信已经读过" : "";
  if (a.kind === "follow") return "";
  if (!l.read) return "先展开读信，再作回应";
  if (a.kind === "accept" || a.kind === "decline") {
    if (l.id === "reunion:invitation" && a.kind === "accept")
      return goldenStoryQuote(s, {
        kind: "reunion",
        action: { kind: "invite" },
      }).error;
    if (l.id !== "pact:invitation") return "这封信无需答复同行";
    return pactQuote(s, a.kind === "accept" ? "promise" : "decline").error;
  }
  if (a.kind === "confirm") {
    if(l.id.startsWith("friend:su:")) return friendConfirmQuote(s,l.id);
    const news = companionNews(s);
    if (!news || l.id !== `companion:${news.id}`)
      return "这是一封旧信，近况请以新的来信为准";
    return goldenStoryQuote(s, { kind: "companion" }).error;
  }
  return "未知传讯操作";
}
export function runCorrespondence(
  input: State,
  a: CorrespondenceAction,
  id: string,
): State {
  if (input.seen.includes(id) || correspondenceQuote(input, a)) return input;
  let s: State;
  if(a.kind === "visitFriend") {s=structuredClone(input);visitFriend(s);s.seen=[...s.seen,id].slice(-100);return s;}
  if(a.kind === "supplyFriend") {
    s=structuredClone(input);s.herbs-=2;s.friendJourney.suppliedAt=s.month;
    s.seen=[...s.seen,id].slice(-100);return s;
  }
  if (a.kind === "write") {
    const letter = outgoingLetter(input, a);
    if (a.topic === "invite")
      s =
        a.recipient === "su"
          ? runGoldenStory(
              input,
              { kind: "reunion", action: { kind: "invite" } },
              id,
              (n) => n,
            )
          : runPact(input, "promise", id, (n) => n);
    else if (a.topic === "later" && a.recipient === "ye")
      s = runPact(input, "decline", id, (n) => n);
    else s = structuredClone(input);
    if (s === input) return input;
    s.correspondence.letters.push(letter);
    if (!s.seen.includes(id)) s.seen = [...s.seen, id].slice(-100);
    return s;
  }
  if (a.kind === "accept" && a.letter === "reunion:invitation") {
    s = runGoldenStory(
      input,
      { kind: "reunion", action: { kind: "invite" } },
      id,
      (n) => n,
    );
  } else if (a.kind === "accept" || a.kind === "decline") {
    s = runPact(
      input,
      a.kind === "accept" ? "promise" : "decline",
      id,
      (n) => n,
    );
  } else if (a.kind === "confirm") {
    if(a.letter.startsWith("friend:su:")){s=structuredClone(input);confirmFriend(s,a.letter);}
    else s = runGoldenStory(input, { kind: "companion" }, id, (n) => n);
  } else s = structuredClone(input);
  if (s === input) return input;
  if (a.kind === "collect") {
    if (!deliverMessages(s)) return input;
  } else {
    const l = s.correspondence.letters.find((l) => l.id === a.letter)!;
    if (a.kind === "read") l.read = true;
    else if (a.kind === "follow") l.followed = !l.followed;
    else
      l.response =
        a.kind === "accept"
          ? "accepted"
          : a.kind === "decline"
            ? "declined"
            : "confirmed";
  }
  if (!s.seen.includes(id)) s.seen = [...s.seen, id].slice(-100);
  return s;
}
