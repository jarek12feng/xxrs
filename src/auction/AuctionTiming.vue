<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../world";
import { auctionTimingWarnings } from "./index";
const props = defineProps<{ game: State; months: number }>();
const warnings = computed(() =>
  auctionTimingWarnings(props.game, props.months),
);
</script>
<template>
  <p v-for="text in warnings" :key="text" class="auction-timing" role="status">
    {{ text }}
  </p>
</template>
<style scoped>
.auction-timing {
  border-left: 3px solid #b99e68;
  padding: 8px 12px;
  color: #ebd4a2;
  background: #102b24;
  line-height: 1.65;
}
</style>
