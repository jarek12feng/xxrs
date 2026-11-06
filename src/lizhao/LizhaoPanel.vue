<script setup lang="ts">
import { mortalWarning } from "../mortality";
import {revisitView} from "../world-revisits/projection";
import RevisitPanel from "../world-revisits/RevisitPanel.vue";
import AssayPanel from "./AssayPanel.vue";
import ArtifactScene from "../artifact-growth/ArtifactScene.vue";
const artifactOpen=ref(false);
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../core";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import { characterArt, heroBattlePose } from "../presentation/art";
import { foundationPower } from "../foundation-journey/combat";
import { lizhaoOptions } from "./view";
import {
  lizhaoGoal,
  lizhaoQuote,
  lizhaoExchange,
  lizhaoFoe,
  lizhaoTell,
  type LizhaoAction,
} from "./rules";
import { lizhaoMoves } from "./state";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const l = computed(() => props.game.lizhao),
  selected = ref("");
const rows = computed(() => lizhaoOptions(props.game));
const title = computed(
  () =>
    ({
      away: "外海古渡",
      harbor: "离照港",
      outer: "离照外层 · 分潮石道",
      inner: "离照内层 · 定性药池",
      chamber: "离照旧丹室",
      bay: "伏潮湾",
    })[l.value.location],
);
const image = computed(
  () =>
    ({
      away: "/art/outer-sea/ferry.webp",
      harbor: "/art/world-story/golden/tide-dike-council.webp",
      outer: "/art/outer-sea/ruins.webp",
      inner: "/art/outer-sea/inner.webp",
      chamber: "/art/world-story/lizhao/chamber.webp",
      bay: "/art/review-fixes/fuchao-bay.webp",
    })[l.value.location],
);
const points = computed(() => {
  const positions: Record<string, [number, number]> =
    l.value.location === "chamber"
      ? { furnace: [70, 36], exit: [15, 35] }
      : l.value.location === "bay"
        ? { opponent: [58, 66], exit: [12, 43] }
        : l.value.location === "harbor"
          ? {
              friends: [48, 57],
              supplies: [21, 73],
              path: [60, 49],
              exit: [14, 43],
            }
          : l.value.location === "inner"
            ? { path: [53, 48], furnace: [67, 49], exit: [15, 65] }
            : { path: [58, 46], exit: [15, 70] };
  return [
    { id: "friends", kind: "person" as const, label: "药船修士与分药台", speaker: "药船修士", actor: "/art/scene-people/lizhao-apothecary-v1.webp", foot: {x:48,y:81}, speech: "药性沾了潮气，不能直接入炉。先辨清它们，再商议各自取用的份额。", x: 46, y: 70 },
    { id: "supplies", label: "药囊与静养处", x: 26, y: 67 },
    { id: "path", label: "前方道路", x: 58, y: 46 },
    { id: "furnace", label: "分药槽与旧丹炉", x: 64, y: 55 },
    { id: "opponent", kind:"person" as const, label: "韩砺舟 · 人族修士", speech: l.value.pursuit === "defeated" ? "这场是我输了。你要如何了结，说吧。" : "那份药材的账，我们还没说清楚。", x: 64, y: 69 },
    { id: "exit", label: "归港航路", x: 12, y: 76 },
  ].map((p) => ({
    ...p,
    x: positions[p.id]?.[0] ?? p.x,
    y: positions[p.id]?.[1] ?? p.y,
  }));
});
const foeArt = computed(() =>
  l.value.duel?.kind === "han" || l.value.location === "bay"
    ? "/art/review-fixes/han-lizhou.webp"
    : characterArt(
        "golem",
        l.value.duel?.effect === "strike"
          ? "hurt"
          : l.value.duel?.effect
            ? "attack"
            : "idle",
      ),
);
const revisit = computed(()=>l.value.location==='harbor' ? revisitView(props.game,'lizhao') : null);
const hotspots = computed(() =>
  l.value.duel
    ? []
    : [...points.value.filter((p) => (p.id === 'furnace' && l.value.location === 'chamber') || rows.value.some((r) => r.object === p.id)), ...(revisit.value?[{id:'revisit',label:revisit.value.title,x:55,y:66}]:[])],
);
const visible = computed(() =>
  rows.value.filter((r) => r.object === selected.value),
);
watch(
  () => l.value.location,
  () => (selected.value = ""),
);
watch(
  () => rows.value.map((r) => r.object).join(","),
  () => {
    if (selected.value!=='revisit' && !(selected.value === 'furnace' && l.value.location === 'chamber') && !rows.value.some((r) => r.object === selected.value))
      selected.value = "";
  },
);
function send(action: LizhaoAction) {
  if (!props.busy && !lizhaoQuote(props.game, action).error)
    emit("act", { type: "lizhao", action });
}
const combatOptions = computed(() =>
  lizhaoMoves.map((move) => {
    const p = lizhaoExchange(props.game, move);
    return {
      id: move,
      label: { guard: "守势护丹", strike: "破枢反击", discern: "辨影排毒" }[
        move
      ],
      detail: p
        ? `伤害 ${p.damage} / 承伤 ${p.incoming} / 回气 ${p.healing} / 灵草 ${p.herbs} / 积毒 ${p.toxin}${l.value.duel && l.value.duel.kind !== "outer" ? mortalWarning(l.value.duel, p, 18, p.toxin >= 100) : ""}`
        : "",
      disabled: !!lizhaoQuote(props.game, { kind: "move", move }).error,
    };
  }),
);
function move(id: string) {
  const m = lizhaoMoves.find((v) => v === id);
  if (m) send({ kind: "move", move: m });
}
const hero = computed(() =>
  characterArt(
    props.game.social.gender === "female" ? "hero-female" : "hero-male",
    heroBattlePose(l.value.duel?.effect),
  ),
);
</script>
<template>
  <ArtifactScene v-if="artifactOpen || game.itemGrowth.golden.duel" :game="game" :busy="busy" @act="emit('act',$event)" @close="artifactOpen=false"/>
  <NarrativeStage v-else
    class="lizhao-stage"
    :image="image"
    :title="title"
    :goal="lizhaoGoal(game)"
    :body="l.last"
    :stage-key="`lizhao-${l.location}`"
    :hotspots="hotspots"
    :active="selected"
    :battle="!!l.duel"
    :battle-inspector="false"
    @select="selected = $event"
    @close="selected = ''"
  >
    <template #world>
      <img class="lizhao-hero" :src="hero" :alt="game.name" />
      <div
        v-if="l.duel?.kind === 'outer'"
        class="tide-array"
        :key="`array-${l.duel.turn}`"
        :class="l.duel.effect"
        role="img"
        aria-label="分潮禁阵的三重潮纹"
      >
        <i></i><i></i><i></i><span>分潮阵眼</span>
      </div>
      <figure
        v-else-if="l.duel || l.location === 'bay'"
        class="lizhao-enemy"
        :key="`foe-${l.duel?.turn ?? 0}`"
        :class="l.duel?.effect"
      >
        <img
          :src="foeArt"
          :alt="l.duel ? lizhaoFoe(l.duel.kind).name : '韩砺舟持刀守在礁前'"
        />
        <figcaption>
          {{ l.duel ? lizhaoFoe(l.duel.kind).name : "韩砺舟" }}
        </figcaption>
      </figure>
      <div
        v-if="l.duel?.effect"
        :key="`effect-${l.duel.turn}`"
        class="lizhao-exchange"
        :class="l.duel.effect"
        aria-hidden="true"
      ></div>
      <span v-if="l.outerCleared && l.location === 'outer'" class="settled-cue"
        >分潮石道已开</span
      >
      <span v-if="l.cleared && l.location === 'inner'" class="settled-cue"
        >药株已封瓶 · 旧丹室可通行</span
      >
      <span
        v-if="l.recipeVerified && l.location === 'chamber'"
        class="settled-cue"
        >分潮、定性药理已验证</span
      >
      <CombatBar
        v-if="l.duel"
        :turn="l.duel.turn"
        :player="l.duel.hp"
        :player-max="
          foundationPower(game).hp + (l.route === 'cooperate' ? 16 : 0)
        "
        :enemy="l.duel.enemy"
        :enemy-max="lizhaoFoe(l.duel.kind).hp"
        :enemy-name="lizhaoFoe(l.duel.kind).name"
        :tell="lizhaoTell(game)"
        :options="combatOptions"
        :busy="busy"
        retreat-label="撤回港口 · 不加伤、不丢材料"
        @move="move"
        @retreat="send({ kind: 'withdraw' })"
      >
        <template #preparation
          ><p>
            <span class="combat-receipt" role="status">{{ l.last }}</span>
            积毒 {{ l.duel.toxin }} / 100 ·
            {{ l.duel.kind === "outer" ? "外层败退伤势 +2，材料与已开道路保留。" : "气势耗尽或积毒100会陨落，同归于尽亦然；可出招前主动撤离。" }}
            辨影排毒开路、守势蓄力，趁开口反击。十八合仍能自持则伤退。
          </p></template
        >
      </CombatBar>
    </template>
    <template #status
      ><small
        >定性辅药 {{ l.reagent }} 份 ·
        {{ l.recipeVerified ? "丹方已验证" : "丹方待验证" }}</small
      ></template
    >
    <template #notes
      ><p>
        离照洞天用于分离潮毒、稳定药性。药瓶中的辅药用于化婴丹；首通后的港口轮取每次仍需年月、工钱与排毒药。
      </p></template
    >
    <p v-if="l.duel">{{ l.last }}</p>
    <template v-else
      ><p>{{ l.last }}</p>
      <RevisitPanel v-if="l.location==='harbor' && selected==='revisit'" :game="game" site="lizhao" :busy="busy" @act="emit('act',$event)"/>
      <AssayPanel v-if="l.location==='chamber' && selected==='furnace'" :assay="l.assay" :verified="l.recipeVerified" />
      <button v-if="l.location==='harbor' && (selected==='friends'||selected==='supplies')" @click="artifactOpen=true">旧器谱与器室侧路 · 法宝温养</button>
      <div v-for="row in visible" :key="row.id" class="lizhao-choice">
        <button :disabled="busy || !row.available" @click="send(row.action)">
          {{ row.label }}</button
        ><small
          >{{ row.months ? `${row.months} 月 · ` : "" }}灵石
          {{ row.quote.stones }} · 灵草 {{ row.quote.herbs }}</small
        >
        <p v-if="row.error">{{ row.error }}</p>
      </div></template
    >
  </NarrativeStage>
</template>
<style scoped>
.combat-receipt {
  display: block;
  margin-bottom: 4px;
}
.lizhao-hero {
  position: absolute;
  left: 23%;
  bottom: 15%;
  height: 45%;
  width: 19%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 12px 10px #0009);
}
.lizhao-enemy {
  position: absolute;
  left: 49%;
  bottom: 28%;
  width: 26%;
  height: 46%;
  margin: 0;
  text-align: center;
  filter: drop-shadow(0 12px 10px #0009);
}
.lizhao-enemy img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
}
.lizhao-enemy figcaption {
  position: absolute;
  bottom: 0;
  left: 15%;
  right: 15%;
  padding: 5px;
  background: #182e27df;
  color: #f3dfb4;
  font-size: 13px;
}
.lizhao-enemy.strike {
  animation: foe-recoil 0.65s ease-out;
}
.lizhao-enemy.guard,
.lizhao-enemy.discern {
  animation: foe-advance 0.65s ease-out;
}
.tide-array {
  position: absolute;
  left: 49%;
  bottom: 30%;
  width: 26%;
  height: 40%;
  color: #abd8d6;
}
.tide-array i {
  position: absolute;
  inset: 10%;
  border: 5px double currentColor;
  border-radius: 50%;
  transform: rotateX(30deg);
  box-shadow:
    0 0 22px #a7ddd666,
    inset 0 0 25px #a7ddd644;
}
.tide-array i + i {
  inset: 24%;
  transform: rotate(25deg);
  border-radius: 20%;
}
.tide-array i + i + i {
  inset: 36%;
  transform: rotate(45deg);
  border-radius: 10%;
}
.tide-array span {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  background: #182e27df;
  padding: 5px;
  font-size: 13px;
}
.tide-array.discern {
  color: #dcca84;
}
.tide-array.strike {
  animation: foe-recoil 0.65s ease-out;
}
.lizhao-exchange {
  position: absolute;
  left: 30%;
  bottom: 35%;
  width: 33%;
  height: 25%;
  border-top: 3px solid #ebd299;
  transform: rotate(-15deg);
  animation: exchange-fade 0.7s both;
  filter: drop-shadow(0 0 8px #eed69b);
}
.lizhao-exchange.guard {
  left: 25%;
  width: 17%;
  height: 32%;
  border: 3px double #b1e7d0;
  border-radius: 50%;
  transform: none;
}
.lizhao-exchange.discern {
  border-top-style: dashed;
  border-color: #b6dfe5;
}
.lizhao-stage.in-combat .lizhao-hero {
  bottom: 28%;
}
.lizhao-stage :deep(.combat-bar p) {
  font-size: 12px;
  line-height: 1.5;
  margin: 6px 0;
}
@keyframes foe-recoil {
  35% {
    transform: translateX(12px);
    filter: brightness(1.4);
  }
  100% {
    transform: none;
  }
}
@keyframes foe-advance {
  40% {
    transform: translateX(-12px);
  }
  100% {
    transform: none;
  }
}
@keyframes exchange-fade {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lizhao-enemy,
  .tide-array,
  .lizhao-exchange {
    animation: none !important;
  }
  .lizhao-exchange {
    display: none;
  }
}
.settled-cue {
  position: absolute;
  left: 34%;
  top: 43%;
  padding: 10px 18px;
  background: #163d2be6;
  border: 1px solid #bba363;
  color: #fff2c9;
}
.lizhao-choice {
  display: grid;
  gap: 5px;
  margin-bottom: 16px;
}
.lizhao-choice p {
  margin: 0;
}
.lizhao-choice button {
  text-align: left;
}
.lizhao-choice small {
  font-size: 12px;
}
@media (min-width: 901px) and (max-height: 800px) {
  .lizhao-stage.in-combat .lizhao-hero,
  .lizhao-stage.in-combat .lizhao-enemy {
    bottom: 34%;
    height: 42%;
  }
}
@media (max-width: 900px) {
  .lizhao-hero {
    height: 34%;
    bottom: 29%;
    left: 14%;
  }
  .lizhao-enemy {
    bottom: 47%;
    left: 48%;
    font-size: 13px;
  }
  .settled-cue {
    left: 20%;
    top: 44%;
    font-size: 12px;
  }
}
</style>
