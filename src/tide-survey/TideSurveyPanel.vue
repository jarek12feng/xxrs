<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../world";
import { tideKnown, tideSchedule, tideQuote } from "./index";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const schedule = computed(() => tideSchedule(props.game.month));
const choices = computed(() =>
  (["careful", "deep"] as const).map((action) => ({
    action,
    quote: tideQuote(props.game, action),
  })),
);
</script>
<template>
  <section v-if="tideKnown(game)" aria-label="潮隙侧廊" class="tide-survey">
    <h4>潮隙侧廊 · 古渡潮图</h4>
    <p>
      旧府侧廊有一段只在大退潮时露出的石道。第{{ schedule.opens }}月开放，第{{
        schedule.closes
      }}月前须返渡；错过可候下一潮期。
    </p>
    <p>
      灵石6、灵草2备行装。稳妥勘察往返3月，取灵草4；深入辨纹往返4月，有效神识24（识海创伤会降低）可取灵草6、玄铁料2，否则只取灵草2并增加伤势1。
    </p>
    <div v-for="item in choices" :key="item.action">
      <button
        :disabled="busy || !!item.quote.error"
        @click="emit('act', { type: 'tideSurvey', action: item.action })"
      >
        {{ item.action === "careful" ? "循旧绳勘察浅廊" : "深入侧廊辨潮纹" }} ·
        {{ item.quote.months }}月往返
      </button>
      <p v-if="item.quote.error">{{ item.quote.error }}</p>
    </div>
    <p v-if="game.tideSurvey.edition">
      最近探查：第{{ game.tideSurvey.edition }}次潮期，详见传讯中的行旅记录。
    </p>
  </section>
</template>
<style scoped>
.tide-survey {
  border-left: 2px solid #b7aa7c;
  padding: 4px 12px;
  margin: 12px 0;
}
button {
  min-height: 36px;
}
p {
  line-height: 1.7;
}
</style>
