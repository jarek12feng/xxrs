<script setup lang="ts">
import {sceneSpeakerArt} from "../presentation/art";
import { computed, nextTick, ref, useId, watch } from "vue";
const props = defineProps<{
  image: string;
  title: string;
  body: string;
  speaker?: string;
  portrait?: string | null;
  quote?: string;
}>();
const standing=computed(()=>props.speaker ? sceneSpeakerArt[props.speaker] : undefined);
const expanded = ref(false);
const scene = ref<HTMLElement>();
const heading = ref<HTMLElement>();
const prose = ref<HTMLElement>();
const options = ref<HTMLElement>();
const proseId = useId();
const revision = ref(0);
// Keep the original prose intact, including closing quotation marks.
const sentences = computed(
  () => props.body.match(/[^。！？]+[。！？]?[”」』]?/gu) ?? [props.body],
);
const brief = computed(() => {
  let end = Math.min(2, sentences.value.length);
  let text = sentences.value.slice(0, end).join("");
  // A spoken passage may span several sentences. Finish its quotation before folding.
  const unclosed = (value: string) => [ ["“", "”"], ["「", "」"], ["『", "』"] ].some(
    ([open, close]) => value.split(open!).length > value.split(close!).length,
  );
  while (end < sentences.value.length && unclosed(text)) text += sentences.value[end++];
  return text;
});
watch(
  () => [props.title, props.body, props.speaker, props.image],
  async () => {
    const restoreFocus = scene.value?.contains(document.activeElement);
    expanded.value = false;
    revision.value++;
    await nextTick();
    if (prose.value) prose.value.scrollTop = 0;
    if (options.value) options.value.scrollTop = 0;
    // A resolved choice must not leave keyboard focus on the next event's action.
    if (restoreFocus) heading.value?.focus({ preventScroll: true });
  },
);
function toggleProse() {
  expanded.value = !expanded.value;
  if (prose.value) prose.value.scrollTop = 0;
}
</script>
<template>
  <section
    ref="scene"
    class="event-scene"
    :style="{ backgroundImage: `url(${image})` }"
    :aria-label="title + '场景'"
  >
    <div class="event-scene-shade" aria-hidden="true"></div>
    <div class="event-scene-title">
      <small>此刻 · 时光暂驻</small>
      <h2 ref="heading" id="modal-title" tabindex="-1">{{ title }}</h2>
    </div>
    <img v-if="standing" class="event-standing" :src="standing!" :alt="speaker" />
    <aside v-if="speaker && quote" class="event-speech" aria-label="人物对白">
      <strong>{{ speaker }}</strong><p class="event-quote">{{ quote }}</p>
    </aside>
    <div :key="revision" class="event-dialogue">
      <div class="event-voice">
        <div class="event-speaker">
          <span>眼前所见</span>
        </div>
        <div class="event-copy">
          <div
            ref="prose"
            :id="proseId"
            class="event-prose"
            tabindex="0"
            aria-label="眼前经过"
          >

            <p>{{ expanded ? body : brief }}</p>
          </div>
          <button
            v-if="brief.length < body.length"
            class="event-read"
            :aria-controls="proseId"
            :aria-expanded="expanded"
            @click="toggleProse"
          >
            {{ expanded ? "收起经过" : "读完整段" }}
          </button>
        </div>
      </div>
      <section ref="options" class="event-options" aria-label="剧情选择操作区">
        <slot />
      </section>
    </div>
  </section>
</template>
<style scoped>
.event-scene {
  position: relative;
  isolation: isolate;
  height: calc(100dvh - 90px);
  min-height: 400px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  color: #f5ead4;
}
.event-scene-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, #071b1780, transparent 40%, #071b17b3);
}
.event-scene-title {
  position: absolute;
  top: 28px;
  left: 36px;
  text-shadow: 0 2px 8px #000;
}
.event-scene-title small {
  color: #d2be90;
  letter-spacing: 3px;
}
.event-scene-title h2 {
  font-size: 30px;
  margin: 8px 0;
}
.event-scene-title h2:focus-visible {
  outline: 2px solid #e9ce92;
  outline-offset: 6px;
}
.event-dialogue {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: min(1180px, 92%);
  box-sizing: border-box;
  padding: 22px 26px;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr);
  gap: 26px;
  background: #102720f5;
  border: 1px solid #bba06b88;
  max-height: 56%;
  overflow: hidden;
  animation: dialogue-arrive 180ms ease-out;
}
.event-voice {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  min-height: 0;
  min-width: 0;
}
.event-speaker {
  flex: 0 0 96px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.event-speaker img {
  width: 96px;
  height: 126px;
  object-fit: cover;
  object-position: top;
  border: 1px solid #a79269;
  box-sizing: border-box;
}
.event-speaker strong,
.event-speaker span {
  color: #e9ce92;
  font-size: 16px;
  line-height: 1.5;
}
.event-copy {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  min-width: 0;
}
.event-prose {
  overflow: auto;
  min-height: 0;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  padding-right: 8px;
}
.event-prose p {
  font-size: 16px;
  line-height: 1.85;
  margin: 0 0 10px;
  white-space: pre-wrap;
}
.event-quote {
  color: #e6d8b9;
}
.event-read {
  flex: none;
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: #ddc797;
  cursor: pointer;
  padding: 8px 2px;
  min-height: 36px;
  text-decoration: underline;
}
.event-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  border-left: 1px solid #bba06b44;
  padding-left: 24px;
}
.event-options :deep(.choice) {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 12px 16px;
  text-align: left;
  background: #28483ae8;
  border: 1px solid #a38c5c;
  min-height: 52px;
  color: #f5ead4;
  cursor: pointer;
}
.event-options :deep(.choice:hover:not(:disabled)) {
  background: #365d49;
  border-color: #e0c48c;
}
.event-options :deep(.choice:disabled) {
  opacity: 0.65;
  cursor: not-allowed;
}
.event-options :deep(.choice small) {
  color: #e0d5bd;
  font-size: 13px;
  line-height: 1.6;
  display: block;
  margin-top: 4px;
}
.event-read:focus-visible,
.event-prose:focus-visible,
.event-options :deep(.choice:focus-visible) {
  outline: 2px solid #f3d494;
  outline-offset: -2px;
}
@keyframes dialogue-arrive {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .event-dialogue {
    animation: none;
  }
}
@media (max-width: 700px) {
  .event-dialogue {
    padding: 14px;
    max-height: 72%;
    bottom: 12px;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }
  .event-speaker {
    flex-basis: 64px;
  }
  .event-speaker img {
    width: 64px;
    height: 86px;
  }
  .event-scene-title {
    left: 20px;
  }
  .event-options {
    padding-left: 0;
    border-left: 0;
    border-top: 1px solid #bba06b44;
    padding-top: 12px;
  }
  .event-prose p {
    font-size: 15px;
  }
}
</style>

<style scoped>
.event-standing{position:absolute;left:20%;bottom:7%;height:55%;max-width:30%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 8px 8px #0007)}
.event-dialogue.event-speech{left:56%;bottom:18%;width:min(620px,48%);max-height:70%;display:flex;flex-direction:column;gap:14px;border-radius:18px;overflow:visible}
.event-speech::before{content:'';position:absolute;left:-10px;bottom:70px;width:18px;height:18px;background:#102720;border-left:1px solid #bba06b;border-bottom:1px solid #bba06b;transform:rotate(45deg)}
.event-speech .event-speaker{flex:0 0 auto}.event-speech .event-speaker img{display:none}.event-speech .event-voice{display:block}.event-speech .event-prose{max-height:24vh}.event-speech .event-options{max-height:27vh;overflow:auto}
@media(max-width:900px){.event-standing{left:4%;height:38%}.event-dialogue.event-speech{left:62%;width:65%;bottom:10%;padding:14px}}
</style>

<style scoped>
.event-speech {position:absolute;left:12%;top:20%;width:min(420px,42%);max-height:22%;overflow:auto;z-index:4;padding:14px 18px;border:1px solid #bba06b;border-radius:16px;background:#102720f5;color:#f2ead7;box-sizing:border-box}
.event-speech .event-quote{margin:8px 0 0}
.event-speech::before{display:none}
@media(max-width:900px){.event-speech{left:16px;top:18%;width:calc(100% - 32px);max-height:20%}}
</style>
