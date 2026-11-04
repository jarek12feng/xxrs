<script setup lang="ts">
import { computed, ref } from "vue";
import type { State, Intent } from "../core";
import {characterArt,heroArt} from "../presentation/art";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import {
  goldenStoryQuote,
  teachingText,
  companionNews,
  goldenCooperation,
  type GoldenStoryAction,
} from "./rules";
import { companionLetterArchive } from "./companion";
import { teachingSpeaker, teachingExercises } from "./teaching";
const props = defineProps<{
  game: State;
  busy: boolean;
  place: "home" | "sea" | "conclave";
}>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const selected = ref(props.game.goldenStory.practice ? "teaching" : "");
const g = computed(() => props.game.goldenStory);
const tide = computed(() => props.place === "sea" && !g.value.tideComplete && !g.value.practice);
const teacherPresent = computed(() => props.place === "conclave" && props.game.realm === 2 && props.game.conclave.location === "court" && props.game.conclave.introduced && teachingSpeaker(props.game, "seat").present);
const hotspots = computed(() =>
  props.place === "home"
    ? [
        { id: "direction", label: "远行引荐与传承目录", x: 40, y: 53 },
        { id: "letters", label: "旧友来信", x: 68, y: 65 },
        { id: "exit", label: "回凝丹旧居", x: 90, y: 56 },
      ]
    : [
        ...(tide.value
          ? [
              { id: "gauge", label: "潮尺 · 对照水位", x: 79, y: 48 },
              { id: "flow", label: "堤缘阵石 · 测回流", x: 67, y: 60 },
              { id: "duty", label: "图台 · 商议分工", x: 33, y: 59 },
            ]
          : []),
        {
          id: "teaching",
          label: teachingSpeaker(props.game, props.place === "conclave" ? "seat" : "public").hotspot,
          x: teacherPresent.value ? 29 : tide.value ? 48 : 40,
          y: tide.value ? 77 : 48,
        },
        ...(props.game.outerSea.cleared === 2
          ? [{ id: "record", label: "退潮旧录", x: 26, y: 72 }]
          : []),
        ...(props.game.conclave.depth === 2
          ? [{ id: "rubbings", label: "归潮拓本 · 三方回执", x: 59, y: 73 }]
          : []),
        { id: "letters", label: "旧友来信", x: 76, y: 77 },
        {
          id: "exit",
          label: props.place === "conclave" ? "回会谷石台" : "回古渡",
          x: 92,
          y: 55,
        },
      ],
);
const rows = computed(() => {
  const list: { label: string; action: GoldenStoryAction }[] = [];
  if (selected.value === "direction" && g.value.direction === "none")
    list.push(
      {
        label: "向听松求教后篇目录",
        action: { kind: "direction", choice: "sect" },
      },
      {
        label: "以散修身份请人引荐",
        action: { kind: "direction", choice: "independent" },
      },
    );
  if (selected.value === "gauge" || selected.value === "flow")
    list.push({
      label: selected.value === "gauge" ? "刻下今日满潮线" : "测读堤后回流",
      action: {
        kind: "observe",
        point: selected.value === "gauge" ? "gauge" : "flow",
      },
    });
  if (selected.value === "duty" && !g.value.tideComplete)
    list.push(
      {
        label: "我来护堤 · 实测耗灵草2",
        action: { kind: "duty", duty: "ward" },
      },
      {
        label: "我来校图 · 实测耗灵石4",
        action: { kind: "duty", duty: "survey" },
      },
      { label: "按分工复测一个潮期", action: { kind: "measure" } },
    );
  if (selected.value === "record" && !g.value.oldRecord)
    list.push({
      label: "用温养与研修所得核对旧录",
      action: { kind: "oldRecord" },
    });
  if (selected.value === "teaching" && g.value.practice)
    for (const choice of teachingExercises[g.value.practice.topic][g.value.practice.step].choices)
      list.push({label: choice.label, action:{kind:"practice",move:choice.move}});
  if (selected.value === "teaching" && !g.value.practice)
    for (const [topic, label] of [
      ["method", "演示旧法滞涩，问接续之法"],
      ["spirit", "记录潮压散神，问护神之法"],
      ["pill", "摊开药性记录，问成丹缺口"],
      ["ground", "画出灵流缺口，问灵地与护持"],
    ] as const)
      if (!g.value.teachings.includes(topic))
        list.push({
          label,
          action: {
            kind: "ask",
            topic,
            source: props.place === "conclave" ? "seat" : "public",
          },
        });
  if (selected.value === "rubbings" && g.value.rubbings.length < 2)
    for (const [recipient, label] of [
      ["chengyuan", "交澄渊维护拓本 · 换护持批注"],
      ["hengxuan", "交衡璇测阵拓本 · 换勘路批注"],
      ["zhaoshuang", "交照霜原卷拓页 · 换传承核对"],
      ["retain", "自留药息拓本 · 问药理省一月核验"],
    ] as const)
      if (!g.value.rubbings.includes(recipient))
        list.push({ label, action: { kind: "rubbing", recipient } });
  if (selected.value === "letters")
    list.push({ label: "收阅驿使带来的消息", action: { kind: "companion" } });
  return list.map((row) => ({
    ...row,
    quote: goldenStoryQuote(props.game, row.action),
  }));
});
const exercise = computed(() => g.value.practice ? teachingExercises[g.value.practice.topic][g.value.practice.step] : null);
const cooperation = computed(() => goldenCooperation(props.game));
</script>
<template>
  <NarrativeStage
    class="golden-story"
    :class="{'teacher-present':teacherPresent}"
    :image="
      tide
        ? '/art/world-story/golden/tide-dike-council.webp'
        : '/art/important-scenes/dao-demonstration.webp'
    "
    :title="
      place === 'home'
        ? '凝丹后 · 问路'
        : tide
          ? '古渡旁 · 潮堤议事'
          : place === 'conclave'
            ? '诸宗会 · 问法席'
            : '古渡 · 公开论法处'
    "
    :stage-key="`golden-story-${place}`"
    :hotspots="hotspots"
    :active="selected"
    :goal="
      tide
        ? '读潮尺、测回流，按分工复测后，再回古渡决定潮图是否公开。'
        : '将修行中的疑处带到石案前，亲手试过，再问前路。'
    "
    @select="$event === 'exit' ? emit('close') : (selected = $event)"
    @close="selected = ''"
  >
    <template #world
      ><img v-if="teacherPresent" class="teaching-elder" :class="{'demonstrating':!!g.practice,'responding':g.practice?.step===1}" src="/art/review-fixes/shen-guanwei-teaching-v1.webp" alt="沈观微站在问法席旁，持卷向你示意" /><img v-if="g.practice && !tide" class="teaching-hero" :src="characterArt(heroArt(game.social.gender,game.realm),'guard')" alt="你在石案旁演法" /><div v-if="g.practice && !tide" class="practice-table" :class="[`practice-${g.practice.topic}`, `step-${g.practice.step}`]" aria-live="polite">
        <span class="practice-title">{{ exercise?.title }}</span>
        <div class="practice-diagram" aria-hidden="true"><i></i><i></i><i></i></div>
        <span>{{ exercise?.visual }} · {{ g.practice.step === 0 ? '初试' : '续试' }}</span>
      </div><img v-if="tide" class="tide-person gu-figure" src="/art/conclave/gu-cangyao-v1.webp" alt="顾沧遥守在潮堤旁" /><img v-if="tide" class="tide-person ye-figure" src="/art/conclave/ye-wenling-v1.webp" alt="叶问苓在图台旁校图" /><span v-if="tide" class="named-person gu">顾沧遥 · 守堤</span
      ><span v-if="tide" class="named-person ye">叶问苓 · 校图</span></template
    >
    <template #status
      ><span v-if="tide"
        >测读 {{ g.observations.length }}/2 · 分工
        {{
          g.duty === "ward" ? "护堤" : g.duty === "survey" ? "校图" : "未定"
        }}</span
      ><span v-else
        >问法 {{ g.teachings.length }}/4 · 已分拓本
        {{ g.rubbings.length }}/2</span
      ></template
    >
    <p v-if="selected === 'direction'">
      听松旧册只录到凝丹一篇。后面的路，还须带着这些缺页去外海问一问。
    </p>
    <p v-if="selected === 'duty'">
      顾沧遥须保药船，叶问苓要校旧图。读完两处刻度，再选一项分工；各备所需，复测一月。
    </p>
    <p v-if="selected === 'record'">
      旧主人研究的是潮息与护体。先把法宝和功法用过，再辨旧录能证明什么。
    </p>
    <p v-if="selected === 'teaching'">
      {{ g.practice ? exercise?.clue : "石案旁留着四件试法之物：双流玉盘、听潮石、分药盏与护关阵盘。先说清自己的疑处，再择一件亲试。" }}
    </p>
    <p v-if="selected === 'rubbings'">
      原页灵纹每拓一次便消退一层，只能留下两份完整印痕；抄字留不住其中药息与潮势。每方至多一份，分出后不追回。自留药息拓本可在问成丹缺口时省一月核验，仍须完成两步亲习。原有宝物、法门与灵髓由你收好。
    </p>
    <p v-if="selected === 'letters' && !companionNews(game)">
      尚无相识旧友的来信。
    </p>
    <details v-if="selected === 'letters' && companionLetterArchive(game).length">
      <summary>已收来信与旧笺落款</summary>
      <p v-for="letter in companionLetterArchive(game)" :key="letter.month">第{{ letter.month }}月 · {{ letter.text }}</p>
    </details>
    <div
      v-for="row in rows"
      :key="JSON.stringify(row.action)"
      class="story-choice"
    >
      <button
        :disabled="busy || !!row.quote.error"
        @click="emit('act', { type: 'goldenStory', action: row.action })"
      >
        {{ row.label }}</button
      ><small
        >{{ row.quote.months }} 月 · 灵石 {{ row.quote.stones }} · 灵草
        {{ row.quote.herbs
        }}<template v-if="row.quote.error">
          · {{ row.quote.error }}</template
        ></small
      >
    </div>
    <p
      v-if="
        selected === 'teaching' &&
        (cooperation.harbor || cooperation.charts || cooperation.frost)
      "
    >
      传讲者认出你带来的旧批注：“前事已有凭据，这一处便不必重新核验了。”
    </p>
    <details v-if="selected === 'teaching' && g.teachings.length">
      <summary>已问过的批注</summary>
      <p v-for="topic in g.teachings" :key="topic">{{ teachingText[topic] }}</p>
    </details>
    <p v-if="g.last" role="status">{{ g.last }}</p>
    <template #notes
      ><p>
        潮堤：{{ g.tideComplete ? "已完成实测" : "未完成实测" }}；旧录：{{
          g.oldRecord ? "已以实际修行核对" : "尚未核对"
        }}。
      </p>
      <p>
        护持批注：{{ cooperation.harbor ? "已获" : "无" }}；勘路批注：{{
          cooperation.charts ? "已获" : "无"
        }}；照霜核对：{{ cooperation.frost ? "已约" : "无" }}。
      </p>
      <p v-if="g.rubbings.includes('retain')">自留药息拓本：问成丹缺口省一月核验。</p>
      <p>{{ g.last }}</p></template
    >
  </NarrativeStage>
</template>
<style scoped>
.story-choice {
  margin: 12px 0;
}
.story-choice button {
  padding: 10px 14px;
  display: block;
  background: #25443d;
  color: #fff1cf;
  border: 1px solid #b8a777;
  border-radius: 5px;
  text-align: left;
}
.story-choice button:disabled {
  opacity: 0.55;
}
.story-choice small {
  display: block;
  color: #e0ceaa;
  margin-top: 5px;
}
.named-person {
  position: absolute;
  padding: 8px 12px;
  background: #142d29dd;
  border: 1px solid #d0b879;
  color: #ffedc8;
}
.gu {
  left: 47%;
  top: 66%;
}
.ye {
  left: 36%;
  top: 69%;
}
.golden-story :deep(.scene-landscape) {
  background-size: 100% 100%;
}
.golden-story :deep(.narrative-inspector:not(.narrative-notes)) {
  width: min(430px, 36%);
  top: auto;
  bottom: 20px;
  height: auto;
  max-height: 54%;
}
 .tide-person{position:absolute;bottom:18%;height:48%;width:20%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 10px 8px #0008);pointer-events:none}
.gu-figure{left:42%}.ye-figure{left:28%}
</style>

<style scoped>
.teaching-hero{position:absolute;left:44%;bottom:14%;height:50%;width:18%;object-fit:contain;filter:drop-shadow(0 10px 8px #0008)}
.practice-table{position:absolute;left:19%;top:29%;width:35%;height:42%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff0c9;background:radial-gradient(ellipse,#163b3bd9,#101c2388 65%,transparent 72%);text-shadow:0 2px 5px #000;pointer-events:none}
.practice-title{font-size:1.25rem;letter-spacing:.16em}.practice-diagram{position:relative;width:76%;height:58%;display:flex;align-items:center;justify-content:center;gap:10%}.practice-diagram i{display:block;width:25%;height:60%;border:3px solid #dfc587;border-radius:50%;box-shadow:0 0 18px #70e6df88;background:#28505c55;transition:transform .6s,border-color .6s,background .6s}
.practice-diagram i:nth-child(3){display:none}.practice-method.step-1 .practice-diagram i{transform:translateX(20%) rotate(45deg);border-color:#81e6ce}.practice-method.step-1 .practice-diagram i:nth-child(2){transform:translateX(-20%) rotate(-45deg)}
.practice-spirit .practice-diagram i:first-child{width:13%;height:25%;background:#fcebb7}.practice-spirit .practice-diagram i:nth-child(2){position:absolute;width:75%;height:95%;border-style:dashed}.practice-spirit.step-1 .practice-diagram i:nth-child(2){border-style:solid;border-color:#78d4c9}
.practice-pill .practice-diagram i{border-radius:8% 8% 45% 45%;background:linear-gradient(#718578 45%,#99c6b0 46%)}.practice-pill.step-1 .practice-diagram i{background:linear-gradient(#8b908077 20%,#b5dbbd 24%)}
.practice-ground .practice-diagram i{border-radius:12%;transform:rotate(45deg);border-style:dashed}.practice-ground.step-1 .practice-diagram i{border-style:solid;border-color:#7fddce}
@media(prefers-reduced-motion:reduce){.practice-diagram i{transition:none}}
</style>

<style scoped>
.teaching-elder{position:absolute;left:16%;bottom:12%;height:62%;width:24%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 10px 8px #0007);pointer-events:none;transition:filter .4s ease}
.teaching-elder.demonstrating{filter:drop-shadow(0 10px 8px #0007) drop-shadow(0 0 9px #83d8cb55)}
.teaching-elder.responding{filter:drop-shadow(0 10px 8px #0007) drop-shadow(0 0 12px #e2ca8766)}
.teacher-present .practice-table{left:36%;top:40%;width:23%;height:31%}
@media(prefers-reduced-motion:reduce){.teaching-elder{transition:none}}
</style>
