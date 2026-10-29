// Vite-only visual fixture: actual components, no saves, no commands, no game progression.
import { createApp, h } from "vue";
import PracticeStage from "../src/PracticeStage.vue";
import BattleStage from "../src/expedition/BattleStage.vue";
import ItemArt from "../src/presentation/ItemArt.vue";
import CharacterSprite from "../src/presentation/CharacterSprite.vue";
import { freshExpedition } from "../src/expedition/rules";
const style = document.createElement("style");
style.textContent =
  "body{background:#132a25;color:#f1e6c7;font:16px/1.6 system-ui;padding:20px;margin:auto;max-width:1000px}section{margin-bottom:20px}.items{display:flex;flex-wrap:wrap;gap:20px}.item{text-align:center}.npc{height:240px;width:150px;display:inline-block}";
document.head.append(style);
createApp({
  render: () =>
    h("main", [
      h("h1", "美术场景验收"),
      h("p", "使用真实游戏组件；此页不读写存档。"),
      ...(["male", "female"] as const).flatMap((gender) => [
        h("h2", gender === "female" ? "女修" : "男修"),
        h(PracticeStage, { activity: "cultivate", playing: false, gender }),
        ...(["劫药客", "蚀阵傀儡"] as const).map((foe) =>
          h("section", [
            h(BattleStage, {
              quest: {
                ...freshExpedition(),
                effect: "strike",
                duel: { hp: 38, enemy: 20, turn: 1 },
              },
              foe,
              gender,
              playerMax: 50,
              enemyMax: 64,
            }),
          ]),
        ),
      ]),
      h("h2", "配角"),
      h(
        "section",
        (
          [
            "luchi",
            "yuqing",
            "qingzhang",
            "gongyan",
            "peizhufeng",
            "qiuxingluo",
          ] as const
        ).map((character) =>
          h("div", { class: "npc" }, [
            h(CharacterSprite, { character, label: character }),
          ]),
        ),
      ),
      h("h2", "道具"),
      h(
        "section",
        { class: "items" },
        [
          "stones",
          "herbs",
          "pills",
          "healing",
          "clarity",
          "sword",
          "vial",
          "spring",
          "blade",
          "breath",
          "herb",
          "guard",
          "lantern",
          "map",
          "tag",
          "letter",
          "lamp",
        ].map((id) =>
          h("div", { class: "item" }, [
            h(ItemArt, { id, size: 96 }),
            h("p", id),
          ]),
        ),
      ),
    ]),
}).mount("#art-preview");
