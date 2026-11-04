<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../core";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import WalkingActor from "../scene2d/WalkingActor.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import { useSceneApproach } from "../scene2d/use-scene-approach";
import { heroArt } from "../presentation/art";
import { readiness } from "../combat/game";
import { moves, type Move } from "../expedition/content";
import {
  qiNarrativeDestinations,
  qiNarrativeQuote,
  qiNarrativeGoal,
  qiNarrativeEnemy,
  qiNarrativePreview,
  qiNarrativeTell,
  type QiNarrativeAction,
} from "./narrative";
import QiOrigin from "./QiOrigin.vue";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const n = computed(() => props.game.qiJourney.narrative);
const place = computed(() => qiNarrativeDestinations[n.value.location]);
const active = ref("");
const walkReady = ref(false);
const walk = useSceneApproach({
  animated: () =>
    props.game.realm === 0 &&
    props.game.social.gender === "male" &&
    walkReady.value,
  initial: { x: 30, y: 84 },
});
const enemy = computed(() => qiNarrativeEnemy(props.game));
const points = computed(() =>
  n.value.duel
    ? []
    : n.value.location === "home"
      ? [
          { id: "teacher", label: "药队与温蘅", x: 27, y: 55 },
          { id: "home", label: "家中药囊与家书", x: 43, y: 75 },
          { id: "road", label: "石涧与青嶂支路", x: 75, y: 65 },
        ]
      : n.value.location === "cave"
        ? [
            { id: "companion", label: "卢雁回的约定", x: 26, y: 69 },
            { id: "bed", label: "废药床与旧阵", x: 43, y: 51 },
            { id: "table", label: "药性处置台", x: 56, y: 54 },
            { id: "notes", label: "额外札记", x: 69, y: 48 },
            { id: "exit", label: "右侧退路", x: 85, y: 65 },
          ]
        : [
            {
              id: "rival",
              label:
                n.value.pursuit === "defeated" ? "弃刀的段厉" : "截路的段厉",
              x: 58,
              y: 58,
            },
            { id: "exit", label: "预留退路", x: 20, y: 73 },
          ],
);
function select(id: string) {
  if (props.busy || props.game.pending || n.value.duel) return;
  const p = points.value.find((p) => p.id === id);
  active.value = "";
  walk.walkTo({ x: Math.min(75, Math.max(25, p?.x ?? 35)), y: 84 }, () => {
    active.value = id;
  });
}
function act(action: QiNarrativeAction) {
  if (props.busy || qiNarrativeQuote(props.game, action).error) return;
  walk.cancel();
  emit("act", { type: "qiJourney", action });
}
const labels: Partial<Record<QiNarrativeAction, string>> = {
  "origin:sect": "问药队与听松宗",
  "origin:letter": "写信告知凝元经过",
  "origin:entrust": "请药队传话",
  "cave:depart": "沿药路前往石涧 · 120里",
  "cave:return": "沿退路回山下 · 已含返程",
  "cave:together": "与卢雁回互守退路",
  "cave:alone": "谢过线索，独自行险",
  "cave:prepare:medicine": "配药诱引 · 灵草2",
  "cave:prepare:body": "护体过阵 · 灵石4",
  "cave:prepare:array": "刻录阵路 · 神识8、心得2",
  "cave:mark": "系绳试路，留出退路",
  "cave:challenge": "亲自踏入逆流阵",
  "cave:process:separate": "分离燥烈药气",
  "cave:process:balance": "逐次调匀药性",
  "cave:apply": "用药液逆流调息 · 灵草2 / 一月",
  "cave:notes:share": "分抄札记，各留所得",
  "cave:notes:leave": "留下札记，只带核心所学",
  "cave:notes:claim": "独占额外札记 · 将引出截夺风险",
  "ambush:depart": "前往青嶂支路处置风险 · 90里",
  "ambush:return": "沿退路脱身 · 本次争端止于此",
  "ambush:yield": "放下额外札记，保留核心所学",
  "ambush:escort": "依守退路之约，结伴走正路",
  "ambush:fight": "设伏迎战 · 可败退 / 伤势+1",
  "ambush:capture": "擒送护路执事",
  "ambush:release": "收下止争回执，放其离开",
};
const available = computed<QiNarrativeAction[]>(() => {
  if (n.value.duel) return [];
  switch (active.value) {
    case "teacher":
      return ["origin:sect"];
    case "home":
      return ["origin:letter", "origin:entrust"];
    case "road":
      return n.value.pursuit === "warned"
        ? ["cave:depart", "ambush:depart"]
        : ["cave:depart"];
    case "companion":
      return ["cave:together", "cave:alone"];
    case "bed":
      return [
        "cave:prepare:medicine",
        "cave:prepare:body",
        "cave:prepare:array",
        "cave:challenge",
      ];
    case "table":
      return ["cave:process:separate", "cave:process:balance", "cave:apply"];
    case "notes":
      return ["cave:notes:share", "cave:notes:leave", "cave:notes:claim"];
    case "exit":
      return n.value.location === "cave"
        ? ["cave:mark", "cave:return"]
        : ["ambush:return"];
    case "rival":
      return n.value.pursuit === "defeated"
        ? ["ambush:capture", "ambush:release"]
        : ["ambush:yield", "ambush:escort", "ambush:fight"];
    default:
      return [];
  }
});
const choices = computed(() =>
  available.value.map((action) => ({
    action,
    label: labels[action],
    ...qiNarrativeQuote(props.game, action),
  })),
);
const combatOptions = computed(() =>
  Object.entries(moves).map(([id, label]) => {
    const p = qiNarrativePreview(props.game, id as Move);
    return {
      id,
      label,
      disabled: props.busy,
      detail: `伤害 ${p?.damage} · 承伤 ${p?.incoming} · 回气 ${p?.healing} · 耗草 ${p?.herbs}`,
    };
  }),
);
watch(
  () => n.value.location,
  () => {
    active.value = "";
    walk.reset({ x: 30, y: 84 });
  },
);
watch(
  () => n.value.phase,
  () => {
    if (!n.value.duel && ["won", "processed"].includes(n.value.phase))
      active.value = "table";
  },
);
watch(
  () => n.value.pursuit,
  () => {
    if (n.value.pursuit === "defeated") active.value = "rival";
  },
);
watch(
  () => props.busy || !!props.game.pending || props.game.status !== "alive",
  (locked) => {
    if (locked) walk.cancel();
  },
);
</script>
<template>
  <NarrativeStage
    class="cave-stage"
    :stage-key="`qi-narrative-${n.location}`"
    :image="place.image"
    :title="place.name"
    :goal="
      n.location === 'home'
        ? '问清山门与药路，再为自己的凝元前路做准备。'
        : qiNarrativeGoal(game)
    "
    :hotspots="points"
    :active="active"
    :battle="!!n.duel"
    @select="select"
    @close="
      active = '';
      walk.cancel();
    "
  >
    <template #status
      ><span
        >灵草 {{ game.herbs }} · 灵石 {{ game.stones }} · 伤势
        {{ game.injury }}</span
      ></template
    >
    <template #world>
      <WalkingActor
        :character="heroArt(game.social.gender, game.realm)"
        :label="game.name"
        :position="walk.position.value"
        :moving="walk.moving.value"
        :frame="walk.frame.value"
        :facing="walk.facing.value"
        :pose="
          n.duel?.effect === 'strike' ? 'attack' : n.duel ? 'guard' : 'idle'
        "
        @ready="walkReady = $event"
      />
      <div
        v-if="n.location === 'cave'"
        class="cave-current"
        :class="{ settled: ['won', 'processed', 'applied'].includes(n.phase) }"
        aria-hidden="true"
      >
        <i></i><i></i><i></i>
      </div>
      <div
        v-if="
          n.location === 'cave' && ['processed', 'applied'].includes(n.phase)
        "
        class="mixture"
        role="status"
      >
        {{
          n.phase === "applied"
            ? "药液已入脉 · 杂气平复"
            : n.mixture === "separated"
              ? "清液已分出 · 待试用"
              : "药性已调匀 · 待试用"
        }}
      </div>
      <div v-if="n.location === 'branch'" class="rival-marker">
        段厉 · {{ n.pursuit === "defeated" ? "弃刀退让" : "持刀截路"
        }}<small>炼气后期 · 只索额外札记</small>
      </div>
      <button v-if="n.location === 'home'" class="back" @click="emit('close')">
        回到山下街口
      </button>
      <button v-if="walk.moving.value" class="skip" @click="walk.skip">
        略过走近
      </button>
      <CombatBar
        v-if="n.duel"
        :turn="n.duel.turn"
        :player="n.duel.hp"
        :player-max="readiness(game).hp"
        :enemy="n.duel.enemy"
        :enemy-max="enemy.hp"
        :enemy-name="enemy.name"
        :tell="qiNarrativeTell(game)"
        :options="combatOptions"
        :busy="busy"
        :retreat-disabled="busy"
        retreat-label="沿退路撤回 · 补给不退"
        @move="act(`narrative:${$event as Move}`)"
        @retreat="act(n.location === 'cave' ? 'cave:return' : 'ambush:return')"
      />
    </template>
    <template #notes
      ><p>
        石涧是废弃育药地，核心所学是处理混杂药性。卢雁回是凭实测线索谋生的炼气散修；她需要额外札记，不会无条件替你闯关。药法与凝元材料分开，缺医术也能凭护体或辨阵通过。
      </p>
      <p>{{ n.last }}</p></template
    >
    <QiOrigin
      v-if="active === 'home'"
      :game="game"
      :busy="busy"
      @act="emit('act', $event)"
    />
    <p v-if="active === 'teacher'">
      药棚下正按运送去向分药。丹堂与剑院同属听松宗；你可以入门，也可以作为散修求教与合作。
    </p>
    <p v-if="active === 'notes'">
      这里只分额外观察札记，不影响核心药法。分抄可让凝元内府伤害+1，保留完整札记则+2，交出札记会失去额外加成。独占会拒绝卢雁回的分抄要求，并招来段厉索取；之前结伴的守退路约定仍保留，但她不会替你打斗。
    </p>
    <p v-if="active === 'bed'">
      药理诱引利于守势护脉、趁药气回落切流；护体直接承压；辨阵在真假流间解除节点。失败伤势+1，保留准备，可回山疗伤重试。
    </p>
    <p v-if="active === 'table'">
      先取得亲身实测，再处理药性。调息用两株灵草、一月检验，恢复至多一层伤势，并让后续凝元内府交锋护甲+1。
    </p>
    <p v-if="n.last" role="status">{{ n.last }}</p>
    <div class="cave-actions">
      <button
        v-for="choice in choices"
        :key="choice.action"
        :disabled="busy || !!choice.error"
        @click="act(choice.action)"
      >
        <strong>{{ choice.label }}</strong
        ><small>{{
          choice.error ||
          (choice.months
            ? `耗时${choice.months}月；到期来信会先中断`
            : "现场行动，不另扣年月")
        }}</small>
      </button>
    </div>
  </NarrativeStage>
</template>
<style scoped>
.cave-stage :deep(.battle-inspector) {
  display: none;
}
.cave-actions {
  display: grid;
  gap: 8px;
}
.cave-actions button {
  padding: 12px;
  text-align: left;
  border: 1px solid #ab9564;
  background: #284c3e;
  color: #f6e8c9;
  cursor: pointer;
}
.cave-actions button:disabled {
  background: #35433d;
  color: #d0d3c7;
  cursor: not-allowed;
}
.cave-actions small {
  display: block;
  margin-top: 5px;
  line-height: 1.5;
}
.cave-stage p {
  line-height: 1.7;
}
.back,
.skip {
  position: absolute;
  left: 25px;
  bottom: 25px;
  padding: 12px;
  background: #17352b;
  color: #f6e8c9;
  border: 1px solid #ab9564;
  pointer-events: auto;
}
.skip {
  left: 36%;
}
.cave-current {
  position: absolute;
  left: 38%;
  top: 46%;
  width: 200px;
  height: 140px;
}
.cave-current i {
  position: absolute;
  inset: 0;
  border: 2px solid #b6d6aa99;
  border-radius: 50%;
  transform: rotate(-20deg);
  box-shadow: 0 0 20px #c3d1a022;
}
.cave-current i:nth-child(2) {
  inset: 15%;
}
.cave-current i:nth-child(3) {
  inset: 30%;
}
.cave-current.settled {
  opacity: 0.3;
}
.mixture {
  position: absolute;
  left: 44%;
  top: 65%;
  padding: 10px;
  background: #18382ddd;
  color: #f6e8c9;
  border: 1px solid #b5a16d;
}
.rival-marker {
  position: absolute;
  left: 54%;
  top: 56%;
  padding: 20px;
  background: #302a20e8;
  border: 1px solid #b59b68;
  color: #f6e8c9;
}
.rival-marker small {
  display: block;
  margin-top: 8px;
}
</style>
