import type { State } from "../world";
import { cultivationProjection } from "../cultivation";
import { challenges, rankIds } from "./content";
export function journeyPreparation(s: State, board = false) {
  const q = s.foundationJourney;
  if (
    s.status !== "alive" ||
    s.realm !== 1 ||
    s.pending ||
    s.social.scene ||
    s.social.arena.duel ||
    s.expedition.duel ||
    q.duel
  )
    return null;
  const nextRank = rankIds[q.board.wins.length];
  const target = board
    ? nextRank
      ? challenges[nextRank].stage * 200
      : 0
    : q.ferry === 2
      ? challenges.exit.stage * 200
      : q.ferry >= 4
        ? q.rescue < 3
          ? 240
          : q.rescue === 3
            ? challenges.rescue.stage * 200
            : !q.condensation
              ? 600
              : 0
        : 0;
  const missing = Math.max(0, target - q.cultivation);
  const forecast = cultivationProjection(s, target);
  const months = forecast.batchMonths;
  return {
    optionalBattle: board || q.ferry === 2 || q.rescue === 3,
    target,
    missing,
    months,
    gain: forecast.batchGain,
    forecast,
    injury: s.injury,
    needsFunds: s.stones < 4,
  };
}
