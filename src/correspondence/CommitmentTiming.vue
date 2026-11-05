<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../world";
import { commitmentWarnings } from "./view";
const props = defineProps<{ game: State; months: number }>();
const warnings = computed(() => commitmentWarnings(props.game, props.months));
</script>
<template>
  <div
    v-if="warnings.length"
    class="commitment-timing"
    aria-label="约定与会期提醒"
  >
    <p v-for="warning in warnings" :key="warning" role="status">
      {{ warning }}
    </p>
    <small>提醒不会替你接约、赴会或改变闭关时长。</small>
  </div>
</template>
<style scoped>
.commitment-timing {
  border-left: 3px solid #b99e68;
  padding: 8px 12px;
  color: #ebd4a2;
  background: #102b24;
  line-height: 1.65;
}
</style>
