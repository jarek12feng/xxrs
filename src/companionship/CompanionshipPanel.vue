<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { companionshipView } from "./view";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; equipment: [] }>();
const scene = computed(() => companionshipView(props.game));
</script>
<template>
  <section class="companionship-panel" aria-label="筑基后共同历险">
    <h3>筑基同行 · {{ scene.title }}</h3>
    <p class="muted">可选历险 · 与道友相约同行</p>
    <div
      v-if="game.companionship.stage !== 'unstarted'"
      class="companion-scene"
    >
      <img
        class="companion-background"
        :src="scene.image"
        :alt="scene.title + '场景'"
        loading="lazy"
      />
      <img
        class="companion-standing"
        :src="scene.portrait"
        :alt="scene.name + '正在参与这次同行'"
        loading="lazy"
      />
      <span>{{ scene.name }} · {{ scene.stage }}</span>
    </div>
    <p class="companion-prose">{{ scene.body }}</p>
    <p
      v-if="
        game.companionship.stage === 'unstarted' ||
        game.companionship.stage === 'prepare'
      "
      class="muted"
    >
      {{ scene.reward }}
    </p>
    <p v-if="game.companionship.stage === 'dispute'" role="status">
      协作完成 · 护身诀已可用，接下来决定归路安排，再装配试用。
    </p>
    <details v-if="game.companionship.stage === 'dispute'">
      <summary>回看刚才的协作与收获</summary>
      <p>{{ scene.last }}</p>
    </details>
    <button
      v-if="game.companionship.stage === 'trial'"
      :disabled="busy"
      @click="emit('equipment')"
    >
      打开功法，装配护身诀
    </button>
    <div class="companion-options">
      <button
        v-for="option in scene.options"
        :key="option.action"
        :disabled="busy || !!option.disabled"
        @click="emit('act', { type: 'companionship', action: option.action })"
      >
        <strong>{{ option.label }}</strong
        ><small>{{ option.disabled || option.hint }}</small>
      </button>
    </div>
    <p class="muted">
      可关闭人物面板，回洞府准备后继续；阶段与约定会保存。此段行动不推进月份。
    </p>
  </section>
</template>
<style scoped>
.companionship-panel {
  margin: 18px 0;
  padding: 16px;
  border: 1px solid #8b997e;
  border-radius: 12px;
  background: #172d26;
  color: #f4eedc;
}
.companion-scene {
  position: relative;
  height: 280px;
  overflow: hidden;
  border-radius: 8px;
}
.companion-background {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.companion-standing {
  position: absolute;
  right: 4%;
  bottom: 0;
  height: 96%;
  max-width: 48%;
  object-fit: contain;
}
.companion-scene > span {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 7px 10px;
  background: #172d26;
  color: #fff4d6;
}
.companion-prose {
  line-height: 1.85;
}
.companion-options {
  display: grid;
  gap: 10px;
}
.companion-options button {
  padding: 12px;
  text-align: left;
  white-space: normal;
  background: #29483b;
  color: #fff2d1;
  border: 1px solid #8b997e;
  border-radius: 8px;
  min-height: 60px;
}
.companion-options small {
  display: block;
  margin-top: 6px;
  line-height: 1.6;
}
.companionship-panel .muted {
  color: #c9d5c3;
  line-height: 1.7;
}
@media (max-width: 650px) {
  .companionship-panel {
    padding: 10px;
  }
  .companion-scene {
    height: 230px;
  }
}
</style>
