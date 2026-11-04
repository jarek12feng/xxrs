import { nascentActive } from "./nascent-soul/rules";
import { qiNarrativeActive, qiNarrativeBattle } from "./qi-journey/narrative";
import { pactActivity } from "./secret-pact/state";
import type { State } from "./core";
export type EncounterOwner =
  "lizhao" | "nascent" | "qi" | "road" | "foundation" | "contest" | "golden" | "sea" | "conclave";
/** Read-only ownership shared by navigation and feedback. Not command authorization. */
export function combatOwner(s: State): EncounterOwner | "arena" | null {
  if (s.spirit?.trial) return s.spirit.trial.source === "well" ? "foundation" : "sea";
  if (nascentActive(s)) return "nascent";
  if (s.lizhao.duel) return "lizhao";
  if (qiNarrativeBattle(s)) return "qi";
  if (s.secretPact.hazard) return "foundation";
  if (s.conclave.duel) return "conclave";
  if (s.outerSea.duel) return "sea";
  if (s.goldenCore.duel) return "golden";
  if (s.sectContest.duel) return "contest";
  if (s.foundationJourney.duel) return "foundation";
  if (s.qiJourney.duel) return "qi";
  if (s.expedition.duel) return "road";
  if (s.social.arena.duel) return "arena";
  return null;
}
export function sceneOwner(s: State): EncounterOwner | null {
  if (s.spirit?.trial) return s.spirit.trial.source === "well" ? "foundation" : "sea";
  if (s.lizhao.location !== "away" || s.wayfaring.passage?.route.startsWith("lizhao:")) return "lizhao";
  if (nascentActive(s) || s.realm === 3) return "nascent";
  if (qiNarrativeActive(s)) return "qi";
  if (pactActivity(s.secretPact) || s.secretPact.site === "zhaoxuan" || s.secretPact.site === "brokenStele") return "foundation";
  if (s.wayfaring.trip) return "foundation";
  if (s.wayfaring.passage)
    return s.wayfaring.passage.route.startsWith("sea:") ? "sea" : "conclave";
  const combat = combatOwner(s);
  if (combat && combat !== "arena") return combat;
  if (s.realm === 2 && s.conclave.location !== "away") return "conclave";
  if (s.realm === 2 && s.outerSea.location === "ruins") return "sea";
  if (s.realm === 1 && s.sectContest.stage === "entered") return "contest";
  if (s.realm === 1 && s.goldenCore.expedition !== "idle") return "golden";
  if (s.realm === 0 && s.qiJourney.node) return "qi";
  return null;
}
/** Places where a monthly activity must wait for an explicit player response. */
export function activityInterruption(s: State): string {
  if (s.status !== "alive") return "此生已结束，可读取进度或回看履历";
  if (s.pending || s.social.scene) return "先回应眼前的事件，再继续修行";
  if (combatOwner(s)) return "当前交锋尚未结束，请先完成战斗或按现场选项撤退";
  if (s.wayfaring.trip || s.wayfaring.passage)
    return "行程尚未结束，请继续旅行或按现场选项取消";
  if (
    qiNarrativeActive(s) || pactActivity(s.secretPact) || s.qiJourney.node ||
    s.goldenCore.expedition !== "idle" ||
    s.outerSea.location === "ruins" ||
    s.conclave.location === "vault"
  )
    return "仍在探索现场，请先完成此段探索或撤回整备";
  if (s.treasures.auction?.entered && !s.treasures.auction.closed)
    return "拍卖尚未结束，请先完成竞价或离场";
  return "";
}
