<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { revisitView, type RevisitSite } from "./projection";
import { revisitQuote } from "./rules";
import { resourceNames, type ResourceAmounts, type Resource } from "../economy";
const props = defineProps<{ game: State; site: RevisitSite; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const view = computed(() => revisitView(props.game, props.site));
const offers = computed(
  () =>
    view.value?.offers.map((o) => ({
      ...o,
      quote: revisitQuote(props.game, { site: props.site, offer: o.id }),
    })) ?? [],
);
const amounts = (v: ResourceAmounts) =>
  Object.entries(v)
    .map(([k, n]) => `${resourceNames[k as Resource]}${n}`)
    .join("、");
</script>
<template>
  <section v-if="view" class="revisit-panel" aria-label="旧地回应">
    <h4>{{ view.title }}</h4>
    <p>{{ view.account }}</p>
    <p>{{ view.change }}</p>
    <details v-if="offers.length">
      <summary>按旧约筹备下一程</summary>
      <div v-for="offer in offers" :key="offer.id" class="revisit-offer">
        <p>{{ offer.reason }}</p>
        <button
          :disabled="busy || !!offer.quote.error"
          @click="
            emit('act', { type: 'revisit', action: { site, offer: offer.id } })
          "
        >
          {{ offer.label }} · {{ amounts(offer.cost) }}</button
        ><small v-if="offer.quote.error">{{ offer.quote.error }}</small>
      </div>
      <p class="revisit-hint">
        可按需购置，不耗年月；每次照价结算。原有采药、工坊与普通补给仍可使用。
      </p>
    </details>
  </section>
</template>
<style scoped>
.revisit-panel {
  border-left: 2px solid #b7aa7c;
  padding: 4px 12px;
  margin: 12px 0;
  background: #19332a66;
}
.revisit-panel h4 {
  margin: 4px 0;
  color: #eddaad;
}
.revisit-panel p {
  line-height: 1.65;
}
.revisit-panel summary {
  cursor: pointer;
  color: #efdcad;
  padding: 8px 0;
}
.revisit-offer {
  margin: 12px 0;
}
.revisit-offer button {
  padding: 10px;
  color: #fff1d1;
  background: #25443d;
  border: 1px solid #b8a777;
  text-align: left;
}
.revisit-offer small {
  display: block;
  color: #e0ceaa;
}
.revisit-hint {
  font-size: 0.9em;
  color: #d0c6ad;
}
</style>
