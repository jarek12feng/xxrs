<script setup lang="ts">
import { computed, ref } from "vue";
import { relics, type State, type Intent } from "./core";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{
  act: [intent: Intent];
  forge: [];
  breakthrough: [];
}>();
const category = ref("全部"),
  selected = ref("herbs");
const items = computed(() => [
  {
    id: "herbs",
    name: "灵草",
    category: "材料",
    count: props.game.herbs,
    description: "用于炼丹、炼器与救治。具体消耗在行动前显示。",
  },
  {
    id: "pills",
    name: "筑基丹",
    category: "丹药",
    count: props.game.pills,
    description: "尝试筑基时选择服用，不能在储物袋中直接消耗。",
  },
  ...(["vial", "sword"] as const)
    .filter((id) => props.game.journey.relics[id] > 0)
    .map((id) => ({
      id,
      name: relics[id].name,
      category: "装备",
      count: 1,
      description: relics[id].hint,
    })),
]);
const visible = computed(() =>
  items.value.filter(
    (i) => category.value === "全部" || i.category === category.value,
  ),
);
const item = computed(
  () => visible.value.find((i) => i.id === selected.value) || visible.value[0],
);
</script>
<template>
  <p>
    灵石 {{ game.stones }} · 当前灵器：{{
      game.journey.equipped ? relics[game.journey.equipped].name : "未装备"
    }}
  </p>
  <nav class="panel-tabs" aria-label="物品分类">
    <button
      v-for="tab in ['全部', '装备', '丹药', '材料']"
      :aria-pressed="category === tab"
      @click="category = tab"
    >
      {{ tab }}
    </button>
  </nav>
  <div class="inventory-layout">
    <div class="item-grid">
      <button
        v-for="entry in visible"
        :key="entry.id"
        :aria-pressed="item?.id === entry.id"
        @click="selected = entry.id"
      >
        <span class="item-seal">{{ entry.name.slice(0, 1) }}</span
        ><strong>{{ entry.name }}</strong
        ><small>× {{ entry.count }}</small>
      </button>
      <p v-if="!visible.length">尚未获得此类物品。</p>
    </div>
    <section v-if="item" class="item-detail">
      <small>{{ item.category }}</small>
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
      <template v-if="item.id === 'vial' || item.id === 'sword'">
        <p>
          {{ game.journey.relics[item.id] === 2 ? "精炼灵器" : "普通灵器" }} ·
          基础闯关助益 +{{ game.journey.relics[item.id] * 10 }}%
        </p>
        <p v-if="game.journey.equipped">
          当前装备：{{ relics[game.journey.equipped].name }} · 基础助益 +{{
            game.journey.relics[game.journey.equipped] * 10
          }}%
        </p>
        <button
          :disabled="
            busy ||
            game.journey.equipped === item.id ||
            !!game.pending ||
            !!game.social.scene ||
            !!game.social.arena.duel ||
            game.status !== 'alive'
          "
          @click="emit('act', { type: 'equipRelic', relic: item.id })"
        >
          {{ game.journey.equipped === item.id ? "已装备" : "装备" }}
        </button>
      </template>
      <button
        v-if="item.id === 'pills'"
        :disabled="busy || game.realm > 0 || game.qi < 360"
        @click="emit('breakthrough')"
      >
        前往突破
      </button>
      <p v-if="item.id === 'pills' && game.qi < 360">
        修为达到 360 后可尝试筑基。
      </p>
    </section>
  </div>
  <button @click="emit('forge')">前往炼器与购药</button>
</template>
