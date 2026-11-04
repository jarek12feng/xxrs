<script setup lang="ts">
import { computed } from "vue";
import { projectInteractions } from "../story-interactions";
import type { State, Intent } from "../core";
import { qiPeople, personReply, type PersonAction } from "./people";
import { qiQuote } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{
  act: [intent: Intent];
  inventory: [];
  facilities: [];
}>();
const actions = {
  scout: [
    ["person:scout", "认识许照岚"],
    ["lesson:scout", "识兽练习 · 灵草 3"],
    ["reward:scales-money", "交付蟒蜕 · 灵石 24"],
    ["reward:scales-medicine", "交付蟒蜕 · 回春散 2、灵草 4"],
  ],
  smith: [
    ["person:smith", "认识裴铸"],
    ["lesson:smith", "试阵练习 · 灵石 10、心得 2"],
    ["reward:core-money", "交付阵枢 · 灵石 32"],
    ["reward:core-training", "保留至筑基后交付 · 护身诀通达"],
  ],
} as const;
const options = computed(() => {
  const project = (key: keyof typeof actions) => projectInteractions(props.game, actions[key].map(([action, label]) => ({ action, label })), qiQuote);
  return { scout: project("scout"), smith: project("smith") };
});
</script>
<template>
  <section
    v-if="game.qi >= 120 || game.realm"
    class="qi-people"
    aria-label="山下故人与成长委托"
  >
    <h3>山下故人</h3>
    <p>药谷、宗门、散修，择一路历练即可。若有余暇，也可向故人请教，或以战利品换些盘缠。</p>
    <details
      v-for="(npc, key) in qiPeople"
      :key="key"
      :open="
        key === 'scout'
          ? game.qiJourney.people.scales
          : game.qiJourney.people.core
      "
    >
      <summary>
        {{ npc.name }} · {{ npc.role
        }}{{ game.qiJourney.people[key] ? " · 已相识" : " · 尚未相识" }}
      </summary>
      <div class="person-intro">
        <img
          :src="npc.image"
          :alt="npc.name"
          loading="lazy"
          width="120"
          height="160"
        />
        <p>{{ personReply(game, key) }}</p>
      </div>
      <p v-if="key === 'scout' && game.qiJourney.people.scales">
        携带：完整蟒蜕 1。两种报酬只能选择一种，交付会消耗蟒蜕。
      </p>
      <p v-if="key === 'smith' && game.qiJourney.people.core">
        携带：失灵阵枢 1。可换眼前灵石，也可保留到筑基后研修；只能选一种。
      </p>
      <div class="person-actions">
        <button
          v-for="option in options[key]"
          :key="option.id"
          :disabled="busy || !option.available"
          @click="
            emit('act', { type: 'qiJourney', action: option.action as PersonAction })
          "
        >
          {{ option.label
          }}<small>{{ option.error || "耗时一月" }}</small>
        </button>
      </div>
    </details>
    <p v-if="game.qiJourney.people.scoutReward === 'medicine'">
      <button :disabled="busy" @click="emit('inventory')">去储物袋服药</button>
    </p>
    <p v-if="game.qiJourney.people.smithReward === 'training'">
      <button :disabled="busy" @click="emit('facilities')">
        去功法面板装配护身诀
      </button>
    </p>
  </section>
</template>
<style scoped>
.qi-people {
  padding: 14px;
  margin: 14px 0;
  background: #14271f;
  color: #f4ead3;
  border: 1px solid #a9986d;
  border-radius: 8px;
}
.qi-people h3 {
  color: #f4dfaa;
}
.qi-people details {
  padding: 10px 0;
  border-top: 1px solid #64745d;
}
.qi-people summary {
  cursor: pointer;
  line-height: 1.6;
}
.person-intro {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 12px;
}
.person-intro img {
  width: 90px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
}
.person-intro p {
  margin: 0;
  line-height: 1.65;
}
.person-actions {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
  margin-top: 10px;
}
.person-actions button {
  white-space: normal;
  text-align: left;
  padding: 10px;
}
.person-actions small {
  display: block;
  line-height: 1.5;
}
.person-actions button:disabled {
  opacity: 1;
  background: #38483c;
  color: #d9e1d4;
  border: 1px solid #778571;
  cursor: not-allowed;
}
</style>
