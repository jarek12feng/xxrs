export interface SecretPact {
  trial: "none" | "crossing" | "division" | "escape" | "stabilize" | "complete";
  hazard: { hp: number; progress: number; turn: number } | null;
  site: "away" | "zhaoxuan" | "brokenStele";
  pursuit: "none" | "pending" | "notified" | "closed";
  pursuitPrepared: boolean;
  story: {
    identity: "none" | "accept" | "decline";
    scale: boolean;
    news: "none" | "estate" | "snow" | "frontier";
    letter: "none" | "reply" | "keep";
  };

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
  trial: "none",
  hazard: null,
  site: "away",
  pursuit: "none",
  pursuitPrepared: false,
  story: { identity: "none", scale: false, news: "none", letter: "none" },
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
  legacy = false,
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
  if (!legacy && (!validPactRevision(p) || (p.hazard && duel))) return false;
  if (!legacy && realm < 1 && (p.site !== "away" || p.story.identity !== "none" || p.story.scale || p.story.news !== "none" || p.story.letter !== "none")) return false;
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
    (legacy && entered && !won.includes("frontier"))
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

export const pactTrialComplete = (p: SecretPact | undefined) =>
  p?.trial === "complete";
export const pactActivity = (p: SecretPact | undefined) =>
  !!p && p.site !== "away" && (p.trial === "division" || p.hazard !== null);
/** Migration only: no retroactive experience, treasure or completed trial. */
export function upgradeSecretPact(p: SecretPact): SecretPact {
  const fresh = freshSecretPact();
  const trial = p.trial ?? (p.stage === "inside" ? "crossing" : p.stage === "betrayed" ? "division" : p.stage === "resolved" ? p.manual ? "stabilize" : "escape" : "none");
  return { ...fresh, ...p, trial, story: { ...fresh.story, ...p.story } };
}
function validPactRevision(p: SecretPact) {
  if (
    ![
      "none",
      "crossing",
      "division",
      "escape",
      "stabilize",
      "complete",
    ].includes(p.trial) ||
    !["away", "zhaoxuan", "brokenStele"].includes(p.site) ||
    !["none", "pending", "notified", "closed"].includes(p.pursuit) ||
    typeof p.pursuitPrepared !== "boolean" ||
    !p.story ||
    !["none", "accept", "decline"].includes(p.story.identity) ||
    typeof p.story.scale !== "boolean" ||
    !["none", "estate", "snow", "frontier"].includes(p.story.news) ||
    !["none", "reply", "keep"].includes(p.story.letter)
  )
    return false;
  if (p.trial === "crossing" && p.stage !== "inside") return false;
  if (p.pursuitPrepared && p.pursuit === "none") return false;
  if (p.trial === "complete" && p.stage !== "resolved") return false;
  if (p.trial === "division" && p.stage !== "inside" && p.stage !== "betrayed")
    return false;
  if (["escape", "stabilize"].includes(p.trial) && p.stage !== "resolved")
    return false;
  if (p.pursuit !== "none" && p.aggressor === "none") return false;
  if (p.pursuit === "closed" && !p.settled) return false;
  if (p.settled && ["pending", "notified"].includes(p.pursuit)) return false;
  if (p.hazard !== null) {
    const h = p.hazard;
    if (
      !h ||
      !Number.isSafeInteger(h.hp) ||
      h.hp < 1 ||
      h.hp > 100 ||
      !Number.isSafeInteger(h.progress) ||
      h.progress < 0 ||
      h.progress > 2 ||
      !Number.isSafeInteger(h.turn) ||
      h.turn < 0 ||
      h.turn > 5 ||
      !(
        (p.site === "zhaoxuan" &&
          ["crossing", "escape", "stabilize"].includes(p.trial)) ||
        (p.site === "brokenStele" && p.pursuit === "notified")
      )
    )
      return false;
  }
  return true;
}
