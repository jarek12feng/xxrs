// Dev-only visual fixture. Uses production modules; no game saves or domain commands.
import { createApp, h, ref } from "vue";
import CombatField from "../../src/scene2d/combat/CombatField.vue";
import WalkingActor from "../../src/scene2d/WalkingActor.vue";
import { useSceneApproach } from "../../src/scene2d/use-scene-approach";
import type { CombatSnapshot } from "../../src/scene2d/combat/sequence";
createApp({
  setup() {
    const ready = ref(false),
      mode = ref("walk"),
      arrived = ref(false);
    const motion = useSceneApproach({
      initial: { x: 75, y: 85 },
      animated: () => ready.value,
    });
    const snapshot = ref<CombatSnapshot>({
      id: "fixture",
      turn: 0,
      player: 100,
      enemy: 100,
      enemyName: "演示对手",
      enemyImage: "/art/characters/raider.webp",
      effect: "none",
    });
    const button = (text: string, run: () => void) =>
      h("button", { onClick: run, style: "margin:8px;padding:12px" }, text);
    return () =>
      h("main", [
        h(
          "p",
          { style: "margin:16px" },
          "隔离表现验收 · 使用正式 WalkingActor / CombatField；下列战报为固定演示数据，不结算游戏，不写存档。",
        ),
        button("走近左侧人物", () => {
          mode.value = "walk";
          arrived.value = false;
          motion.walkTo(
            { x: 40, y: 85 },
            () => {
              arrived.value = true;
            },
            50,
          );
        }),
        button("略过走近", motion.skip),
        button("停步", motion.cancel),
        button("播放出剑战报", () => {
          motion.cancel();
          mode.value = "combat";
          snapshot.value = {
            ...snapshot.value,
            turn: snapshot.value.turn + 1,
            player: snapshot.value.player - 3,
            enemy: snapshot.value.enemy - 8,
            effect: "strike",
          };
        }),
        button("播放守势战报", () => {
          motion.cancel();
          mode.value = "combat";
          snapshot.value = {
            ...snapshot.value,
            turn: snapshot.value.turn + 1,
            player: snapshot.value.player - 2,
            enemy: snapshot.value.enemy - 1,
            effect: "guard",
          };
        }),
        h(
          "p",
          { style: "margin:16px" },
          mode.value === "walk"
            ? `位置 ${motion.position.value.x.toFixed(1)} · 面向 ${motion.facing.value} · ${arrived.value ? "已抵达" : "待抵达"}`
            : `固定战报回合 ${snapshot.value.turn}`,
        ),
        h(
          "section",
          {
            style:
              "position:relative;height:520px;background:center/cover url(/art/scene2d/ferry.png)",
          },
          [h("div", {style: {display: mode.value === "walk" ? "contents" : "none"}}, [
                h("img", {
                  src: "/art/characters/luchi.webp",
                  alt: "目标人物",
                  style:
                    "position:absolute;left:48%;bottom:15%;height:260px;transform:scaleX(-1)",
                }),
                h(WalkingActor, {
                  character: "hero-male-qi",
                  label: "演示主角",
                  position: motion.position.value,
                  moving: motion.moving.value,
                  frame: motion.frame.value,
                  facing: motion.facing.value,
                  onReady: (value: boolean) => {
                    ready.value = value;
                  },
                }),
              ]), h("div", {style: {display: mode.value === "combat" ? "contents" : "none"}}, [
                h(CombatField, {
                  snapshot: snapshot.value,
                  hero: "hero-male-qi",
                  heroName: "演示主角",
                }),
              ])],
        ),
      ]);
  },
}).mount("#app");
