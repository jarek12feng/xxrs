<script setup lang="ts">
import WalkingActor from "../scene2d/WalkingActor.vue";
import { useSceneApproach } from "../scene2d/use-scene-approach";
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../core";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import { heroArt } from "../presentation/art";
import { goldenStoryQuote } from "../golden-story/rules";
import {
  reunionAvailable,
  reunionSupport,
  reunionAbility,
  approachNames,
  type ReunionAction,
} from "./index";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const selected = ref("");
const r = computed(() => props.game.goldenStory.reunion);
const present = computed(
  () =>
    reunionAvailable(props.game) &&
    !["none", "invited", "departed"].includes(r.value.stage),
);
const goal = computed(
  () =>
    ({
      none: "托驿使约在古渡相见，手头的事可先做妥。",
      invited: "循绳尺上的新记号，到古渡石台与苏婉宁会面。",
      met: "她要复测药路，你可借侧堤的潮势检验新法。商议彼此能承担的分工。",
      planned: "完成约定的侧堤实测。水下落点被侧浪遮住，绳尺和已学本领各有用处。",
      anchored: "归绳已系紧，侧浪正在回落。你们可以分头接住这一段潮势。",
      resolved: "实测已成。安全落点和完整底图，公开到哪一步，由两人商议。",
      shared: "实测批注已经分定，你们还有各自的下一程。",
      departed: "苏婉宁已往下游复测。古渡信路仍通，此处留下你们共同的测读。",
    })[r.value.stage],
);
const walkReady=ref(false);
const approach=useSceneApproach({animated:()=>walkReady.value && props.game.social.gender==='male',initial:{x:25,y:83}});
function select(id:string) {
 approach.cancel();
 if(id==='exit'){emit('close');return;}
 selected.value='';
 const target=id==='tide'?{x:52,y:83,face:64}:{x:27,y:83,face:39};
 approach.walkTo({x:target.x,y:target.y},()=>{selected.value=id;},target.face);
}
watch(present,()=>{approach.cancel();});
const rows = computed(() => {
  const list: { label: string; action: ReunionAction }[] = [];
  const add = (label: string, action: ReunionAction) =>
    list.push({ label, action });
  if (selected.value === "person") {
    if (r.value.stage === "none")
      add("托驿使回信 · 约在古渡", { kind: "invite" });
    if (r.value.stage === "invited") add("循新记号相见", { kind: "meet" });
    if (["met", "planned"].includes(r.value.stage))
      for (const approach of ["ward", "survey", "edge"] as const)
        add(
          `${approachNames[approach]} · ${reunionSupport(props.game, approach) || "普通绳尺可行，布锚需两月"}`,
          { kind: "plan", approach },
        );
    if (r.value.stage === "resolved") {
      add("公开安全落点 · 得灵草4，私修批注自留", {
        kind: "share",
        sharing: "public",
      });
      add("暂留完整底图 · 得灵石8，先告知险点", {
        kind: "share",
        sharing: "private",
      });
    }
    if (r.value.stage === "shared")
      add("互留信路，各赴前程", { kind: "depart" });
  }
  if (selected.value === "tide") {
    if (r.value.stage === "planned") {
      add("先系归绳，合力布锚", { kind: "anchor" });
      add(reunionAbility[r.value.approach!].label, { kind: "useAbility" });
    }
    if (r.value.stage === "anchored")
      add("沿侧堤实测 · 先确认归绳已稳", { kind: "cross" });
  }
  return list.map((row) => ({
    ...row,
    quote: goldenStoryQuote(props.game, {
      kind: "reunion",
      action: row.action,
    }),
  }));
});
</script>
<template>
  <NarrativeStage
    class="reunion-scene"
    image="/art/world-story/golden/tide-dike-council.webp"
    title="古渡侧堤 · 故人重逢"
    stage-key="golden-reunion"
    :goal="goal"
    :active="selected"
    :hotspots="[
      {
        id: 'person',
        label: present
          ? '苏婉宁 · 药路新图'
          : r.stage === 'departed'
            ? '留下的共同批注'
            : '绳尺与古渡信路',

        x: 38,
        y: 64,
      },
      { id: 'tide', label: '侧堤归绳与水尺', x: 64, y: 57 },
      { id: 'exit', label: '回古渡 · 可暂缓后续', x: 88, y: 52 },
    ]"
    @select="select"
    @close="selected = ''; approach.cancel()"
  >
    <template #world>
<button v-if="approach.moving.value" class="approach-skip" @click="approach.skip()">略过走近</button>
<WalkingActor class="reunion-hero" :character="heroArt(game.social.gender,game.realm)" :label="game.name" :position="approach.position.value" :moving="approach.moving.value" :frame="approach.frame.value" :facing="approach.facing.value" sheet="/art/scene2d/foundation-walk/hero-male-v1.png" @ready="walkReady=$event" />

      <img
        v-if="present"
        class="reunion-partner"
        src="/art/companionship/shentinglan-work.webp"
        alt="苏婉宁在侧堤校图"
      />
      <div
        class="tide-mark"
        :class="{
          anchored: ['anchored', 'resolved', 'shared', 'departed'].includes(
            r.stage,
          ),
        }"
        aria-hidden="true"
      >
        <i></i><i></i><i></i>
      </div>
    </template>
    <template #status
      ><span
        >{{ r.approach ? `分工：${approachNames[r.approach]}` : "分工未定" }} ·
        {{
          r.sharing === "public"
            ? "安全落点已公开"
            : r.sharing === "private"
              ? "完整底图暂留"
              : "成果待议"
        }}</span
      ></template
    >
    <p v-if="selected === 'tide'">
      {{ goal }} 离开现场会保留已完成的测读与归绳，重返古渡可继续。
    </p>
    <p v-if="r.last" role="status">{{ r.last }}</p>
    <div
      v-for="row in rows"
      :key="JSON.stringify(row.action)"
      class="reunion-choice"
    >
      <button
        :disabled="busy || !!row.quote.error"
        @click="
          emit('act', {
            type: 'goldenStory',
            action: { kind: 'reunion', action: row.action },
          })
        "
      >
        {{ row.label }}</button
      ><small
        >{{ row.quote.months }}月<template v-if="row.quote.herbs"> · 灵草 {{ row.quote.herbs }}</template><template v-if="row.quote.error">
          · {{ row.quote.error }}</template
        ></small
      >
    </div>
    <p v-if="selected === 'person' && ['met', 'planned'].includes(r.stage)">
      布锚后再实测需一月。实测批注可用于相应问法：稳流问护持、辨影问护神、破桩问运法。省去一月核验与首段重复练习，直接亲试下一层。
    </p>
    <template #notes
      ><p>{{ r.last }}</p>
      <p>此约不改变恋爱或结契关系。各自修行时，未完的测读仍保留。</p></template
    >
  </NarrativeStage>
</template>
<style scoped>
.reunion-hero,
.reunion-partner {
  position: absolute;
  bottom: 17%;
  height: 56%;
  width: 20%;
  object-fit: contain;
  object-position: bottom;
  pointer-events: none;
  filter: drop-shadow(0 10px 8px #0008);
}
.reunion-hero {
  left: 15%;
}
.reunion-partner {
  left: 29%;
  transform:scaleX(-1);
}
.tide-mark {
  position: absolute;
  left: 52%;
  top: 63%;
  width: 20%;
  height: 10%;
  border-bottom: 3px dashed #c9c393;
  transform: rotate(-10deg);
  pointer-events: none;
  display: flex;
  justify-content: space-between;
}
.tide-mark i {
  height: 100%;
  border-left: 4px solid #a5a17e;
}
.tide-mark.anchored {
  border-bottom-style: solid;
  border-color: #b5edd7;
}
.reunion-choice {
  margin: 12px 0;
}
.reunion-choice button {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  color: #fff1cf;
  background: #25443d;
  border: 1px solid #b8a777;
  border-radius: 4px;
}
.reunion-choice small {
  display: block;
  margin-top: 4px;
  color: #e0ceaa;
}
.reunion-choice button:disabled {
  opacity: 0.55;
}
.reunion-hero { bottom:auto; width:20%; height:56%; transform:translate(-50%,-100%); }
.reunion-hero :deep(.character-sprite) { width:100%;height:100%;min-height:0; }
.approach-skip{position:absolute;top:18%;left:42%;z-index:9;pointer-events:auto}
</style>
