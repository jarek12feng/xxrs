import { createApp, h, shallowRef } from "vue";
import { dispatch, migrateSave, validState, type Intent } from "../../src/core";
import { estateRevisitCheckpoint } from "../../tools/world-revisits-checkpoint";
import FoundationPanel from "../../src/foundation-journey/FoundationPanel.vue";
import "../../src/style.css";
import "../../src/scene.css";
import "../../src/immersive.css";
import "../../src/readability.css";
const key = "xxrs-estate-life-isolated";
const saved = sessionStorage.getItem(key),
  payload = saved ? JSON.parse(saved) : null;
let initial = estateRevisitCheckpoint();
while (initial.herbs < 12)
  initial = dispatch(initial, {
    type: "supplies",
    id: `estate-preview-supply-${initial.herbs}`,
  });
const game = shallowRef(payload ? migrateSave(payload.state) : initial);
let serial = payload?.serial ?? 0;
function act(intent: Intent) {
  const next = dispatch(game.value, {
    ...intent,
    id: `estate-preview-${++serial}`,
  });
  if (!validState(next)) throw Error("Invalid estate preview state");
  sessionStorage.setItem(key, JSON.stringify({ state: next, serial }));
  game.value = next;
}
createApp({
  render: () =>
    h("main", [
      h(
        "div",
        {
          style:
            "position:fixed;top:0;left:0;z-index:500;background:#132a22;color:#fff;padding:5px;pointer-events:none",
        },
        `隔离验收 · 第${game.value.month}月 · 灵草${game.value.herbs} · 灵石${game.value.stones}`,
      ),
      h(FoundationPanel, { game: game.value, busy: false, onAct: act }),
    ]),
}).mount("#app");
