<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../core";
import { characterArt, heroArt, heroBattlePose } from "../presentation/art";
import TribulationWorld from "../scene2d/tribulation/TribulationWorld.vue";
import type { TribulationPresentation } from "../scene2d/tribulation/presentation";
import { thunderSignal, thunderWaves } from "./thunder";
const props = defineProps<{ game: State }>();
const emit = defineEmits<{ performing: [value: boolean] }>();
const colors = ["#a6ecff", "#c4a9ff", "#ffe3a0"];
const scene = computed<TribulationPresentation>(() => {
  const n = props.game.nascentSoul.thunder,
    b = n.battle,
    r = n.last,
    id = heroArt(props.game.social.gender, props.game.realm);
  return {
    hero: characterArt(id),
    cleared: n.cleared,
    victoryTitle: "劫云散尽 · 元婴初成",
    victoryText: "你亲手渡过了三重天劫。",
    assets: {
      strike: "/art/nascent-tribulation/lightning-strike-v1.webp",
      impact: "/art/nascent-tribulation/lightning-impact-v1.webp",
      ward: "/art/nascent-tribulation/tribulation-ward-v1.webp",
    },
    phase: b
      ? {
          title:
            b.kind === "practice"
              ? "引雷验法"
              : `第${b.wave + 1}重 · ${thunderWaves[b.wave]!.name}`,
          turn: b.turn + 1,
          signal: thunderSignal(b).name,
          tell: thunderSignal(b).tell,
          hp: b.hp,
          maxHp: b.maxHp,
          pressure: b.enemy,
          maxPressure: b.kind === "practice" ? 220 : thunderWaves[b.wave]!.hp,
          color: colors[b.wave]!,
        }
      : null,
    result: r
      ? {
          serial: r.serial,
          label: { guard: "护体承雷", strike: "迎雷破脉", discern: "辨势引流" }[
            r.move
          ],
          damage: r.damage,
          incoming: r.incoming,
          ward: r.move !== "strike",
          hero: characterArt(
            id,
            heroBattlePose(r.outcome === "loss" ? "loss" : r.move),
          ),
          color: colors[r.wave]!,
        }
      : null,
  };
});
</script>
<template>
  <TribulationWorld :scene="scene" @performing="emit('performing', $event)" />
</template>
