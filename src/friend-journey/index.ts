import { ceremonyInProgress } from "./presence";
import type { State } from "../world";
import { reunionAvailable } from "../golden-reunion";
import { LETTER_LIMIT } from "../correspondence/state";
export type JourneyPhase =
  "preparing" | "traveling" | "returned" | "resting" | "complete";
export interface JourneyFact {
  id: JourneyPhase;
  occurredAt: number;
  learnedAt: number | null;
  confirmedAt: number | null;
}
export interface FriendJourney {
  startedAt: number | null;
  suppliedAt: number | null;
  visitedAt: number | null;
  facts: JourneyFact[];
}
export const freshFriendJourney = (): FriendJourney => ({
  startedAt: null,
  suppliedAt: null,
  visitedAt: null,
  facts: [],
});
const phases: JourneyPhase[] = [
  "preparing",
  "traveling",
  "returned",
  "resting",
  "complete",
];
const offsets = [0, 3, 9, 12, 18];
const titles = [
  "苏婉宁准备再勘潮路",
  "药船捎来的出行消息",
  "侧堤归来的消息",
  "苏婉宁寄来近况",
  "苏婉宁已休整妥当",
];
function body(s: State, i: number): string {
  const supplied = s.friendJourney.suppliedAt !== null;
  return [
    `我想再去侧堤外的浅滩核几处旧图，定在第${s.friendJourney.startedAt! + 3}月动身。你安心料理自己的事；若手头宽裕，动身前捎两份灵草给我便好。`,
    "药船上的人说，苏婉宁已带测潮绳往侧堤外去了。这是沿途转述，尚未收到她的亲笔回信。",
    "有人在古渡看见一位带测潮绳的女修返航，说像是苏婉宁。是否平安，还须等她本人报信。",
    supplied
      ? "是我回来了。浅滩忽起横流，你寄来的灵草正好用来调息，测记也保住了。这几日留在古渡整理路图，歇一歇再走。"
      : "我回到古渡了。浅滩横流比旧图记得急，撤回时伤了手臂，几处测记也浸坏了。先养好伤，缺下的留待以后，不必赶来。",
    supplied
      ? "休整完了，这回测记已抄成一份药船可用的浅滩图。你的灵草帮了忙，多谢。以后若再走这条潮路，我们再对一对旧记号。"
      : "手臂已经养好，破损的测记也理过了。未核实的地方我留了空白，不拿猜测误导后来的人。接下来先静修一阵。",
  ][i]!;
}
/** Runs on command-owned drafts. One authored trip; no wall clock, random draws or rewards. */
export function settleFriendJourney(before: State, after: State): void {
  if (
    before.life !== after.life ||
    after.month <= before.month ||
    before.status !== "alive"
  )
    return;
  const j = after.friendJourney;
  if (j.startedAt === null) {
    if (
      before.goldenStory.reunion.stage !== "departed" ||
      ceremonyInProgress(before) ||
      !reunionAvailable({ ...before, month: before.month + 1 })
    )
      return;
    // New saves begin prospectively, never backdate a migrated character's history.
    j.startedAt = before.month + 1;
  }
  for (let i = 0; i < phases.length; i++) {
    const occurredAt = j.startedAt + offsets[i]!;
    if (occurredAt > after.month) break;
    // Beyond reliable lifespan: leave whereabouts unknown, never fabricate death or recovery.
    if (!reunionAvailable({ ...before, month: occurredAt })) break;
    if (!j.facts.some((f) => f.id === phases[i]))
      j.facts.push({
        id: phases[i]!,
        occurredAt,
        learnedAt: null,
        confirmedAt: null,
      });
  }
  if (after.status !== "alive") return;
  for (const f of j.facts) {
    if (
      f.learnedAt !== null ||
      f.occurredAt + 1 > after.month ||
      after.correspondence.letters.length >= LETTER_LIMIT
    )
      continue;
    const i = phases.indexOf(f.id);
    const id = `friend:su:${f.id}`;
    if (after.correspondence.letters.some((l) => l.id === id)) continue;
    f.learnedAt = Math.max(f.occurredAt + 1, before.month);
    after.correspondence.letters.push({
      id,
      kind: i === 1 || i === 2 ? "rumor" : "news",
      sender: i === 1 || i === 2 ? "药路驿使" : "苏婉宁",
      title: titles[i]!,
      body: body(after, i),
      received: f.learnedAt,
      read: false,
      followed: false,
      response: "none",
      destination: "relationship",
      reliability: i === 1 || i === 2 ? "hearsay" : "personal",
      expires: null,
    });
  }
}
export function supplyQuote(s: State): string {
  const j = s.friendJourney;
  if (
    j.startedAt === null ||
    !j.facts.some((f) => f.id === "preparing" && f.learnedAt !== null)
  )
    return "尚未收到勘潮来信";
  if (j.suppliedAt !== null) return "灵草已经捎去";
  if (s.month >= j.startedAt + 3) return "她已经动身，行装不再追加";
  if (s.herbs < 2) return "需灵草2";
  return "";
}
export function friendConfirmQuote(s: State, id: string): string {
  const f = s.friendJourney.facts.find((f) => `friend:su:${f.id}` === id);
  if (!f || f.learnedAt === null) return "尚未收到消息";
  if (f.confirmedAt !== null) return "已核验这段经历";
  if (["traveling", "returned"].includes(f.id))
    return "这是转述，须等本人回信或返渡后当面核验";
  return "";
}
export function confirmFriend(s: State, id: string): void {
  const target = s.friendJourney.facts.find((f) => `friend:su:${f.id}` === id)!;
  // A firsthand return letter confirms the earlier departure and return rumors too.
  for (const f of s.friendJourney.facts)
    if (
      f.learnedAt !== null &&
      f.occurredAt <= target.occurredAt &&
      f.confirmedAt === null
    )
      f.confirmedAt = s.month;
}
export function knownFriendJourney(s: State): string {
  const f = s.friendJourney.facts.filter((f) => f.learnedAt !== null).at(-1);
  if (!f) return "";
  return `${titles[phases.indexOf(f.id)]} · 发生于第${f.occurredAt}月，得知于第${f.learnedAt}月 · ${f.confirmedAt === null ? "尚未核验" : `第${f.confirmedAt}月核验`}`;
}
export function validFriendJourney(s: State, legacy = false): boolean {
  const j = s.friendJourney;
  if (!j || !Array.isArray(j.facts) || j.facts.length > 5) return false;
  const date = (v: unknown): v is number =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= s.month;
  if (j.startedAt === null)
    return j.suppliedAt === null && (legacy || j.visitedAt === null) && j.facts.length === 0;
  if (
    !date(j.startedAt) ||
    s.goldenStory?.reunion?.stage !== "departed" ||
    j.startedAt <= s.goldenStory.reunion.departedAt! ||
    j.facts.length === 0
  )
    return false;
  if (
    j.suppliedAt !== null &&
    (!date(j.suppliedAt) ||
      j.suppliedAt < j.startedAt + 1 ||
      j.suppliedAt >= j.startedAt + 3)
  )
    return false;
  if (!legacy && j.visitedAt !== null && (!date(j.visitedAt) || j.visitedAt < j.startedAt+9 || j.visitedAt >= j.startedAt+18)) return false;
  return j.facts.every(
    (f, i) =>
      f &&
      f.id === phases[i] &&
      date(f.occurredAt) &&
      f.occurredAt === j.startedAt! + offsets[i]! &&
      (f.learnedAt === null
        ? f.confirmedAt === null
        : date(f.learnedAt) &&
          (f.learnedAt >= f.occurredAt + 1 || (!legacy && f.learnedAt === f.occurredAt && j.visitedAt === f.learnedAt && f.confirmedAt === f.learnedAt)) &&
          (f.confirmedAt === null ||
            (date(f.confirmedAt) && f.confirmedAt >= f.learnedAt))),
  );
}
