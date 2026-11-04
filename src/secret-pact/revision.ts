import type { State } from "../world";
import type { SecretPact } from "./state";
import { pactActivity } from "./state";
export type PactRevisionAction =
  | "guardFlow"
  | "readFlow"
  | "breakFlow"
  | "retryFlow"
  | "withdrawFlow"
  | "notice"
  | "preparePursuit"
  | "confront"
  | "witness"
  | "identityAccept"
  | "identityDecline"
  | "observeScale"
  | "foreignNews"
  | "replyHome"
  | "keepHome";
export const revisionActions: readonly string[] = [
  "guardFlow",
  "readFlow",
  "breakFlow",
  "retryFlow",
  "withdrawFlow",
  "notice",
  "preparePursuit",
  "confront",
  "witness",
  "identityAccept",
  "identityDecline",
  "observeScale",
  "foreignNews",
  "replyHome",
  "keepHome",
];
export const hasPactMaterial = (s: State) =>
  ["salamander", "deer", "frontier"].some((x) =>
    s.foundationJourney.won.includes(x as never),
  );
export function pactDestinationError(
  s: State,
  site: Exclude<SecretPact["site"], "away">,
) {
  const q = s.foundationJourney,
    p = s.secretPact;
  if (s.realm !== 1) return "筑基时再赴此行";
  if (pactActivity(p)) return "先完成眼前险阵，或沿退路撤回";
  if (q.rescue > 0 && q.rescue < 4) return "先完成古道接应，来信没有期限";
  return site === "zhaoxuan"
    ? q.cultivation < 200 || q.ferry < 4 || !hasPactMaterial(s)
      ? "筑基中期完成三地任一路取材，再赴照玄"
      : !["promised", "inside", "betrayed", "resolved"].includes(p.stage)
        ? "先与叶照约定同行"
        : p.trial === "complete"
          && !(p.outcome === "retreated" && !p.settled) ? "照玄历练已完成"
          : ""
    : p.pursuit !== "notified" || p.settled
      ? "尚无待处理的断碑驿来信"
      : "";
}
/** Called only after the shared travel engine has paid and completed the route. */
export function arrivePactSite(
  s: State,
  site: Exclude<SecretPact["site"], "away">,
) {
  if (pactDestinationError(s, site)) return false;
  s.secretPact.site = site;
  s.secretPact.last =
    site === "zhaoxuan"
      ? "你抵达照玄外的石阶。叶照指着退路，等你决定怎样备阵。"
      : "你走进断碑驿。驿主留出空院，要求先说清旧约，再论争端。";
  return true;
}
export function flowCue(s: State) {
  const p = s.secretPact,
    h = p.hazard;
  if (!h) return "";
  const expected = ["guardFlow", "readFlow", "breakFlow"][h.progress]!;
  if (p.site === "brokenStele")
    return {
      expected,
      text:
        expected === "guardFlow"
          ? "对手横剑压来，先护住身前。"
          : expected === "readFlow"
            ? "剑影绕向侧面，辨清实招再应对。"
            : "来招已尽，趁空隙反击迫他退开。",
    };
  return {
    expected,
    text:
      expected === "guardFlow"
        ? "逆流正压向归绳，先护住阵脚。"
        : expected === "readFlow"
          ? "两道回流相交，须辨出仍与出口相连的细流。"
          : "阵隙已露，趁回流未合切开出口。",
  };
}
export function revisionQuote(s: State, a: PactRevisionAction) {
  const p = s.secretPact,
    q = s.foundationJourney;
  let error = "",
    herbs = 0,
    stones = 0,
    months = 0;
  if (["guardFlow", "readFlow", "breakFlow", "withdrawFlow"].includes(a))
    error = p.hazard ? "" : "眼前没有交锋或险阵";
  else if (a === "retryFlow") {
    months = 1;
    error =
      p.site !== "zhaoxuan" ||
      !["crossing", "escape", "stabilize"].includes(p.trial) ||
      p.hazard
        ? "先抵达照玄待完成的通路"
        : s.injury > 2
          ? "先养伤至 2 或以下"
          : "";
  } else if (a === "notice")
    error =
      p.pursuit !== "pending" ||
      p.site !== "away" ||
      (q.rescue > 0 && q.rescue < 4)
        ? "在安全地点交接后再收信，古道接应期间暂缓"
        : "";
  else if (a === "preparePursuit") {
    herbs = 2;
    error =
      p.pursuit !== "notified" || p.pursuitPrepared || p.hazard
        ? "此时无需再备应战药包"
        : "";
  } else if (a === "confront") {
    months = 1;
    error =
      p.site !== "brokenStele" ||
      p.pursuit !== "notified" ||
      p.settled ||
      p.hazard
        ? "先到断碑驿对质"
        : s.injury > 2
          ? "先养伤至 2 或以下"
          : "";
  } else if (a === "witness") {
    error =
      p.site !== "brokenStele" ||
      p.pursuit !== "notified" ||
      p.settled ||
      p.hazard
        ? "先在断碑驿当面核对旧约"
        : "";
    if (p.aggressor === "player") {
      herbs = 6;
      stones = 24;
    }
  } else if (a === "identityAccept" || a === "identityDecline")
    error =
      p.story.identity !== "none" ||
      q.location !== "home" ||
      !s.adventure.road.surveyed
        ? "青嶂开路后回行前居交接"
        : "";
  else if (a === "observeScale")
    error =
      p.story.scale || q.location !== "ferry" || q.ferry < 2
        ? "进入沉井后可核对旧刻度一次"
        : "";
  else if (a === "foreignNews")
    error =
      p.story.news !== "none" ||
      !["estate", "snow", "frontier"].includes(q.location) ||
      !q.won.includes(({estate:"salamander",snow:"deer",frontier:"frontier"} as const)[q.location as "estate"|"snow"|"frontier"])
        ? "在取材地点核对来往货单后可听闻外宗"
        : "";
  else if (a === "replyHome" || a === "keepHome")
    error =
      p.story.letter !== "none" || q.location !== "home" || !q.epilogue
        ? "筑基归山交接后再处理家书"
        : "";
  if (
    [
      "identityAccept",
      "identityDecline",
      "observeScale",
      "foreignNews",
      "replyHome",
      "keepHome",
    ].includes(a) &&
    p.site !== "away"
  )
    error = "回到对应的交接地点再谈";
  if (
    p.hazard &&
    !["guardFlow", "readFlow", "breakFlow", "withdrawFlow"].includes(a)
  )
    error = "先结束眼前交锋";
  return { error, herbs, stones, months };
}
export function applyRevision(s: State, a: PactRevisionAction) {
  const p = s.secretPact,
    q = s.foundationJourney;
  if (["guardFlow", "readFlow", "breakFlow"].includes(a)) {
    const h = p.hazard!,
      cue = flowCue(s);
    const correct = !!cue && a === cue.expected;
    h.turn++;
    if (correct) h.progress++;
    else h.hp -= p.preparation === "anchor" || p.pursuitPrepared ? 35 : 45;
    p.last =
      p.site === "brokenStele"
        ? correct
          ? "你接住这一招，逼对手退开一步；驿主在旁记下交锋。"
          : "你误判了来剑，护体被切开；仍可收剑退回院门整备。"
        : correct
          ? "你顺着来势稳住灵元，护着身后的人向出口挪了一段。"
          : "你错过回流的空隙，护体被撕开；归路仍在，可以撤回整备。";
    if (h.progress >= 3) {
      p.hazard = null;
      if (p.site === "brokenStele") {
        p.settled = true;
        p.pursuit = "closed";
        p.last =
          "交锋结束，你停手收剑。驿主与叶照各留一份止争约：双方不再追索，已学之法不退。" +
          (p.aggressor === "player"
            ? "叶照仍拒绝与你同行，毁约记录不被抹去。"
            : "叶照重申贺崇先动手，你守约夺回不欠他玉简。");
      } else if (p.trial === "crossing") {
        p.trial = "division";
        p.last =
          "你护住阵脚、辨明逆流并切开石门；叶照接住归绳，贺崇挡住最后一股回流。三人进入内室，石台只有一枚受法即碎的玉简，无法分抄。贺崇按着旧伤：“此法能补我的经脉，我不能轻易让。”";
      } else {
        p.trial = "complete";
        p.last = p.manual
          ? "你用自己的灵元接续内外逆流，稳住离府通路。护脉法仍归你，持续运转的实测也已完成。"
          : "你没有拿到玉简，却在撤离险阵中护住归绳，将叶照和落在后面的同行者带出风口。持续逆流中维持循环的历练已成；后期仍须凝练主材与稳脉。";
      }
    } else if (h.hp <= 0 || h.turn >= 6) {
      p.hazard = null;
      s.injury = Math.min(6, s.injury + 2);
      p.last +=
        " 本场败退，伤势 +2，已得主材和护脉法保留。养伤后可重试，未计作完成。";
    }
    return;
  }
  if (a === "withdrawFlow") {
    p.hazard = null;
    p.last =
      "你沿预留归绳退到安全石台，没有新增伤势；已用月份不退。险阵尚未完成，整备后可重试。";
    return;
  }
  if (a === "retryFlow" || a === "confront") {
    p.hazard = { hp: 100, progress: 0, turn: 0 };
    p.last =
      a === "confront"
        ? (p.manual ? "贺崇败后仍在治伤，托同阶护路修士持原信对质。" : "贺崇能够自行赶路，持原信到驿中对质。") +
          (p.aggressor === "rival" ? "你指出先毁约者，约定只论胜负，胜后互不追索。" : "叶照只证明你先动手的事实。你接受院中止争较量；胜出不会恢复她的信任。")
        : "你重新系好归绳，进入尚未完成的逆流通路。";
    return;
  }
  if (a === "notice") {
    p.pursuit = "notified";
    p.last =
      "安全交接时，驿主送来断碑驿对质书。" +
      (p.aggressor === "rival"
        ? (p.manual ? "贺崇仍不甘失去补脉法；" : "贺崇仍持着玉简，却担心你日后追索；") + "叶照愿出示他先毁约的记录，你并不欠他玉简。"
        : "贺崇要求你为先夺玉简交代；叶照不会替你遮掩。") +
      "可先整备、借见证人谈判、赴约较量或暂缓，无期限，不牵连苏婉宁。";
    return;
  }
  if (a === "preparePursuit") {
    p.pursuitPrepared = true;
    p.last = "灵草 2 配成应战药包；断碑驿失误承伤由 45 降至 35。";
    return;
  }
  if (a === "witness") {
    p.settled = true;
    p.pursuit = "closed";
    p.last =
      p.aggressor === "player"
        ? "你承认先毁约，交出六株灵草与二十四灵石作治伤补偿。贺崇签下不再追索，叶照仍拒绝同行；已学法门不退。"
        : "叶照逐项核对石门前的旧约，证明贺崇先夺宝。贺崇在驿主面前认下止争，你无需赔付并不欠他的玉简。";
    return;
  }
  if (a === "identityAccept" || a === "identityDecline") {
    p.story.identity = a === "identityAccept" ? "accept" : "decline";
    p.last =
      (s.journey.branch !== "none"
        ? "温蘅不再把你排进新弟子的轮值，邀请你日后带队护药。"
        : "温蘅以听松宗名义邀你合作护药，明确散修仍无宗籍。") +
      (a === "identityAccept"
        ? "你答应在方便时接应药队，不许下随叫随到的承诺。"
        : "你说明仍要远行，婉拒固定职责；求教与合作的门仍开着。") +
      "师长提醒：中期取材之后，还须在照玄的持续逆流中检验灵元，才能稳步迈向后期。";
    return;
  }
  if (a === "observeScale") {
    p.story.scale = true;
    p.last =
      "你将水痕与井壁刻度逐一对齐：同一水位，旧刻记下的灵潮却高得多。" +
      (s.social.gender === "male" && q.heroine.meeting !== "none" && !["away","missing","shelter"].includes(q.whereabouts) ? "你回到井口，将拓痕交给苏婉宁。她只记“旧测法与今日不同”，留下测量位置；" : "你在拓痕边记下“旧测法与今日不同”，留下测量位置；") + "眼前证据还不足以解释原因。";
    return;
  }
  if (a === "foreignNews") {
    p.story.news = q.location as "estate" | "snow" | "frontier";
    p.last =
      q.location === "estate"
        ? "你帮药工对照货单，发现听松的药换来澄渊海产。药工只知道潮路损耗正在涨，不知道外海宗门的内情。"
        : q.location === "snow"
          ? "你核对修阵副簿，见衡璇院修订的阵式旁仍留照霜旧标。维护者只谈怎样让雪夜的门不再失守，不敢替两宗断旧账。"
          : "药队带来海产补给，你对照药签，初次听见澄渊维护潮路、衡璇校正海图的分工。陶泊说明自己只做过这段运输。";
    return;
  }
  p.story.letter = a === "replyHome" ? "reply" : "keep";
  p.last =
    "归山交接后，你收到家乡药队保存的旧信，写的是当年晒药与新学徒接班的琐事；送信人没有近年的亲见消息，不能据此判断亲人如今安危。" +
    (a === "replyHome"
      ? "你留下回信与可投递的行前居地址，请药队核实后转交。"
      : "你将旧信收入行囊，暂不托人投递。") +
    (s.social.gender === "male" && q.heroine.meeting !== "none" && !["away","missing","shelter"].includes(q.whereabouts) ? "苏婉宁摊开自己新补的路图，与你各说下一程的打算。" : s.social.gender === "female" && q.target === "companion" && q.whereabouts === "rescued" ? "尹照川收好新补的阵图，与你各说下一程的打算。" : "你收好行路记录，把下一程要问的事写在信封背面。");
}
