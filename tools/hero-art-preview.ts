// Read-only component fixture. Never accesses the user's saves.
import { createApp, h, ref } from "vue";
import PracticeStage from "../src/PracticeStage.vue";
import BattleStage from "../src/expedition/BattleStage.vue";
import CharacterSprite from "../src/presentation/CharacterSprite.vue";
import { heroArt } from "../src/presentation/art";
import { freshExpedition } from "../src/expedition/rules";
import QiJourneyPanel from "../src/qi-journey/QiJourneyPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { createGame } from "../src/core";
const qiGame = createGame("形象验收", "wood", 42);
qiGame.qiJourney.node = 1;
qiGame.qiJourney.route = "sword";
qiGame.qiJourney.duel = { hp: 30, enemy: 40, turn: 1, effect: "guard" };
const foundationGame = createGame("形象验收", "wood", 42);
foundationGame.realm = 1;
foundationGame.foundationJourney.duel = {
  ruleset: 2,
  id: "culmination",
  hp: 30,
  enemy: 100,
  turn: 1,
  effect: "discern",
  aid: false,
};
const style = document.createElement("style");
style.textContent =
  "body{margin:0;padding:16px;background:#172d29;color:#f3e6ca;font:16px/1.5 system-ui}main{max-width:1000px;margin:auto}.poses{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.pose{height:260px;background:#ddd6c1;border-radius:8px;padding:8px}.pose:nth-child(even){background:#203a35}.pose .character-sprite{height:230px}.pose p{margin:0;color:#fff;text-shadow:0 1px 3px #000}button{padding:12px;margin:8px;font:inherit}@media(max-width:550px){.poses{grid-template-columns:repeat(2,minmax(0,1fr))}.pose{height:220px}.pose .character-sprite{height:190px}}";
document.head.append(style);
createApp({
  setup() {
    const realm = ref(0);
    return () =>
      h("main", [
        h("h1", "男主 · 两境五姿态"),
        h(
          "button",
          { onClick: () => (realm.value = realm.value ? 0 : 1) },
          realm.value ? "筑基衣装 · 切换炼气" : "炼气衣装 · 切换筑基",
        ),
        h(
          "div",
          { class: "poses" },
          (["idle", "meditate", "attack", "guard", "hurt"] as const).map(
            (pose, i) =>
              h("div", { class: "pose" }, [
                h(CharacterSprite, {
                  character: heroArt("male", realm.value),
                  pose,
                  label: pose,
                }),
                h("p", ["站立", "打坐", "出剑", "护身 / 施术", "受击"][i]),
              ]),
          ),
        ),
        h("h2", "洞府修行"),
        h(PracticeStage, {
          gender: "male",
          realm: realm.value,
          activity: "cultivate",
          playing: false,
        }),
        ...(["strike", "guard", "discern", "hurt"] as const).map((effect) =>
          h("section", [
            h("h2", effect),
            h(BattleStage, {
              gender: "male",
              realm: realm.value,
              quest: {
                ...freshExpedition(),
                effect,
                duel: { hp: 38, enemy: 20, turn: 1 },
              },
              foe: "蚀阵傀儡",
            }),
          ]),
        ),
        h("section", { id: "qi-check" }, [
          h(QiJourneyPanel, { game: qiGame, busy: false }),
        ]),
        h("section", { id: "foundation-check" }, [
          h(FoundationPanel, { game: foundationGame, busy: false }),
        ]),
      ]);
  },
}).mount("#hero-preview");
