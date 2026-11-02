<script setup lang="ts">
import { computed } from "vue";
import { actionError, medicineError, type State, type Intent } from "./core";
import { growthComparison } from "./growth-feedback";
import GrowthPreview from "./GrowthPreview.vue";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const impact = computed(() =>
  growthComparison({ ...props.game, injury: 0 }, props.game),
);
</script>
<template>
  <section v-if="game.injury" class="injury-impact" aria-label="伤势影响">
    <strong>伤势 {{ game.injury }} · 与无伤时相比</strong>
    <p v-for="line in impact" :key="line">{{ line }}</p>
    <GrowthPreview :game="game" :request="{ kind: 'rest' }" compact />
    <button
      :disabled="busy || !!actionError(game, 'rest')"
      @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
    >
      静养一月 · 免费
    </button>
    <small>{{ actionError(game, "rest") }}</small>
    <GrowthPreview :game="game" :request="{ kind: 'healing' }" compact />
    <button
      :disabled="busy || !!medicineError(game, 'healing', true)"
      @click="emit('act', { type: 'consume', medicine: 'healing' })"
    >
      服回春散 · 持有 {{ game.growth.medicines.healing }}
    </button>
    <small>{{ medicineError(game, "healing", true) }}</small>
  </section>
</template>
<style scoped>
.injury-impact {
  margin: 1rem 0;
  padding: 0.8rem;
  border: 1px solid #ae886a;
  border-radius: 8px;
  text-align: left;
}
.injury-impact p {
  margin: 0.4rem 0;
}
.injury-impact small {
  display: block;
}
</style>
