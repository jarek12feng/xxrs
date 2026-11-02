export interface SecretPact {
  stage: "none" | "declined" | "promised" | "inside" | "betrayed" | "resolved";
  preparation: "none" | "anchor" | "light";
  aggressor: "none" | "rival" | "player";
  outcome:
    "none" | "exchange" | "yield" | "won" | "seized" | "retreated" | "left";
  manual: boolean;
  settled: boolean;
  supplies: boolean;
  promisedMonth: number | null;
  last: string;
}
export const freshSecretPact = (): SecretPact => ({
  stage: "none",
  preparation: "none",
  aggressor: "none",
  outcome: "none",
  manual: false,
  settled: false,
  supplies: false,
  promisedMonth: null,
  last: "",
});
export function validSecretPact(
  p: SecretPact,
  month: number,
  realm: number,
  won: readonly string[],
  duel: string | undefined,
) {
  if (
    !Array.isArray(won) ||
    !p ||
    ![
      "none",
      "declined",
      "promised",
      "inside",
      "betrayed",
      "resolved",
    ].includes(p.stage) ||
    !["none", "anchor", "light"].includes(p.preparation) ||
    !["none", "rival", "player"].includes(p.aggressor) ||
    ![
      "none",
      "exchange",
      "yield",
      "won",
      "seized",
      "retreated",
      "left",
    ].includes(p.outcome) ||
    typeof p.manual !== "boolean" ||
    typeof p.settled !== "boolean" ||
    typeof p.supplies !== "boolean" ||
    typeof p.last !== "string" ||
    p.last.length > 2000
  )
    return false;
  if (p.stage !== "none" && realm < 1) return false;
  const entered = ["inside", "betrayed", "resolved"].includes(p.stage);
  if (
    p.promisedMonth !== null &&
    (!Number.isSafeInteger(p.promisedMonth) ||
      p.promisedMonth < 0 ||
      p.promisedMonth > month)
  )
    return false;
  if (
    ["none", "declined"].includes(p.stage)
      ? p.promisedMonth !== null
      : p.promisedMonth === null || realm < 1
  )
    return false;
  if (
    entered !== (p.preparation !== "none") ||
    (entered && !won.includes("frontier"))
  )
    return false;
  if ((p.stage === "resolved") !== (p.outcome !== "none")) return false;
  if (p.stage === "betrayed" && p.aggressor === "none") return false;
  if (
    ["none", "declined", "promised", "inside"].includes(p.stage) &&
    p.aggressor !== "none"
  )
    return false;
  if (
    ["exchange", "yield", "left"].includes(p.outcome) &&
    p.aggressor !== "none"
  )
    return false;
  if (
    ["won", "seized", "retreated"].includes(p.outcome) &&
    p.aggressor === "none"
  )
    return false;
  if (
    (p.outcome === "won" && p.aggressor !== "rival") ||
    (p.outcome === "seized" && p.aggressor !== "player")
  )
    return false;
  if (won.includes("pactRival") !== ["won", "seized"].includes(p.outcome))
    return false;
  const earned = ["exchange", "won", "seized"].includes(p.outcome);
  if (p.manual !== earned) return false;
  if (p.settled && !["won", "seized", "retreated"].includes(p.outcome))
    return false;
  if (p.supplies && !["exchange", "yield"].includes(p.outcome)) return false;
  if (
    duel === "pactRival" &&
    !(p.stage === "betrayed" || (p.outcome === "retreated" && !p.settled))
  )
    return false;
  return true;
}
