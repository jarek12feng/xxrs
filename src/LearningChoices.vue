<script setup lang="ts">
import { techniques, relics, type State, type Intent } from "./core";
import { learningBlocked } from "./learning";
defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
</script>
<template>
  <section
    v-if="game.adventure.step === 'done' && !game.journey.learning.book"
    class="learning-choices"
    aria-label="挑选入门功法"
  >
    <h3>药工的谢礼 · 选一册入门功法</h3>
    <p>选后到功法页装配主修，以后可再学其他功法，也可更换主修。</p>
    <button
      v-for="t in ['spring', 'blade', 'breath'] as const"
      :key="t"
      :disabled="busy || learningBlocked(game)"
      @click="emit('act', { type: 'learning', choice: t })"
    >
      {{ techniques[t].name
      }}<small
        >{{ techniques[t].hint
        }}{{
          game.journey.known.includes(t) ? "；已学此书，折为灵石 20" : ""
        }}</small
      >
    </button>
  </section>
  <section
    v-if="game.expedition.cleared >= 1 && !game.journey.learning.relic"
    class="learning-choices"
    aria-label="挑选护送谢礼"
  >
    <h3>药队的谢礼 · 选一件法器</h3>
    <button
      v-for="r in ['sword', 'vial'] as const"
      :key="r"
      :disabled="busy || learningBlocked(game)"
      @click="emit('act', { type: 'learning', choice: r })"
    >
      {{ relics[r].name
      }}<small
        >{{ relics[r].hint
        }}{{ game.journey.relics[r] ? "；已有此物，折为灵石 12" : "" }}</small
      >
    </button>
  </section>
</template>

<style scoped>
.learning-choices {
  position: relative;
  margin: 16px 0;
  padding: 18px;
  background: #142b24;
  color: #f3ecda;
  border: 1px solid #a99667;
  border-radius: 8px;
  line-height: 1.7;
}
.learning-choices h3 {
  margin: 0 0 8px;
  color: #f0d7a4;
  font-size: 17px;
}
.learning-choices p {
  margin: 0 0 12px;
}
.learning-choices button {
  display: block;
  width: 100%;
  min-height: 48px;
  margin-top: 10px;
  padding: 12px;
  white-space: normal;
  text-align: left;
  background: #233d32;
  color: #fff5dc;
  border: 1px solid #a99667;
  border-radius: 6px;
  font-size: 16px;
  line-height: 1.6;
}
.learning-choices small {
  display: block;
  margin-top: 5px;
  color: #e3dbc6;
  font-size: 13px;
}
</style>
