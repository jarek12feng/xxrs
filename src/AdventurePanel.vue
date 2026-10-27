<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from "vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import SceneResponse from "./SceneResponse.vue";
import type { ActionReceipt } from "./action-feedback";
import {
  adventureScenes,
  adventureOptions,
  type State,
  type Intent,
} from "./core";
const props = defineProps<{
  game: State;
  busy: boolean;
  receipt?: ActionReceipt | null;
}>();
const panel = ref<HTMLElement>();
const reveal = async () => {
  await nextTick();
  panel.value?.scrollIntoView({ block: "start", behavior: "instant" });
};
onMounted(reveal);
watch(() => props.game.adventure.step, reveal);
const emit = defineEmits<{ act: [intent: Intent]; cultivate: [] }>();
const scene = computed(() => adventureScenes[props.game.adventure.step]);
const locked = computed(
  () =>
    props.busy ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel,
);
const chapters = ["渡口调查", "药庐准备", "雾林寻路", "山祠营救", "灯火归途"];
const index = computed(
  () =>
    ({
      invitation: 0,
      ferry: 0,
      apothecary: 1,
      forest: 2,
      shrine: 3,
      home: 4,
      done: 4,
    })[props.game.adventure.step],
);
const person = computed(() =>
  props.game.adventure.step === "apothecary"
    ? {
        name: "温蘅",
        image: "/characters/wenheng.png",
        line: "先学会把人平安带回来，再谈修为高低。",
      }
    : ["ferry", "home"].includes(props.game.adventure.step) ||
        props.game.adventure.method === "guide"
      ? {
          name: "陆迟",
          image: "/characters/luchi-base.png",
          line: "你来决定往哪走。需要我时，我就在这里。",
        }
      : null,
);
</script>
<template>
  <section
    ref="panel"
    class="adventure-panel desktop-scene"
    :data-weather="scene.mood"
    aria-label="寻人主线"
  >
    <SceneBackdrop
      :key="game.adventure.step"
      :image="scene.image"
      :title="scene.name"
      eyebrow="第一卷 · 雨中失踪的人"
      :body="scene.body"
      :speaker="person?.name"
      :portrait="person?.image"
      :quote="person?.line"
    >
      <SceneResponse
        :text="game.adventure.result"
        :receipt="receipt?.scene?.chapter === 'adventure' ? receipt : null"
      />
    </SceneBackdrop>
    <section class="scene-controls" aria-label="冒险操作区">
      <h3 class="controls-heading">接下来，你来决定</h3>
      <ol class="chapter-track" aria-label="主线进度">
        <li
          v-for="(chapter, i) in chapters"
          :key="chapter"
          :class="{ current: i === index, passed: i < index }"
        >
          {{ i + 1 }} · {{ chapter }}
        </li>
      </ol>
      <div class="adventure-task">
        <span class="eyebrow">眼下要做的事</span>
        <h2>{{ scene.goal }}</h2>
        <p v-if="game.adventure.step !== 'invitation'">
          线索：{{ game.adventure.clue ? "青瘴粉、归路红绳" : "尚未调查" }} ·
          准备：{{ game.adventure.ready ? "已掌握应对方法" : "尚未就绪"
          }}<span v-if="game.adventure.attempts">
            · 已尝试营救 {{ game.adventure.attempts }} 次</span
          >
        </p>
      </div>
      <div class="adventure-actions">
        <button
          v-for="option in adventureOptions(game.adventure)"
          :key="option.action"
          :disabled="
            locked || (option.action === 'prepare' && game.adventure.ready)
          "
          @click="
            option.action === 'finish'
              ? emit('cultivate')
              : emit('act', { type: 'adventure', action: option.action })
          "
        >
          {{ option.label }}<span>→</span>
        </button>
      </div>
      <p class="adventure-footnote">
        寻人途中，先观察，再决定。药庐提供练习物资；此段探索不消耗修行月份。
      </p>
    </section>
  </section>
</template>
