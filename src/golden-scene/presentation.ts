import type { State } from "../core";
import { foundationPower } from "../foundation-journey/combat";
import { conclaveFoe } from "../conclave/rules";
import { seaFoe } from "../outer-sea/rules";
export type GoldenDomain = "sea" | "conclave";
export const rivalImages = [
  "/art/conclave/gu-cangyao-v1.webp",
  "/art/conclave/ji-wenshuang-v1.webp",
  "/art/conclave/cheng-yanzhou-v1.webp",
];
export function goldenCombat(s: State, domain: GoldenDomain) {
  const d = domain === "sea" ? s.outerSea.duel : s.conclave.duel;
  if (!d) return null;
  const foe =
    domain === "sea" ? seaFoe(s.outerSea.duel!.depth) : conclaveFoe(s);
  const contest = domain === "conclave" && s.conclave.duel!.kind === "contest";
  const array =
    domain === "conclave" && !contest && s.conclave.duel!.index === 1;
  return {
    id:
      domain === "sea"
        ? `sea-${s.outerSea.duel!.depth}`
        : `conclave-${s.conclave.duel!.kind}-${s.conclave.duel!.index}`,
    turn: d.turn,
    player: d.hp,
    enemy: d.enemy,
    enemyName: foe.name,
    enemyImage: contest
      ? rivalImages[s.conclave.duel!.index]
      : array
        ? undefined
        : "/art/characters/golem.webp",
    effect: d.effect,
    enemyMax: foe.hp,
    playerMax:
      foundationPower(s).hp +
      (domain === "sea"
        ? s.outerSea.pact === "share"
          ? 12
          : 0
        : s.conclave.duel!.kind === "vault" && s.conclave.route === "shelter"
          ? 16
          : 0),
    array,
  };
}
export function goldenSnapshot(s: State, domain: GoldenDomain) {
  const o = s.outerSea,
    c = s.conclave;
  return {
    domain,
    life: s.life,
    place: domain === "sea" ? o.location : c.location,
    alive: s.status === "alive",
    pending: !!s.pending,
    combat: !!(domain === "sea" ? o.duel : c.duel),
    wins: c.wins,
    depth: domain === "sea" ? o.cleared : c.depth,
    attuned: domain === "sea" ? o.attuned : c.attuned,
    method: domain === "sea" ? o.method : c.method,
    stage: c.stage,
    injury: s.injury,
    retryAt: c.retryAt,
    prepared: domain === "sea" ? o.prepared : c.supplies,
    last: domain === "sea" ? o.last : c.last,
    seal: o.seal,
    manual: o.manual,
  };
}
export type GoldenSnapshot = ReturnType<typeof goldenSnapshot>;
export function goldenCue(
  before: GoldenSnapshot,
  after: GoldenSnapshot,
): string | null {
  if (
    before.domain !== after.domain ||
    before.life !== after.life ||
    !after.alive ||
    after.pending ||
    after.combat
  )
    return null;
  // Victories return to safety in the same settled command. No inferred animation rewards.
  if (after.depth > before.depth)
    return after.domain === "sea"
      ? "潮阵止息，沿石道回渡"
      : after.depth === 1
        ? "定神珠入手，回谷温养"
        : "传承与灵髓入手，回谷参悟";
  if (after.wins > before.wins)
    return after.wins === 2
      ? "收势下台，入境资格已记下"
      : "收势下台，胜绩记入名册";
  if (before.last !== after.last && before.combat && !after.combat) {
    if (after.injury > before.injury || after.retryAt > before.retryAt)
      return after.domain === "conclave" && after.retryAt > before.retryAt
        ? "收势下台，先调息养伤，半年后再试"
        : after.domain === "sea"
          ? "退回古渡，先调息养伤"
          : "退回会谷，先调息养伤";
    return after.domain === "sea"
      ? "循石道撤回，已有所得仍在"
      : "循来路收势，已有胜绩与所得仍在";
  }
  if (before.place !== after.place) {
    if (after.place === "ruins")
      return after.depth
        ? "循旧路入内府，石卫仍守着阵眼"
        : "踏入退潮外府，先看清石卫来势";
    if (after.place === "vault")
      return after.depth
        ? "重返归潮深处，定神珠护住识海"
        : "沿石阶入归潮，守珠傀儡立在阵前";
    if (before.place === "ruins" && after.place === "ferry")
      return "循石道撤回，已探明的路仍在";
    if (before.place === "vault" && after.place === "court")
      return "沿石阶回谷，已探明的路仍在";
    return null;
  }
  if (!before.prepared && after.prepared) return "行装已备妥，可以动身";
  if (after.stage > before.stage) return "丹元凝定，气息渐稳";
  if (!before.attuned && after.attuned)
    return after.domain === "sea" ? "镇潮印与灵息相合" : "定神珠融入护体灵光";
  if (before.method !== after.method && after.method !== "none")
    return "合卷调息，新法运转";
  if ((!before.seal && after.seal) || (!before.manual && after.manual))
    return !before.seal && after.seal ? "镇潮印收进行囊" : "澄息篇收进行囊";
  return null;
}

/** A short presentation of an already settled result, never an action queue. */
export function goldenPerformance(
  before: GoldenSnapshot,
  after: GoldenSnapshot,
) {
  const label = goldenCue(before, after);
  if (!label) return null;
  const kind =
    after.depth > before.depth
      ? "return"
      : after.wins > before.wins
        ? "victory"
        : after.stage > before.stage
          ? "breakthrough"
          : !before.attuned && after.attuned
            ? "attune"
            : before.method !== after.method
              ? "method"
              : before.combat && !after.combat && before.last !== after.last
                ? after.injury > before.injury || after.retryAt > before.retryAt
                  ? "defeat"
                  : "retreat"
                : before.place !== after.place
                  ? after.place === "ruins" || after.place === "vault"
                    ? "arrival"
                    : "retreat"
                  : !before.prepared && after.prepared
                    ? "prepare"
                    : "claim";
  return {
    kind,
    label,
    pearl:
      after.domain === "conclave" &&
      after.depth > 0 &&
      ["return", "attune"].includes(kind),
    seal:
      after.domain === "sea" &&
      after.seal &&
      ["return", "attune", "claim"].includes(kind),
    book:
      (after.domain === "sea" ? after.manual : after.depth === 2) &&
      ["return", "method", "claim"].includes(kind),
  };
}

/** Only show the current room's guardian. A cleared room cannot respawn a visual foe. */
export function goldenGuardian(s: State, domain: GoldenDomain) {
  if (s.status !== "alive" || s.pending || goldenCombat(s, domain)) return null;
  if (
    domain === "sea" &&
    s.outerSea.location === "ruins" &&
    s.outerSea.cleared < 2
  )
    return { name: seaFoe(s.outerSea.cleared + 1).name, array: false };
  if (
    domain === "conclave" &&
    s.conclave.location === "vault" &&
    s.conclave.depth < 2
  )
    return { name: conclaveFoe(s).name, array: s.conclave.depth === 1 };
  return null;
}
