<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "./core";
import { availableOrigins, originNotes } from "./companion-origins";
const props = defineProps<{ game: State; busy: boolean; journal?: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const notes = computed(() =>
  props.journal ? props.game.social.origins : availableOrigins(props.game),
);
const locked = computed(
  () =>
    props.busy ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel ||
    !!props.game.expedition.duel,
);
</script>
<template>
  <aside v-if="notes.length" class="origin-notes" aria-label="路旁见闻">
    <h4>{{ journal ? "亲眼读过的见闻" : "路旁一瞥 · 可选" }}</h4>
    <div v-for="key in notes" :key="key">
      <details v-if="game.social.origins.includes(key)">
        <summary>{{ originNotes[key].title }} · 已读</summary>
        <p>{{ originNotes[key].body }}</p>
      </details>
      <button
        v-else
        :disabled="locked"
        @click="emit('act', { type: 'readOrigin', origin: key })"
      >
        {{ originNotes[key].title }} · 看一眼
      </button>
    </div>
    <small>不耗月份或物资；可直接继续行路。</small>
  </aside>
</template>
<style scoped>
.origin-notes {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid currentColor;
  border-radius: 8px;
}
p {
  line-height: 1.8;
}
button {
  max-width: 100%;
  white-space: normal;
}
</style>
