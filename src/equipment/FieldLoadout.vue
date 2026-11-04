<script setup lang="ts">
import { computed } from 'vue';
import type { State, Intent } from '../core';
import { loadoutPreview, controlDescription, controlCosts, inspectEquipment, listEquipment } from './index';
import { treasureQuote } from '../treasures/rules';
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const items = computed(() => listEquipment().map(id => {
  const item = inspectEquipment(props.game, id);
  const action = { kind: item.active ? 'withdraw' as const : 'deploy' as const, item: id };
  const error = treasureQuote(props.game, action).error;
  return { id, ...item, action, error, preview: error ? "" : loadoutPreview(props.game, { kind: action.kind, id }) };
}).filter(item => item.rank));
</script>
<template>
  <details class="field-loadout">
    <summary>整理随身器物 · {{ controlDescription(game) }}</summary>
    <p>在此调整出战组合，不耗年月。温养完成的法宝仍需自行出战。</p>
    <div v-for="item in items" :key="item.id" class="field-item">
      <span>{{ item.definition.name }} · 容量 {{ controlCosts[item.id] }} · {{ item.active ? '已出战' : '在行囊中' }}</span>
      <p v-if="item.preview">{{ item.preview }}</p>
      <button :disabled="busy || !!item.error" @click="emit('act', { type: 'treasure', action: item.action })">
        {{ item.active ? '收回' : '出战' }}{{ item.definition.name }}
      </button>
      <small v-if="item.error">{{ item.error }}</small>
    </div>
    <p v-if="!items.length">行囊中还没有可出战的器物。</p>
    <p role="status" v-if="game.treasures.last">{{ game.treasures.last }}</p>
  </details>
</template>
<style scoped>
.field-item { padding: 8px 0; border-bottom: 1px solid #bca26b44; }
.field-item span, .field-item small { display: block; }
.field-item small { color: #dfcfaa; }
</style>
