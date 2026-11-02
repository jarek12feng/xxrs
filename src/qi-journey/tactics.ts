import type { State } from "../world";
import type { Move } from "../expedition/content";

// The same visible opening drives enemy intent, preview and settlement.
export function medicineOpening(s: State, identity: string) {
  const q = s.qiJourney;
  return !q.trial && identity === "spring-python" && q.route === "medicine" && q.duel?.effect === "guard";
}
export function qiTacticalCue(s: State, identity: string) {
  if (identity !== "spring-python" || s.qiJourney.trial) return "";
  if (medicineOpening(s, identity))
    return "护身药气引得青蟒偏头，颈下鳞缝已露。这一合可抢攻，也可趁它偏头稳住气息。";
  return s.qiJourney.route === "medicine"
    ? "行前护身药仍有余气：守住一合便能诱它偏头，下合露出鳞缝；无需另耗药引。"
    : "青蟒循水游动。可以追着鳞缝抢攻，也可辨清倒影，保留气势应对下一扑。";
}
export function qiExpectedMove(s: State, identity: string, pattern: readonly Move[]) {
  return medicineOpening(s, identity) ? "strike" : pattern[s.qiJourney.duel!.turn % pattern.length]!;
}
