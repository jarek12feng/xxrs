import { createApp, h, shallowRef } from "vue";
import WorkshopPanel from "../src/workshop/WorkshopPanel.vue";
import QiJourneyPanel from "../src/qi-journey/QiJourneyPanel.vue";
import { dispatch, validState, type Intent } from "../src/core";
import { workshopCheckpoint } from "./workshop-checkpoints";
import "../src/style.css";
import "../src/readability.css";
const kind = shallowRef<"qi" | "foundation" | "passage">("qi");
const game = shallowRef(workshopCheckpoint("qi"));
let serial = 0;
function send(c: Intent) {
  const n = dispatch(game.value, { ...c, id: `manual-${++serial}` });
  if (!validState(n)) throw Error("Invalid preview state");
  game.value = n;
}
createApp({
  setup: () => () =>
    h("main", { style: "max-width:860px;margin:20px auto;padding:16px" }, [
      h("h1", "丹药与法器准备验收"),
      h("p", "开发验收页：由新角色执行正式命令生成检查点，不读写正式存档。"),
      h(
        "nav",
        { style: "display:flex;flex-wrap:wrap;gap:8px" },
        (["qi", "foundation", "passage"] as const).map((k) =>
          h(
            "button",
            {
              onClick: () => {
                kind.value = k;
                game.value = workshopCheckpoint(k);
              },
            },
            { qi: "炼气炉房", foundation: "筑基器坊", passage: "秘境灵流" }[k],
          ),
        ),
      ),
      h(
        "p",
        { role: "status" },
        `第 ${game.value.month} 月 · ${game.value.log[0]?.text ?? ""}`,
      ),
      kind.value === "passage"
        ? h(QiJourneyPanel, { game: game.value, busy: false, onAct: send })
        : h(WorkshopPanel, {
            key: kind.value,
            game: game.value,
            busy: false,
            onAct: send,
          }),
    ]),
}).mount("#app");
