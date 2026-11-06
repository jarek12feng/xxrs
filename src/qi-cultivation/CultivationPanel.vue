<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { cultivationQuote, type CultivationAction } from "./rules";
const props = defineProps<{
  game: State;
  busy: boolean;
  purpose?: "middle" | "pill";
}>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const action = computed<CultivationAction>(() =>
  props.purpose === "pill" ? "cultivation:herb" : "cultivation:begin",
);
const quote = computed(() => cultivationQuote(props.game, action.value));
</script>
<template>
  <section
    v-if="
      !game.realm && (purpose === 'pill' || !game.qiJourney.cultivation.middle)
    "
    class="cultivation-preparation"
  >
    <h3>
      {{ purpose === "pill" ? "玉髓芝 · 筑基主药" : "小周天 · 中期关隘" }}
    </h3>
    <p v-if="purpose === 'pill'">
      内府药图记着一处地下药脉。玉髓芝的主根可承载筑基药力，普通灵草只能作辅药。循图探采耗半年与灵石6，主根须亲自护住。
    </p>
    <p v-else>
      吐纳积下的灵息已渐渐充满丹田。贯通小周天还需掌握主修功法，并在行功时疏解脉压；强冲会伤及经脉。
    </p>
    <p v-if="purpose !== 'pill'">
      修为 {{ game.qi }}/119 · 心得 {{ game.study }}/2 · 主修研修
      {{ game.journey.main ? game.growth.training[game.journey.main] : 0 }}/1
    </p>
    <p v-else>
      玉髓芝
      {{
        game.qiJourney.cultivation.roots
      }}
      株。自炼须心得4、神识8；也可携药委托丹师，均需温养丹液六月。
    </p>
    <button
      :disabled="busy || !!quote.error"
      @click="emit('act', { type: 'qiJourney', action })"
    >
      {{ purpose === "pill" ? "循药图探采玉髓芝" : "闭关半年 · 贯通小周天" }}
    </button>
    <p>{{ quote.error || "中途来信会暂停筹备；实际年月照常计入年龄。" }}</p>
  </section>
</template>
<style scoped>
.cultivation-preparation {
  border-left: 2px solid #bca26b;
  padding: 0 14px;
  margin: 14px 0;
}
.cultivation-preparation p {
  line-height: 1.65;
}
.cultivation-preparation button {
  padding: 12px;
}
</style>
