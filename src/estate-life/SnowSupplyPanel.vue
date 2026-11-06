<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../world";
import { snowSupplyView } from "./expedition";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; estate: [] }>();
const supply = computed(() => snowSupplyView(props.game));
</script>
<template>
  <details v-if="supply" class="snow-supply">
    <summary>{{ supply.title }} · 查看用途与补给来源</summary>
    <p>{{ supply.purpose }}</p>
    <template v-if="!supply.prepared && !supply.won">
      <p>
        若选自备护寒：护脉丹{{ supply.cost.ward }}、灵草{{
          supply.cost.herbs
        }}、灵石{{ supply.cost.stones }}，在雪线整备时消耗。
      </p>
      <p>
        当前缺口：护脉丹{{ supply.missing.ward }}、灵草{{
          supply.missing.herbs
        }}、灵石{{
          supply.missing.stones
        }}。护脉丹用于行前护寒，不能在交锋中补回气势。
      </p>
    </template>
    <p>{{ supply.herbUse }}</p>
    <template v-if="game.foundationJourney.location === 'estate'">
      <p>
        药庄合作可换灵草或灵石；也可直接购药。以下沿用工坊配方与售价，自炼还需相应心得。
      </p>
      <article
        v-for="item in supply.orders"
        :key="item.order.product + item.order.method"
      >
        <button
          :disabled="busy || !!item.quote.error"
          @click="emit('act', { type: 'workshop', order: item.order })"
        >
          {{ item.order.method === "craft" ? "自炼" : "购入"
          }}{{ item.quote.name }} · {{ item.quote.cost }} ·
          {{ item.quote.months ? `耗时${item.quote.months}月` : "不耗年月" }}
        </button>
        <small v-if="item.quote.error">{{ item.quote.error }}</small>
      </article>
      <template v-if="game.injury">
        <p>
          当前伤势{{
            game.injury
          }}。回春散疗复伤势，不恢复单场气势；也可在原有修行入口静养。
        </p>
        <button
          :disabled="busy || !!supply.healingError"
          @click="emit('act', { type: 'consume', medicine: 'healing' })"
        >
          服用回春散 · 不耗年月
        </button>
        <small v-if="supply.healingError">{{ supply.healingError }}</small>
      </template>
    </template>
    <template v-else>
      <p>
        物资不足或败退后，可循原路回药庄合作换料、购药或自炼；已完成的护寒与路线取舍保留。
      </p>
      <button :disabled="busy" @click="emit('estate')">查看返药庄路程</button>
    </template>
  </details>
</template>
<style scoped>
.snow-supply {
  margin: 14px 0;
  padding: 10px;
  border: 1px solid #8c9c7866;
  color: #eee4c9;
}
summary {
  cursor: pointer;
  padding: 8px 0;
}
p {
  line-height: 1.65;
}
article {
  margin: 8px 0;
}
button {
  min-height: 42px;
  padding: 9px 12px;
  background: #294a40;
  color: #ffedbb;
  border: 1px solid #ad9e74;
  text-align: left;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
summary:focus-visible {
  outline: 2px solid #ffe5a2;
  outline-offset: 3px;
}
small {
  display: block;
  line-height: 1.6;
  color: #edba9c;
}
</style>
