import type { State } from "../world";
import { artifactReady } from "../equipment";
export type AssayPhase = "idle" | "cloudy" | "clear" | "stable";
export type AssayMove =
  "drain" | "bind" | "discard" | "herbFilter" | "sealFlow" | "divide" | "rest";
export const assayMoves: readonly AssayMove[] = [
  "drain",
  "divide",
  "rest",
  "herbFilter",
  "sealFlow",
  "bind",
  "discard",
];
export interface AssayState {
  phase: AssayPhase;
  mistakes: number;
  tide: number;
  separation: number;
  strain: number;
}
export const freshAssay = (): AssayState => ({
  phase: "idle",
  mistakes: 0,
  tide: 0,
  separation: 0,
  strain: 0,
});
export const startAssay = (): AssayState => ({
  ...freshAssay(),
  phase: "cloudy",
  tide: 2,
});
export const canCollect = (a: AssayState) =>
  a.separation === 2 && a.tide + a.strain <= 2;
/** Old saves retain their actual progress, without completing a trial or granting rewards. */
export function upgradeAssay(
  a: Pick<AssayState, "phase" | "mistakes">,
): AssayState {
  return {
    ...freshAssay(),
    phase: a.phase,
    mistakes: a.mistakes,
    tide: a.phase === "cloudy" ? 2 : 0,
    separation: a.phase === "clear" || a.phase === "stable" ? 2 : 0,
  };
}
export function validAssay(
  x: unknown,
  cleared: boolean,
  verified: boolean,
  legacy = false,
) {
  const a = x as AssayState | null;
  if (
    !a ||
    !["idle", "cloudy", "clear", "stable"].includes(a.phase) ||
    !Number.isSafeInteger(a.mistakes) ||
    a.mistakes < 0 ||
    a.mistakes > 100 ||
    (a.phase !== "idle" && !cleared) ||
    (a.phase === "stable" && !verified) ||
    (verified && a.phase !== "idle" && a.phase !== "stable")
  )
    return false;
  if (legacy) return true;
  if (
    ![a.tide, a.separation, a.strain].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= 2,
    )
  )
    return false;
  if (a.phase === "idle")
    return a.tide === 0 && a.separation === 0 && a.strain === 0;
  if (a.phase === "stable") return canCollect(a);
  return a.phase === (a.tide === 0 ? "clear" : "cloudy");
}
/** Pure transition, shared by preview and settlement. Local strain never damages the player's spirit. */
export function resolveAssay(a: AssayState, move: AssayMove) {
  let next = { ...a };
  let note = "";
  if (a.phase === "idle" || a.phase === "stable")
    return { next, note: "此炉当前无需操作。" };
  switch (move) {
    case "discard":
      next = { ...freshAssay(), mistakes: a.mistakes };
      note = "收火弃去普通试液，封存辅药未动。可重新备料。";
      break;
    case "drain":
      next.tide = 0;
      next.separation = 2;
      next.strain = Math.max(0, a.strain - 1);
      note =
        "你分槽缓炼两月，将潮沫逐层排出，药性分开。已辨出的药性保留，行炉负担也减轻一层。";
      break;
    case "divide":
      next.tide = Math.max(0, a.tide - 1);
      next.separation = 2;
      next.strain = Math.min(2, a.strain + 1);
      note =
        "你以分念诀同时追住两股药息，药性分开，潮息减弱一层；行炉负担增加一层。继续分念会加重负担，也可收念或改用缓炼。";
      break;
    case "rest":
      next.strain = 0;
      note = "你收念守住温火，行炉负担消退；已经分开的药性与剩余潮息都保留。";
      break;
    case "herbFilter":
      next.tide = 0;
      next.strain = Math.max(0, a.strain - 1);
      note =
        "四株灵草滤尽潮沫，行炉负担减轻一层；药性仍须由你分开，滤草不会代替辨性。";
      break;
    case "sealFlow":
      next.tide = 0;
      note =
        "镇潮印将潮沫压入侧槽，留下已分药性；御印只处理潮息，不替你辨性或消去行炉负担。";
      break;
    case "bind":
      if (canCollect(a)) {
        next.phase = "stable";
        note =
          "你收束已经分开的药性，余下潮息与行炉负担在可控范围内，清液凝成稳定药滴。化婴丹药理已掌握，封存辅药未动。";
      } else {
        next.strain = Math.min(2, a.strain + 1);
        next.mistakes = Math.min(100, a.mistakes + 1);
        note =
          "药液未能凝定，你及时松槽；行炉负担增加一层，已分出的药性没有丢失。可收念、排潮或借助滤草与镇潮印调整后再收药。";
      }
      break;
  }
  if (next.phase !== "stable" && next.phase !== "idle")
    next.phase = next.tide === 0 ? "clear" : "cloudy";
  return { next, note };
}
export const assayLabels: Record<AssayMove, string> = {
  drain: "分槽缓炼 · 排尽潮息并分药",
  divide: "分念辨性 · 留住两股药息",
  rest: "收念守温 · 保留药性、消退负担",
  herbFilter: "添灵草滤潮 · 耗灵草4",
  sealFlow: "御镇潮印 · 压住潮息",
  bind: "合槽收药",
  discard: "收火弃试液",
};
export function assayMethod(s: State, move: AssayMove) {
  const a = s.lizhao.assay;
  let error = "";
  if (move === "divide" && s.spirit.manual !== "learned")
    error = "须先研修分念诀，才能同时辨认两股药息";
  if (
    move === "sealFlow" &&
    (!s.treasures.artifacts.includes("tideSeal") ||
      !artifactReady(s, "tideSeal"))
  )
    error = "须先温养并装配镇潮印，才能压住潮息";
  if ((move === "sealFlow" || move === "herbFilter") && a.tide === 0)
    error ||= "清液已分，潮息已退，无须再滤潮或御印";
  if (move === "rest" && a.strain === 0)
    error ||= "行炉负担已经消退，无须空守炉火";
  const result = resolveAssay(a, move);
  return {
    months: move === "discard" ? 0 : move === "drain" ? 2 : 1,
    herbs: move === "herbFilter" ? 4 : 0,
    error,
    ...result,
  };
}
export function assayView(a: AssayState) {
  if (a.phase === "idle")
    return {
      title: "空炉待试",
      clue: "用普通灵草验证药理，使药性分离并凝定，不动封存辅药。",
    };
  if (a.phase === "stable")
    return {
      title: "药液凝定 · 药理已证",
      clue: "你已亲手稳住药性。日后炼制化婴丹，仍须主药与定性辅药各一份。",
    };
  return {
    title: a.tide ? "潮息尚存 · 药液可调" : "潮息已退 · 清液留炉",
    clue: canCollect(a)
      ? "药性已分，潮息与行炉负担合计不超过两层，可以合槽收药。也可继续调整，但会额外耗时。"
      : "收药须药性分离达到两层，且潮息与行炉负担合计不超过两层。失稳不会抹去已分药性。",
  };
}
