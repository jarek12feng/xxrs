import type { Move } from "../expedition/content";
export type Destination =
  "home" | "ferry" | "estate" | "snow" | "inn" | "frontier";
export type BattleId =
  | "culmination"
  | "well"
  | "exit"
  | "estate"
  | "snow"
  | "frontier"
  | "rescue"
  | "rank1"
  | "rank2"
  | "rank3"
  | "rank4"
  | "rank5";
export type Side = "estate" | "snow" | "inn";
export interface FoundationJourney {
  epilogue: boolean;
  aftermath: Record<Side, boolean>;
  sharedMoment: boolean;
  cultivation: number;
  location: Destination;
  ferry: 0 | 1 | 2 | 3 | 4;
  inheritance: "none" | "spring" | "blade" | "breath";
  sister: "none" | "promised" | "reunited";
  evidence: ("paper" | "registry" | "control")[];
  consent: boolean;
  ferryOutcome: "none" | "open" | "escort" | "break";
  sides: Record<Side, { step: number; outcome: string }>;
  bond: "none" | "promised" | "covenant";
  contact: "none" | "letters" | "station";
  whereabouts: "home" | "away" | "returned" | "missing" | "shelter" | "rescued";
  departedAt: number | null;
  reunion: boolean;
  rescue: number;
  target: "none" | "party" | "companion";
  oldFriend: boolean;
  board: {
    last: string;
    wins: BattleId[];
    losses: number;
    best: Partial<Record<BattleId, number>>;
  };
  won: BattleId[];
  duel: {
    ruleset: 1 | 2;
    id: BattleId;
    hp: number;
    enemy: number;
    turn: number;
    effect: string;
    aid: boolean;
  } | null;
  aid: boolean;
  condensation: boolean;
  last: string;
}
export const freshFoundationJourney = (): FoundationJourney => ({
  epilogue: false,
  aftermath: { estate: false, snow: false, inn: false },
  sharedMoment: false,
  cultivation: 0,
  location: "home",
  ferry: 0,
  inheritance: "none",
  sister: "none",
  evidence: [],
  consent: false,
  ferryOutcome: "none",
  sides: {
    estate: { step: 0, outcome: "" },
    snow: { step: 0, outcome: "" },
    inn: { step: 0, outcome: "" },
  },
  bond: "none",
  contact: "none",
  whereabouts: "home",
  departedAt: null,
  reunion: false,
  rescue: 0,
  target: "none",
  oldFriend: false,
  board: { last: "", wins: [], losses: 0, best: {} },
  won: [],
  duel: null,
  aid: false,
  condensation: false,
  last: "",
});
export type JourneyAction =
  | { kind: "revisit"; side: Side }
  | { kind: "sharedMoment" | "epilogue" }
  | { kind: "travel"; destination: Destination }
  | { kind: "battle"; battle: BattleId }
  | { kind: "move"; move: Move }
  | { kind: "withdraw" }
  | { kind: "inherit"; technique: "spring" | "blade" | "breath" }
  | { kind: "evidence"; evidence: "paper" | "registry" | "control" }
  | { kind: "sister" | "reuniteSister" | "consent" }
  | { kind: "ferryOutcome"; outcome: "open" | "escort" | "break" }
  | { kind: "sideInvestigate"; side: Side }
  | { kind: "sideResolve"; side: Side; outcome: string }
  | { kind: "contact"; contact: "letters" | "station" }
  | {
      kind:
        | "propose"
        | "covenant"
        | "prepareTogether"
        | "depart"
        | "reunion"
        | "oldFriend"
        | "report"
        | "signal"
        | "supply"
        | "mentor"
        | "finish";
    };
