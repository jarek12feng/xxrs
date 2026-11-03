<script setup lang="ts">
import { computed, ref, watch } from "vue";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import type { State, Intent } from "../core";
import { companionshipView } from "./view";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; equipment: [] }>();
const scene = computed(() => companionshipView(props.game));
const active = ref("");
watch(
  () => props.game.companionship.stage,
  () => {
    active.value = "";
  },
);
const actionObject = computed(() =>
  ["prepare", "trial"].includes(props.game.companionship.stage)
    ? "route"
    : "companion",
);
const hotspots = computed(() => [
  { id: "companion", label: scene.value.name, x: 52, y: 56 },
  {
    id: "route",
    label: props.game.social.gender === "male" ? "尺绳与归路" : "风标与归路",
    x: 30,
    y: 67,
  },
  { id: "equipment", label: "随身功法", x: 78, y: 73 },
]);
</script>
<template>
  <section class="companionship-panel" aria-label="筑基后共同历险">
    <NarrativeStage
      :image="scene.image"
      :title="scene.title"
      :goal="scene.stage"
      :stage-key="game.companionship.stage"
      :hotspots="hotspots"
      :active="active"
      @select="active = $event"
      @close="active = ''"
    >
      <template #world
        ><img
          v-if="game.companionship.stage !== 'unstarted'"
          class="world-companion"
          :src="scene.portrait"
          :alt="scene.name + '在归路旁'"
      /></template>
      <template #notes
        ><p>{{ scene.body }}</p>
        <p>{{ scene.last }}</p>
        <p>可先回洞府整备，再来赴约。此行不耗月份。</p></template
      >
      <template #status
        ><span>可选同行 · {{ scene.stage }}</span
        ><small v-if="scene.last" class="scene-recent" role="status">{{
          scene.last.split("。")[0]
        }}</small></template
      >
      <template v-if="active === 'companion'">
        <img
          class="dialogue-portrait"
          :src="scene.portrait"
          :alt="scene.name"
        />
        <h3>{{ scene.name }}</h3>
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
      </template>
      <template v-if="active === 'route'">
        <p>
          {{
            game.companionship.stage === "prepare"
              ? "选一条合力通过险段的办法。"
              : game.companionship.stage === "trial"
                ? "亲自走一遍归路，检验护身之法。"
                : "归路的安排须先与同行的人商量。"
          }}
        </p>
      </template>
      <template v-if="active === 'equipment'">
        <p>
          此行不耗月份。可在此查看随身功法；合力开路后可习得护身诀，用于试走归路。
        </p>
        <button :disabled="busy" @click="emit('equipment')">
          查看功法装配
        </button>
      </template>
      <button
        v-if="game.companionship.stage === 'trial' && active === 'route'"
        :disabled="busy"
        @click="emit('equipment')"
      >
        打开功法，装配护身诀
      </button>
      <div v-if="active === actionObject" class="companion-options">
        <button
          v-for="option in scene.options"
          :key="option.action"
          :disabled="busy || !!option.disabled"
          @click="emit('act', { type: 'companionship', action: option.action })"
        >
          <strong>{{ option.label }}</strong
          ><small>{{ option.hint }}</small
          ><small v-if="option.disabled">{{ option.disabled }}</small>
        </button>
      </div>
    </NarrativeStage>
  </section>
</template>
<style scoped>
.companionship-panel {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #f4eedc;
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

<style scoped>
.world-companion {
  position: absolute;
  left: 43%;
  bottom: 12%;
  height: 56%;
  width: 24%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 12px 14px #0007);
}
.dialogue-portrait {
  float: left;
  width: 120px;
  height: 185px;
  object-fit: contain;
  margin: 0 14px 8px 0;
}
</style>

<style scoped>
.scene-recent {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: 8px;
  color: #dfd4b9;
  font-size: 12px;
  line-height: 1.6;
}
</style>
