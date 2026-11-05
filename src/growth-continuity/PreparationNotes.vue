<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../world";
import { preparationOpportunities } from "./preparation";
import { formatLifeMonths } from "../progression";
const props = defineProps<{ game: State; busy?: boolean }>();
defineEmits<{ act: [intent: Intent] }>();
const rows = computed(() => preparationOpportunities(props.game));
</script>
<template>
  <details
    v-if="rows.length"
    class="preparation-notes"
    aria-label="闭关前的器物准备"
  >
    <summary>闭关前 · 手边还有 {{ rows.length }} 项器物准备</summary>
    <p>也可继续修行，所得器物会留在行囊中。</p>
    <article v-for="row in rows" :key="row.id">
      <strong>{{ row.title }}</strong>
      <p>{{ row.purpose }}</p>
      <p v-if="row.months || row.stones || row.herbs || row.iron">
        <span v-if="row.months">{{ formatLifeMonths(row.months) }} </span>
        <span v-if="row.stones">· 灵石 {{ row.stones }} </span>
        <span v-if="row.herbs">· 灵草 {{ row.herbs }} </span>
        <span v-if="row.iron">· 玄铁料 {{ row.iron }}</span>
      </p>
      <button :disabled="busy || !!row.error" @click="$emit('act', row.intent)">
        {{ row.title }}
      </button>
      <p v-if="row.error" class="reason">{{ row.error }}</p>
    </article>
  </details>
</template>
<style scoped>
.preparation-notes {
  border-left: 2px solid #b7aa7c;
  padding: 8px 12px;
  margin: 12px 0;
}
summary {
  cursor: pointer;
  color: #efdcad;
}
article {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #a59b6855;
}
button {
  padding: 8px 14px;
}
p {
  line-height: 1.6;
}
.reason {
  color: #e0ceaa;
}
</style>
