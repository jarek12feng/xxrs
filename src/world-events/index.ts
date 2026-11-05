import type { State } from "../world";
import { venueAuction, venueIds } from "../auction";
import type { Venue, LotItem } from "../auction/catalog";
import type { BattleId } from "../foundation-journey/state";
/** Observed facts, not a scheduler. No state changes, RNG, mail fields or inferred NPC lives. */
export type WorldFact =
  | {
      kind: "auction-result";
      id: string;
      venue: Venue;
      edition: number;
      won: { item: LotItem; paid: number }[];
    }
  | {
      kind: "sea-expedition";
      id: string;
      phase: "charted" | "outer-cleared" | "outer-reward" | "complete";
      reward: "none" | "seal" | "manual";
    }
  | { kind: "foundation-board"; id: string; wins: BattleId[]; player: string };
/** Current observable milestones only: do not reconstruct intermediate history after loading. */
export function knownWorldFacts(s: State): WorldFact[] {
  const facts: WorldFact[] = [];
  for (const venue of venueIds) {
    const a = venueAuction(s, venue);
    if (a?.entered && a.closed)
      facts.push({
        kind: "auction-result",
        id: `auction:${venue}:${a.number}:result`,
        venue,
        edition: a.number,
        won: a.lots
          .filter((l) => l.result === "won")
          .map((l) => ({ item: l.item, paid: l.paid })),
      });
  }
  const sea = s.outerSea;
  if (sea.met && sea.pact !== "none") {
    const phase =
      sea.cleared === 2
        ? "complete"
        : sea.cleared === 1
          ? sea.reward === "none"
            ? "outer-cleared"
            : "outer-reward"
          : "charted";
    facts.push({
      kind: "sea-expedition",
      id: phase === "charted" ? "sea:ruins" : `sea:ruins:${phase}`,
      phase,
      reward: sea.reward,
    });
  }
  if (s.foundationJourney.board.wins.length)
    facts.push({
      kind: "foundation-board",
      id: `arena:foundation:${s.foundationJourney.board.wins.length}`,
      wins: [...s.foundationJourney.board.wins],
      player: s.name,
    });
  return facts;
}
