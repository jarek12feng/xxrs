import { knownFriendJourney } from "../friend-journey";
import type { State } from "../world";
import { goldenStoryQuote } from "../golden-story/rules";
import { companionChronology } from "../golden-story/companion";
import { reunionFollowup, reunionAvailable } from "../golden-reunion";
import { pactQuote } from "../secret-pact/rules";
import { LETTER_LIMIT, type Letter } from "./state";
import type { MessageDraft } from "./sources";
export type Contact = "su" | "ye";
export type PersonalTopic = "greeting" | "inquiry" | "invite" | "later";
export type WriteAction = {
  kind: "write";
  recipient: Contact;
  topic: PersonalTopic;
};
export const personalTopics: Record<PersonalTopic, string> = {
  greeting: "捎信报平安",
  inquiry: "询问近况",
  invite: "写信约见",
  later: "告知暂缓相约",
};
export function personalContacts(s: State): { id: Contact; name: string }[] {
  const out: { id: Contact; name: string }[] = [];
  if (
    s.social.gender === "male" &&
    s.social.met &&
    s.foundationJourney.contact !== "none"
  )
    out.push({ id: "su", name: "苏婉宁" });
  if (s.correspondence.letters.some((l) => l.id === "pact:invitation"))
    out.push({ id: "ye", name: "叶照" });
  return out;
}
function chapter(s: State, who: Contact): string {
  return who === "ye"
    ? `${s.realm}-${s.secretPact.stage}-${s.secretPact.trial}`
    : `${s.realm}-${s.foundationJourney.rescue}-${s.goldenStory.companionLetters.includes(4) ? "known" : "unknown"}-${s.goldenStory.reunion.stage}`;
}
export const personalId = (s: State, a: WriteAction) =>
  `personal:${a.recipient}:${a.topic}:${chapter(s, a.recipient)}`;
export const replyId = (id: string) => id.replace(/^personal:/, "answer:");
export function pendingPersonal(s: State, who: Contact): boolean {
  const ids = new Set(s.correspondence.letters.map((l) => l.id));
  return s.correspondence.letters.some(
    (l) => l.id.startsWith(`personal:${who}:`) && !ids.has(replyId(l.id)),
  );
}
export function personalQuote(s: State, a: WriteAction): string {
  if (!personalContacts(s).some((c) => c.id === a.recipient))
    return "尚未留下可靠的联络方式";
  if (!Object.hasOwn(personalTopics, a.topic)) return "没有这种书信";
  if (s.correspondence.letters.length >= LETTER_LIMIT - 1)
    return "旧信已满，暂不能寄出新信";
  if (pendingPersonal(s, a.recipient)) return "上一封信尚在驿路上，先候回音";
  if (s.correspondence.letters.some((l) => l.id === personalId(s, a)))
    return "这番话已经捎去，待有新的经历再叙";
  if (a.topic === "invite")
    return a.recipient === "su"
      ? goldenStoryQuote(s, { kind: "reunion", action: { kind: "invite" } })
          .error
      : pactQuote(s, "promise").error;
  if (a.topic === "later") {
    if (a.recipient === "ye") return pactQuote(s, "decline").error;
    if (s.goldenStory.reunion.stage !== "none")
      return "已有的约定仍在，暂缓书信不能取消同行";
  }
  return "";
}
export function outgoingLetter(s: State, a: WriteAction): Letter {
  const name = a.recipient === "su" ? "苏婉宁" : "叶照";
  const body = {
    greeting:
      "近来一切平安，修行也未荒废。捎这封短信，免你挂念。你在外多保重。",
    inquiry: "想问问你近来可好，手头的事进展如何？若不便回信，待日后再叙。",
    invite:
      a.recipient === "su"
        ? "想与你在外海古渡一叙。我会循旧海路过去，到了再寻你。"
        : "照玄同行之约，我愿应下。待修为与行装妥当再去会合。",
    later: "手头尚有些事未了，这回先不定同行之约。待安顿妥当，再与你相商。",
  }[a.topic];
  return {
    id: personalId(s, a),
    kind: "reply",
    sender: `我 → ${name}`,
    title: personalTopics[a.topic],
    body,
    received: s.month,
    read: true,
    followed: false,
    response: "none",
    destination: "relationship",
    reliability: "personal",
    expires: null,
  };
}
/** The courier follows game time, never wall time; replies grant no knowledge or rewards. */
export function personalReplies(s: State): MessageDraft[] {
  const ids = new Set(s.correspondence.letters.map((l) => l.id));
  return s.correspondence.letters
    .filter(
      (l) =>
        l.id.startsWith("personal:") &&
        !ids.has(replyId(l.id)) &&
        s.month >= l.received + 1,
    )
    .map((l) => {
      const [, who, topic] = l.id.split(":");
      const su = who === "su";
      const reachable = su
        ? (s.realm === 1 &&
            (companionChronology(s)?.age ?? 2400) < 2400 &&
            ![1, 2, 3].includes(s.foundationJourney.rescue) &&
            !["missing", "shelter"].includes(
              s.foundationJourney.whereabouts,
            )) ||
          (s.realm === 2 && reunionAvailable(s))
        : s.realm === 1 &&
          ["none", "declined", "promised"].includes(s.secretPact.stage);
      const body = !reachable
        ? "驿使回执：信已留在旧联络处，未能确认本人收信。此行未见着人，也没打听到近讯。若有回音，再为你捎来。"
        : topic === "greeting"
          ? su
            ? "信收到了，知道你平安，我便放心。下回也写写沿途见闻，哪处旧图画错了，记得替我留意。"
            : "平安便好。照玄府内罡风厉害，莫急着动身，先把护身的药备齐。会合的事，仍依旧约。"
          : topic === "inquiry"
            ? su
              ? suInquiry(s)
              : "我这边仍在筹备入府。罡风难测，你莫省护身药。会合时先把阵具一一试过，再定谁守哪一处。"
            : topic === "later"
              ? su
                ? "那便先忙你的。路图还在，等你得闲，我们再挑一段同走。"
                : "知道了。此番先不算你同行，日后想去，再来信议。"
              : su
                ? "古渡相见的事，我记下了。不必赶日子，到了寻尺绳上的旧记号便是。"
                : "照玄之约记下了，不限日子。待你修为、行装齐备，我们在古道外缘会合。";
      return {
        id: replyId(l.id),
        kind: "reply",
        sender: reachable ? (su ? "苏婉宁" : "叶照") : "药路驿使",
        title: `回音：${l.title}`,
        body,
        destination: topic === "invite" ? "story" : "relationship",
        reliability: "personal",
        expires: null,
      };
    });
}

/** Uses only shared/confirmed history, never the private breakthrough schedule. */
function suInquiry(s: State): string {
  const known = knownFriendJourney(s);
  if (known) return `近来的勘潮消息已经捎到旧联络处，依那几封信为准。${known}`;
  const r = s.goldenStory.reunion;
  if (r.stage === "departed") return reunionFollowup(s);
  if (r.stage === "invited")
    return "古渡的约定我记着。手头的事办妥再来，到了寻尺绳上的旧记号，别认错了。";
  if (["met", "planned", "anchored", "resolved", "shared"].includes(r.stage))
    return "侧堤那几处水尺，还是照说好的来。纸上说不清潮势，等到堤边，我指给你看。";
  if (s.goldenStory.companionLetters.includes(4))
    return "结丹后，我又惦记起药船走的那段潮路。从前看不清的水下暗流，如今总算能试着探一探。你若有意，我们约在古渡见面？";
  if (s.foundationJourney.rescue === 4)
    return "古道那回，你在外头接应，我才敢往回走。那几个回讯的记号，可别忘了。近来我也该静下心修行，待有进境，再写信给你。";
  if (s.foundationJourney.whereabouts === "away")
    return "我还循先前说的路走，信照旧处寄便好。你安心修行，别惦记着赶来。下回见面，我可要听听你都去了哪里。";
  return "信收到了。旧图上还有几处我拿不准，想再走一遍。你呢，近来修行可顺遂？";
}
