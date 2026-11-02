import { createApp, h, shallowRef, ref } from "vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { secretPactCheckpoint } from "./secret-pact-checkpoint";
import { dispatch, validState, type Intent } from "../src/core";
import "../src/style.css";
import "../src/scene.css";
import "../src/immersive.css";
import "../src/readability.css";
const narrow = ref(false);
const game = shallowRef(secretPactCheckpoint());
let serial = 0;
createApp({
  render: () =>
    h(
      "main",
      {
        style: `max-width:${narrow.value ? 390 : 800}px;margin:auto;padding:12px`,
      },
      [
        h(
          "button",
          {
            onClick: () => {
              narrow.value = !narrow.value;
            },
          },
          "窄屏390",
        ),
        h("p", "开发验收：此页只在内存操作，不读写玩家存档。"),
        h(
          "button",
          {
            onClick: () => {
              game.value = secretPactCheckpoint(false);
            },
          },
          "初期相约",
        ),
        h(
          "button",
          {
            onClick: () => {
              game.value = secretPactCheckpoint();
            },
          },
          "中期入府",
        ),
        h(FoundationPanel, {
          game: game.value,
          busy: false,
          onAct: (intent: Intent) => {
            const next = dispatch(game.value, {
              ...intent,
              id: `pact-preview-${++serial}`,
            });
            if (!validState(next)) throw Error("Invalid pact state");
            game.value = next;
          },
        }),
      ],
    ),
}).mount("#app");
