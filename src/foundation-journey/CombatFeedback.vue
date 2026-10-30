<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import type { State } from "../world";
import type { CombatFeedback } from "./feedback";
import { foundationPower } from "./combat";
import { challenges } from "./content";
const props = defineProps<{
  game: State;
  result?: CombatFeedback | null;
  initialPlayback?: boolean;
}>();
const result = computed(() => props.result);
const animate = ref(false);
const serial = ref(0);
const settled = ref(true);
let frame: ReturnType<typeof setTimeout> | undefined;
let finish: ReturnType<typeof setTimeout> | undefined;
function clear() {
  clearTimeout(frame);
  clearTimeout(finish);
}
watch(
  result,
  (r, previous) => {
    clear();
    serial.value++;
    animate.value = false;
    settled.value = true;
    if (
      !r ||
      (previous === undefined && !props.initialPlayback) ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    settled.value = false;
    animate.value = true;
    frame = setTimeout(() => {
      settled.value = true;
    }, 20);
    finish = setTimeout(() => {
      animate.value = false;
    }, 500);
  },
  { immediate: true },
);
onUnmounted(clear);
const rows = computed(() => {
  const d = props.game.foundationJourney.duel;
  const r = result.value;
  if (!d && !r) return [];
  return [
    {
      id: "enemy",
      name: r?.foe ?? challenges[d!.id].foe,
      max: r?.enemy.max ?? challenges[d!.id].hp,
      value: r ? (settled.value ? r.enemy.after : r.enemy.before) : d!.enemy,
      actual: r?.enemy.after ?? d!.enemy,
      loss: r?.damage ?? 0,
      heal: 0,
    },
    {
      id: "player",
      name: "你的气势",
      max: r?.player.max ?? foundationPower(props.game).hp,
      value: r ? (settled.value ? r.player.after : r.player.before) : d!.hp,
      actual: r?.player.after ?? d!.hp,
      loss: r?.incoming ?? 0,
      heal: r?.healing ?? 0,
    },
  ];
});
</script>
<template>
  <section v-if="rows.length" class="combat-feedback" aria-label="交锋气势变化">
    <div v-for="row in rows" :key="row.id" class="combat-meter">
      <div class="combat-meter-label">
        <span>{{ row.name }}</span
        ><strong>{{ row.actual }} / {{ row.max }}</strong>
      </div>
      <div
        class="combat-track"
        role="progressbar"
        :aria-label="row.name"
        :aria-valuenow="row.actual"
        :aria-valuemin="0"
        :aria-valuemax="row.max"
      >
        <div
          class="combat-fill"
          :class="row.id"
          :style="{
            width:
              Math.max(0, Math.min(100, (row.value / row.max) * 100)) + '%',
          }"
        />
      </div>
      <div v-if="animate" :key="serial" class="combat-float" aria-hidden="true">
        <span v-if="row.loss">−{{ row.loss }}</span
        ><span v-if="row.heal" class="combat-heal">+{{ row.heal }}</span>
      </div>
    </div>
    <div
      v-if="result"
      class="combat-summary"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      第 {{ result.turn }} 合 · 伤敌 {{ result.damage }} · 承伤
      {{ result.incoming
      }}<template v-if="result.healing">
        · 回气 {{ result.healing }} · 耗草 {{ result.herbs }}</template
      >
      <strong v-if="result.outcome === 'win'"> · 获胜，未受反击</strong
      ><strong v-else-if="result.outcome === 'loss'"> · 本场败退</strong>
      <div class="combat-effects">
        <span v-for="effect in result.effects" :key="effect">{{ effect }}</span>
      </div>
    </div>
  </section>
</template>
<style scoped>
.combat-feedback {
  padding: 12px;
  margin: 12px 0;
  border: 1px solid #877952;
  border-radius: 10px;
  background: #202b2a;
  color: #fff7dc;
}
.combat-meter {
  position: relative;
  margin-bottom: 6px;
  padding-bottom: 22px;
}
.combat-meter-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}
.combat-track {
  height: 9px;
  margin-top: 6px;
  background: #111918;
  border-radius: 5px;
  overflow: hidden;
}
.combat-fill {
  height: 100%;
  background: #e3a27e;
  transition: width 400ms ease-out;
}
.combat-fill.player {
  background: #8dd6ba;
}
.combat-float {
  position: absolute;
  right: 12px;
  top: 33px;
  display: flex;
  gap: 12px;
  font-size: 19px;
  font-weight: 800;
  color: #ffd4bf;
  text-shadow: 0 1px 3px #000;
  pointer-events: none;
  animation: combat-rise 500ms ease-out both;
}
.combat-heal {
  color: #b8ffda;
}
.combat-summary {
  font-size: 14px;
  line-height: 1.6;
}
.combat-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.combat-effects span {
  font-size: 12px;
  color: #fff0b6;
}
@keyframes combat-rise {
  from {
    transform: translateY(5px);
    opacity: 1;
  }
  to {
    transform: translateY(-3px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .combat-fill {
    transition: none;
  }
  .combat-float {
    display: none;
    animation: none;
  }
}
</style>
