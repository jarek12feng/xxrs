import { createApp, h, shallowRef } from "vue";
import QiJourneyPanel from "../src/qi-journey/QiJourneyPanel.vue";
import CultivationStatus from "../src/CultivationStatus.vue";
import { createGame, dispatch, validState, type Intent } from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import "../src/style.css";
import "../src/readability.css";
const game = shallowRef(createGame("关卡验收", "wood", 42, "insightful"));
const notice = shallowRef("");
let serial = 0;
function send(c: Intent) {
  const next = dispatch(game.value, { ...c, id: `preview${++serial}` });
  if (!validState(next)) throw Error("Invalid state");
  game.value = next;
}
function checkpoint(gate: number, routePending = false) {
  game.value = createGame("关卡验收", "wood", 42, "insightful");
  for (let i = 0; i < 400; i++) {
    const c = foundationStep(game.value);
    if (
      game.value.qiJourney.gates === gate &&
      c.type === "qiJourney" &&
      (routePending
        ? c.action.startsWith("prep:")
        : c.action.startsWith("enter:"))
    )
      return;
    send(c);
  }
  throw Error("Checkpoint unavailable");
}
checkpoint(0, true);
createApp({
  setup: () => () =>
    h("main", { style: "max-width:720px;margin:24px auto;padding:16px" }, [
      h("h1", "炼气成长关卡验收"),
      h(
        "p",
        "开发验收页：检查点由新角色逐条执行正式命令生成，不写入正式存档。",
      ),
      h("nav", [
        h("button", { onClick: () => checkpoint(0, true) }, "路线未完成"),
        h("button", { onClick: () => checkpoint(0) }, "药谷准备"),
        h("button", { onClick: () => checkpoint(1) }, "内府准备"),
        h(
          "button",
          { onClick: () => send(foundationStep(game.value)) },
          "执行下一条参考操作",
        ),
      ]),
      h(CultivationStatus, { game: game.value }),
      h(QiJourneyPanel, {
        game: game.value,
        busy: false,
        onAct: send,
        onFacilities: () =>
          (notice.value = "功法等设施请在正式入口操作；本页只验收路线与交锋。"),
        onGear: () => (notice.value = "炼器请在正式入口操作。"),
        onSect: () => (notice.value = "宗门请在正式入口操作。"),
        onInventory: () => (notice.value = "储物袋请在正式入口操作。"),
        onBoard: () => (notice.value = "榜单请在正式入口操作。"),
      }),
      h("p", { role: "status" }, notice.value),
      h("a", { href: "/" }, "返回正式游戏入口"),
    ]),
}).mount("#app");
