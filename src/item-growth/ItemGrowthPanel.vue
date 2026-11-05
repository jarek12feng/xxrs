<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../world";
import ItemArt from "../presentation/ItemArt.vue";
import { storageProfile } from "./state";
import { itemGrowthQuote, reforgeEffect, type ItemGrowthAction } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const p = computed(() => props.game.itemGrowth),
  storage = computed(() => storageProfile(p.value));
const orders = computed(() => {
  const rows: { label: string; action: ItemGrowthAction; effect: string }[] =
    [];
  if (!p.value.ring && !p.value.reinforced)
    rows.push({
      label: "扩容储物袋",
      action: { kind: "expand" },
      effect: "大件载荷1→2，可自行带回一块沉纹器髓",
    });
  if (p.value.ring === 1)
    rows.push({
      label: "修复栖尘戒内层",
      action: { kind: "restore" },
      effect:
        "大件载荷4→6；普通疗伤、养神、护脉炼药每炉节省灵草1；需分念诀与有效神识18",
    });
  if (p.value.discovered)
    for (const relic of ["sword", "vial"] as const)
      if (!p.value.reforged[relic])
        rows.push({
          label: `重铸${relic === "sword" ? "听松灵剑" : "归元灵瓶"}`,
          action: { kind: "reforge", relic },
          effect: `二阶旧器、沉纹器髓1；${reforgeEffect[relic]}`,
        });
  return rows.map((row) => ({
    ...row,
    quote: itemGrowthQuote(props.game, row.action),
  }));
});
</script>
<template>
  <section class="growth-storage" aria-label="容器与旧器成长">
    <p>
      <ItemArt v-if="p.ring" id="relic-ring" :size="48" /><strong>{{
        storage.name
      }}</strong>
      · 大件载荷 {{ storage.used }} / {{ storage.capacity
      }}<span v-if="p.ring === 2"> · 内外贯通，普通炼药每炉省灵草1</span>
    </p>
    <p class="muted">
      普通补给照常收纳，不可容纳活物。大件载荷只计算未封装器髓，不是普通物资格数。
    </p>
    <p v-if="p.discovered">
      沉纹器髓 {{ p.ore }}块 · 分匣封装 {{ p.packedOre }}块 · 沉井余材
      {{ 2 - p.collected }}块。每块未封装器髓占载荷2。
    </p>
    <p
      v-for="relic in (['sword', 'vial'] as const).filter(
        (id) => p.reforged[id],
      )"
      :key="relic"
    >
      <ItemArt :id="`reforged-${relic}`" :size="48" />{{
        relic === "sword" ? "听松灵剑" : "归元灵瓶"
      }}已重铸 ·
      {{ game.journey.equipped === relic ? "已装配" : "尚未装配" }}。{{
        reforgeEffect[relic]
      }}
    </p>
    <details>
      <summary>容器升级与旧器重铸</summary>
      <p v-if="game.realm === 1 && !p.discovered">
        沉井石偶身后露出侧室石匣，探府胜利后可在无名渡查看。额外机缘可暂缓，不影响主线晋升。
      </p>
      <p v-else-if="game.realm === 0">
        扩容袋可多收大件；眼下的普通药草与丹药仍能照常携带，无须为它耽误修行。
      </p>
      <div v-for="row in orders" :key="row.label" class="growth-order">
        <p>{{ row.effect }}</p>
        <button
          :disabled="busy || !!row.quote.error"
          @click="emit('act', { type: 'itemGrowth', action: row.action })"
        >
          {{ row.label }} · 灵石{{ row.quote.stones
          }}<template v-if="row.quote.iron"
            >、玄铁料{{ row.quote.iron }}</template
          >
          · {{ row.quote.months }}月</button
        ><small>{{ row.quote.error }}</small>
      </div>
      <p v-if="p.last" role="status">{{ p.last }}</p>
    </details>
  </section>
</template>
<style scoped>
.growth-storage {
  padding: 12px 16px;
  border: 1px solid #82724a;
  border-radius: 6px;
  margin: 12px 0;
}
.growth-storage p {
  margin: 6px 0;
}
.growth-order {
  padding: 10px 0;
  border-bottom: 1px solid #82724a66;
}
.growth-order button {
  max-width: 100%;
  white-space: normal;
  text-align: left;
}
small {
  display: block;
}
summary {
  cursor: pointer;
  padding: 8px 0;
}
</style>
