import type { State } from "../world";
import { artifactReady } from "../equipment";
export type CrossingFocus = "none" | "main" | "shore" | "wide";
export type CrossingMove =
  "main" | "shore" | "wide" | "seal" | "release" | "advance";
export interface Crossing {
  focus: CrossingFocus;
  seal: boolean;
  position: "near" | "eddy" | "shore";
}
export const freshCrossing = (): Crossing => ({
  focus: "none",
  seal: false,
  position: "near",
});
export function upgradeCrossing(
  ability: State["nascentSoul"]["ability"],
): Crossing {
  return ability === "done"
    ? { ...freshCrossing(), position: "shore" }
    : ability === "sheltered"
      ? { ...freshCrossing(), focus: "wide" }
      : freshCrossing();
}
export function validCrossing(
  x: unknown,
  ability: State["nascentSoul"]["ability"],
) {
  const c = x as Crossing | undefined;
  if (
    !c ||
    !["none", "main", "shore", "wide"].includes(c.focus) ||
    typeof c.seal !== "boolean" ||
    !["near", "eddy", "shore"].includes(c.position)
  )
    return false;
  if (ability === "done")
    return c.position === "shore" && c.focus === "none" && !c.seal;
  if (c.position === "shore") return false;
  if (ability === "none" || ability === "surveyed")
    return c.position === "near" && c.focus === "none" && !c.seal;
  return true;
}
export function crossingView(s: State) {
  const c = s.nascentSoul.crossing;
  const sealReady =
    s.treasures.artifacts.includes("tideSeal") && artifactReady(s, "tideSeal");
  const fixed = c.seal && sealReady;
  const main = c.focus === "main" || c.focus === "wide" || fixed;
  const shore = c.focus === "shore" || c.focus === "wide";
  const done = s.nascentSoul.ability === "done";
  return {
    ...c,
    sealReady,
    fixed,
    main: !done && main,
    shore: !done && shore,
    boat:
      c.position === "near"
        ? "舟队在此岸候行"
        : c.position === "eddy"
          ? "舟队停靠中段回水湾"
          : "舟队已登岸设标",
    hint: done
      ? "测杆已经立起，测绘队能在彼岸展开航图。这条通过险段的记录已留存。"
      : c.position === "eddy"
        ? "舟队停在中段回水湾，目标是平安登岸。侧岸回流仍会推开靠岸的船只；可随时收势等候。"
        : "护送测绘队平安渡过潮隙。主潮横截航道，侧岸回流冲击落脚处。",
  };
}
/** All movement is committed by the command, never by an animation or clock. */
export function crossingQuote(s: State, move: CrossingMove) {
  const v = crossingView(s),
    next = { ...s.nascentSoul.crossing };
  let error = "",
    months = 0,
    note = "";
  if (!["surveyed", "sheltered"].includes(s.nascentSoul.ability))
    error = "先勘察潮隙；已完成的护渡不必重做";
  switch (move) {
    case "main":
    case "shore":
    case "wide":
      if (next.focus === move)
        error ||= "护持已经落在此处，可观察或安排舟队行进";
      next.focus = move;
      note =
        move === "main"
          ? "你将元婴护持集中在主潮，横截航道的浪墙被压低；侧岸回流仍须另行照看。"
          : move === "shore"
            ? "护持沿彼岸铺下，回流从落脚处两侧分开，舟队有了可靠的登岸位置。"
            : "你将护持铺开，同时照住主潮与侧岸。覆盖更广，舟队需分批缓行，每段耗两月。";
      break;
    case "seal":
      if (!v.sealReady)
        error ||= "须先温养并装配镇潮印；没有此宝也可分段护持或铺开缓渡";
      if (next.seal && v.sealReady) error ||= "镇潮印已镇住主潮，无须重复布置";
      next.seal = true;
      note =
        "镇潮印悬于潮头，独自压住横浪。你可以把元婴护持转往侧岸，让主潮与登岸处同时安稳。";
      break;
    case "release":
      if (next.focus === "none" && !next.seal)
        error ||= "已经收势，舟队正在安全处等候";
      next.focus = "none";
      next.seal = false;
      note =
        next.position === "eddy"
          ? "你示意舟队系泊回水湾，收回护持与法宝。队伍、器材与已过主潮的进度保留，可重整后继续。"
          : "舟队仍系在此岸，你收回护持与法宝。准备好后可重新安排。";
      break;
    case "advance":
      if (next.position === "near" && !v.main)
        error ||= "主潮仍拦住航道；先护主潮、铺开护持，或用镇潮印固定潮头";
      if (next.position === "eddy" && !v.shore)
        error ||= "舟队已过主潮；先将护持转到侧岸，或铺开护持，才能靠岸";
      if (next.position === "near" && v.fixed && next.focus === "shore") {
        months = 2;
        next.position = "shore";
        note =
          "镇潮印守住主潮，你沿侧岸连续延展护持。舟队不必停湾等你换势，满载测杆的船只接连穿过两段水道，抵岸设标。";
      } else {
        months = next.focus === "wide" ? 2 : 1;
        next.position = next.position === "near" ? "eddy" : "shore";
        note =
          next.position === "eddy"
            ? "你护住主潮，舟队载着测杆与航图越过浪墙，在中段回水湾系泊。眼前船只已过险流，下一步须照看侧岸落脚处。"
            : "侧岸回流被你分向两边，舟队沿安稳水面靠岸。队员卸下测杆、立起路标，在新到的岸地铺开航图。";
      }
      if (next.position === "shore") {
        next.focus = "none";
        next.seal = false;
        note +=
          " 旧日只能独自择隙而渡，如今你已护住整支测绘队。彼岸路标与本次测绘记录保留。";
      }
      break;
    default:
      error ||= "未知护渡操作";
  }
  return { error, months, next, note, done: next.position === "shore" };
}
