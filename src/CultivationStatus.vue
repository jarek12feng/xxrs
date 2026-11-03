<script setup lang="ts">
import {goldenCap} from "./conclave/state";
import {realmStageLabel} from "./cultivation";
import { foundationCap } from "./foundation-journey/growth-state";
import { computed } from "vue";
import type { State } from "./core";
import { cultivationStageIndex, minorStageNames } from "./cultivation";
const props = defineProps<{ game: State }>();
const progress = computed(() => {
  const s = props.game;
  const stage = cultivationStageIndex(s);
  const cap = s.realm === 1 ? 600 : 360;
  const current = s.realm === 1 ? s.foundationJourney.cultivation : s.qi;
  const target = Math.min(cap, (stage + 1) * (s.realm === 1 ? 200 : 120));
  return {
    current,
    cap,
    remaining: Math.max(0, target - current),
    blocked:
      s.realm === 1
        ? current >= foundationCap(s) && current < 600
        : s.qiJourney.gates < 2 &&
          current >= (s.qiJourney.gates === 0 ? 239 : 359),
    next: minorStageNames[Math.min(3, stage + 1)],
  };
});
</script>
<template>
  <small class="cultivation-status" aria-label="当前修为">
    <span v-if="game.realm === 2"
      >{{realmStageLabel(game)}} · 修为 {{ game.outerSea.cultivation }} / {{goldenCap(game)}} ·
      {{ game.outerSea.cultivation >= goldenCap(game) ? "瓶颈待破" : "积累丹元" }}</span
    >
    <template v-else>
      <span>修为 {{ progress.current }} / {{ progress.cap }}</span>
      <span v-if="progress.blocked"> · 瓶颈待破</span>
      <span v-else-if="progress.remaining">
        · 距{{ progress.next }} {{ progress.remaining }}</span
      >
      <span v-else>
        · {{ game.realm === 1 ? "本境圆满" : "圆满，待叩关" }}</span
      >
    </template>
  </small>
</template>
<style scoped>
.cultivation-status {
  display: block;
  font-variant-numeric: tabular-nums;
}
</style>
