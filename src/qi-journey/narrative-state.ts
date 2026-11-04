export type CaveMethod = "medicine" | "body" | "array";
export interface QiNarrative {
  motive: "unspoken" | "world" | "life" | "kin" | "quiet";
  sectBriefed: boolean;
  homeReply: "none" | "letter" | "entrust";
  location: "home" | "cave" | "branch";
  phase: "unknown" | "prepared" | "challenge" | "won" | "processed" | "applied";
  method: CaveMethod | null;
  company: "none" | "together" | "alone";
  retreatMarked: boolean;
  mixture: "none" | "separated" | "balanced";
  notes: "undecided" | "shared" | "left" | "claimed";
  pursuit:
    | "none"
    | "warned"
    | "fighting"
    | "yielded"
    | "escorted"
    | "defeated"
    | "captured"
    | "escaped";
  duel: { hp: number; enemy: number; turn: number; effect: string } | null;
  last: string;
}
export const freshQiNarrative = (): QiNarrative => ({
  motive: "unspoken",
  sectBriefed: false,
  homeReply: "none",
  location: "home",
  phase: "unknown",
  method: null,
  company: "none",
  retreatMarked: false,
  mixture: "none",
  notes: "undecided",
  pursuit: "none",
  duel: null,
  last: "",
});
export function validQiNarrative(value: unknown): value is QiNarrative {
  if (!value || typeof value !== "object") return false;
  const n = value as QiNarrative;
  if (
    !["unspoken", "world", "life", "kin", "quiet"].includes(n.motive) ||
    typeof n.sectBriefed !== "boolean" ||
    !["none", "letter", "entrust"].includes(n.homeReply) ||
    !["home", "cave", "branch"].includes(n.location) ||
    ![
      "unknown",
      "prepared",
      "challenge",
      "won",
      "processed",
      "applied",
    ].includes(n.phase) ||
    ![null, "medicine", "body", "array"].includes(n.method) ||
    !["none", "together", "alone"].includes(n.company) ||
    typeof n.retreatMarked !== "boolean" ||
    !["none", "separated", "balanced"].includes(n.mixture) ||
    !["undecided", "shared", "left", "claimed"].includes(n.notes) ||
    ![
      "none",
      "warned",
      "fighting",
      "yielded",
      "escorted",
      "defeated",
      "captured",
      "escaped",
    ].includes(n.pursuit) ||
    typeof n.last !== "string" ||
    n.last.length > 3000
  )
    return false;
  if ((n.phase === "unknown") !== (n.method === null)) return false;
  if (n.phase !== "unknown" && (!n.method || n.company === "none"))
    return false;
  if (
    ["challenge", "won", "processed", "applied"].includes(n.phase) &&
    !n.retreatMarked
  )
    return false;
  if (["processed", "applied"].includes(n.phase) !== (n.mixture !== "none"))
    return false;
  if (
    n.notes !== "undecided" &&
    !["won", "processed", "applied"].includes(n.phase)
  )
    return false;
  if ((n.notes === "claimed") !== (n.pursuit !== "none")) return false;
  if (
    n.location === "branch" &&
    !["warned", "fighting", "defeated"].includes(n.pursuit)
  )
    return false;
  if (n.phase === "challenge" && n.location !== "cave") return false;
  if (n.pursuit === "fighting" && n.location !== "branch") return false;
  if (n.duel === null)
    return n.phase !== "challenge" && n.pursuit !== "fighting";
  const d = n.duel;
  return (
    !!d &&
    (n.phase === "challenge") !== (n.pursuit === "fighting") &&
    Number.isSafeInteger(d.hp) &&
    d.hp > 0 &&
    d.hp <= 200 &&
    Number.isSafeInteger(d.enemy) &&
    d.enemy > 0 &&
    d.enemy <= 200 &&
    Number.isSafeInteger(d.turn) &&
    d.turn >= 0 &&
    d.turn < 16 &&
    ["none", "guard", "strike", "discern"].includes(d.effect)
  );
}
