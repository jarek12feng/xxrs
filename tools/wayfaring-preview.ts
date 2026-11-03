import { createApp, h, shallowRef } from "vue";
import TravelMap from "../src/wayfaring/TravelMap.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { journeyCheckpoint } from "./foundation-journey-checkpoint";
import { dispatch, validState, type Intent } from "../src/core";
import "../src/style.css";
import "../src/scene.css";
import "../src/immersive.css";
import "../src/readability.css";
const game = shallowRef(journeyCheckpoint("male", false, "wood", "spring")),
  map = shallowRef(true);
let serial = 0;
createApp({
  setup: () => () =>
    h("main", { style: { maxWidth: "none", padding: "16px", margin: 0 } }, [
      h("small", "开发检查点 · 公开命令到筑基 · 不读写玩家存档"),
      h(
        "button",
        { onClick: () => (map.value = !map.value) },
        map.value ? "查看所在地现场" : "展开路图",
      ),
      h(map.value ? TravelMap : FoundationPanel, {
        game: game.value,
        busy: false,
        onClose: () => (map.value = false),
        onAct: (intent: Intent) => {
          const next = dispatch(game.value, {
            ...intent,
            id: `travel-preview-${++serial}`,
          });
          if (!validState(next)) throw new Error("Invalid travel checkpoint");
          game.value = next;
        },
      }),
    ]),
}).mount("#app");
