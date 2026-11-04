import { ascensionChance, type Ascension } from "../ascension/state";
export interface FoundationBreakthroughContext {
  ascension?: Ascension | null;
  foundation: number;
  mastery: number;
  injury: number;
  story: { luchi: string; trust: number };
}
export function breakthroughSuccess(s: { limit: number }) {
  return { realm: 1 as const, qi: 0, limit: s.limit + 100 * 12 };
}
export function breakthroughDetails(
  s: FoundationBreakthroughContext,
  pill = false,
) {
  const parts = [
    { label: "炼气基础", value: 45 },
    { label: "根基", value: s.foundation },
    { label: "剑意", value: Math.floor(s.mastery / 2) },
    {
      label: "陆迟护法",
      value:
        s.story.luchi === "foundation" ? (s.story.trust >= 4 ? 15 : 10) : 0,
    },
    { label: "伤势", value: -s.injury * 5 },
    { label: "筑基丹", value: pill ? 20 : 0 },
  ];
  return {
    parts,
    chance: ascensionChance(s.ascension) ?? Math.max(
      10,
      Math.min(
        95,
        parts.reduce((n, p) => n + p.value, 0),
      ),
    ),
  };
}

export function foundationFailure(s: {
  qi: number;
  ward: boolean;
  injury: number;
  limit: number;
}) {
  return {
    qi: Math.floor((s.qi * (s.ward ? 9 : 7)) / 10),
    ward: false,
    injury: Math.min(6, s.injury + 2),
    limit: s.limit - (s.ward ? 0 : 12),
  };
}
export function goldenSuccess(s: { limit: number }) {
  return {
    realm: 2 as const,
    limit: s.limit + 300 * 12,
    cultivationRemainder: 0,
  };
}
export interface GoldenBreakthroughContext {
  ascension?: Ascension | null;
  injury: number;
  foundation: number;
  journey: { main: string | null };
  growth: { training: Record<string, number> };
  goldenCore: {
    site: string;
    guard: boolean;
    attempts: number;
    champion: string;
    pills: number;
  };
  foundationJourney: {
    cultivation: number;
    epilogue: boolean;
    condensation: boolean;
    won: readonly string[];
  };
}
export function goldenBreakthroughError(s: GoldenBreakthroughContext) {
  const g = s.goldenCore,
    q = s.foundationJourney;
  return g.champion === "pending"
    ? "先选取已获得的魁首培养，再行凝丹"
    : q.cultivation !== 600 ||
        !q.epilogue ||
        !q.condensation ||
        !q.won.includes("culmination")
      ? "先完成稳脉、贯流与长风归流，修至圆满并归山"
      : !g.pills
        ? "每次叩关需一枚凝丹丹药；可由大比或药圃取得主药后炼制"
        : g.site === "none"
          ? "先租用、修复或领取一处凝丹灵地"
          : s.injury
            ? "先静养至伤势归零，再行凝丹"
            : "";
}
export function goldenChance(s: GoldenBreakthroughContext) {
  return ascensionChance(s.ascension) ?? Math.min(
    100,
    55 +
      Math.floor(s.foundation / 2) +
      (s.journey.main ? s.growth.training[s.journey.main] * 4 : 0) +
      (s.goldenCore.site === "none"
        ? 0
        : s.goldenCore.site === "repaired"
          ? 8
          : 12) +
      (s.goldenCore.guard ? 15 : 0) +
      Math.min(10, s.goldenCore.attempts * 5),
  );
}
