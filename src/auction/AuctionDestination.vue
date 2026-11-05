<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../world";
import { auctionMapInfo } from "./map";
const props = defineProps<{ game: State; place: string; months?: number }>();
const info = computed(() =>
  auctionMapInfo(props.game, props.place, props.months),
);
</script>
<template>
  <section
    v-if="info"
    class="auction-destination"
    aria-label="当地拍卖与赴会行程"
  >
    <h4>{{ info.name }}</h4>
    <p>{{ info.cadence }}</p>
    <p>{{ info.timing }}</p>
    <p v-if="info.arrival" role="status">{{ info.arrival }}</p>
    <p v-if="info.admission">{{ info.admission }}</p>
    <details><summary>如何进入会场</summary><p>
      {{
        info.here ? "已到当地，可回现场进入拍卖行。" : info.directions
      }}
      厅内走动不另扣年月。
    </p></details>
  </section>
</template>
<style scoped>
.auction-destination {
  padding: 12px;
  border: 1px solid #9b845c;
  background: #163029;
  color: #eee2c9;
  margin: 12px 0;
}
.auction-destination h4 {
  margin: 0 0 8px;
}
.auction-destination p {
  margin: 6px 0;
  line-height: 1.6;
}
</style>
