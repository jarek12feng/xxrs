<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../world";
import type { JourneyAction } from "./state";
import { challenges, destinations, sideChoices } from "./content";
import { moves } from "../expedition/content";
import { foundationExchange, foundationPower } from "./combat";
import {
  journeyActionError,
  foundationGoal,
  cultivationStage,
} from "./progression";
import { foundationBoard, journeyOptions, journeyPresentation } from "./view";
import JourneyResult from "./JourneyResult.vue";
import { foundationBattleCue } from "./battle-cues";
import SceneBackdrop from "../SceneBackdrop.vue";
const props = withDefaults(
  defineProps<{
    game: State;
    busy: boolean;
    mode?: "journey" | "board" | "relationship";
  }>(),
  { mode: "journey" },
);
const emit = defineEmits<{ act: [intent: Intent]; equipment: [] }>();
const q = computed(() => props.game.foundationJourney);
const board = computed(() => foundationBoard(props.game));
const options = computed(() =>
  journeyOptions(
    props.game,
    props.mode === "relationship" ? "relationship" : "journey",
  ),
);
const foe = computed(() => (q.value.duel ? challenges[q.value.duel.id] : null));
const moveOptions = computed(() =>
  Object.entries(moves).map(([move, label]) => ({
    move: move as keyof typeof moves,
    label,
    preview: foundationExchange(props.game, move as keyof typeof moves),
  })),
);
const presentation = computed(() =>
  journeyPresentation(props.game, props.mode === "relationship"),
);
const scene = computed(() =>
  props.mode === "board"
    ? "/scenes/sect-arena.png"
    : `/art/foundation-journey/${destinations[q.value.location].image}.webp`,
);
function act(action: JourneyAction) {
  emit("act", { type: "foundationJourney", action });
}
</script>
<template>
  <section
    class="foundation-panel"
    :aria-label="
      mode === 'board'
        ? '听松筑基试剑榜'
        : mode === 'relationship'
          ? '筑基同行与去向'
          : '筑基行旅'
    "
  >
    <template v-if="q.duel && foe">
      <div class="foundation-duel">
        <img :src="foe.image" :alt="foe.foe" />
        <div>
          <small>第 {{ q.duel.turn + 1 }} 合 / 最多 12 合</small>
          <h3>{{ foe.name }}</h3>
          <p>
            {{ foe.foe }} · 气势 {{ q.duel.enemy }}/{{ foe.hp }}<br />你的气势
            {{ q.duel.hp }}/{{ foundationPower(game).hp }}
          </p>
          <p class="battle-cue">来招：{{ foundationBattleCue(game) }}</p>
          <p>
            基础伤害 {{ foundationPower(game).damage }} · 护体
            {{ foundationPower(game).armor }}。主动撤退不新增伤势；败退伤势
            +2，排名与已得成果保留。
          </p>
        </div>
      </div>
      <div class="foundation-options">
        <button
          v-for="m in moveOptions"
          :key="m.move"
          :disabled="
            busy || !!journeyActionError(game, { kind: 'move', move: m.move })
          "
          @click="act({ kind: 'move', move: m.move })"
        >
          {{ m.label
          }}<small v-if="m.preview"
            >伤敌 {{ m.preview.damage }} / 承伤 {{ m.preview.incoming
            }}{{
              m.preview.healing
                ? ` / 耗草 ${m.preview.herbs} 回气 ${m.preview.healing}`
                : ""
            }}</small
          >
        </button>
        <button :disabled="busy" @click="act({ kind: 'withdraw' })">
          沿原路撤退 · 补给不退
        </button>
      </div>
      <p role="status" class="foundation-result">{{ q.last }}</p>
    </template>
    <template v-else-if="mode === 'board'">
      <SceneBackdrop
        :image="scene"
        title="听松试剑榜 · 筑基组"
        eyebrow="青玄界 · 听松本届比试"
        :body="`你的名次：${board.title}。分境界独立记名，不与炼气组混排。`"
        compact
      />
      <p>
        筑基修行 {{ q.cultivation }}/600 ·
        {{ cultivationStage(game) }}。每场行前一月、灵石 4；最多 12 合，败退伤势
        +2，可免费静养后再来。
      </p>
      <JourneyResult
        v-if="q.board.last"
        :text="q.board.last"
        label="查看最近一场奖励与对手回应"
      />
      <p class="next-goal">{{ board.next }}</p>
      <button :disabled="busy" @click="emit('equipment')">查看功法装配</button>
      <ol class="foundation-ranks">
        <li
          v-for="row in board.rows"
          :key="row.id"
          :class="{ current: row.current, won: row.won }"
        >
          <h3>{{ row.rank }} · {{ row.foe }}</h3>
          <p>{{ row.purpose }}</p>
          <p>
            首胜奖励：灵石 {{ row.prize }}、筑基修行 40（至多 600）{{
              row.extra ? `、${row.extra}` : ""
            }}。每场只结算一次。
          </p>
          <p v-if="row.won">已获胜 · {{ row.turns }} 合 · 奖励已入袋</p>
          <template v-else-if="row.current"
            ><small>{{
              journeyActionError(game, { kind: "battle", battle: row.id }) ||
              "准备就绪，可登台"
            }}</small
            ><button
              :disabled="
                busy ||
                !!journeyActionError(game, { kind: 'battle', battle: row.id })
              "
              @click="act({ kind: 'battle', battle: row.id })"
            >
              挑战{{ row.foe }}
            </button></template
          >
          <small v-else>先击败前一位对手；需修行 {{ row.cultivation }}</small>
        </li>
      </ol>
    </template>
    <template v-else>
      <template v-if="mode === 'journey'">
        <h3>筑基行旅 · 青玄界</h3>
        <p>{{ cultivationStage(game) }} · 修行 {{ q.cultivation }}/600</p>
        <p class="next-goal">{{ foundationGoal(game) }}</p>
        <nav aria-label="筑基行旅地点">
          <button
            v-for="(place, id) in destinations"
            :key="id"
            :disabled="
              busy ||
              !!journeyActionError(game, { kind: 'travel', destination: id })
            "
            :title="
              journeyActionError(game, { kind: 'travel', destination: id })
            "
            :aria-pressed="q.location === id"
            @click="act({ kind: 'travel', destination: id })"
          >
            {{ place.name }}{{ q.location === id ? " · 此处" : " · 一月" }}
          </button>
        </nav>
        <SceneBackdrop
          :image="presentation.image"
          :title="destinations[q.location].name"
          eyebrow="青玄界 · 筑基行旅"
          :body="presentation.body || destinations[q.location].intro"
          :portrait="presentation.portrait"
          :speaker="presentation.speaker"
          compact
        />
        <p>
          独行也能完成主线。寻亲、追责、药庄、雪线、旅亭、道侣和试剑榜均可暂缓。
        </p>
        <button :disabled="busy" @click="emit('equipment')">
          装配传承与功法
        </button>
        <p v-if="q.location === 'estate' && q.sides.estate.outcome">
          {{ sideChoices.estate[q.sides.estate.outcome]?.result }}
        </p>
        <p v-if="q.location === 'snow' && q.sides.snow.outcome">
          {{ sideChoices.snow[q.sides.snow.outcome]?.result }}
        </p>
        <p v-if="q.location === 'inn' && q.sides.inn.outcome">
          {{ sideChoices.inn[q.sides.inn.outcome]?.result }}
        </p>
      </template>
      <template v-else
        ><SceneBackdrop
          :image="presentation.image"
          title="同行、分别与重逢"
          :body="presentation.body"
          :portrait="presentation.portrait"
          :speaker="presentation.speaker"
          compact
        />

        <p>
          {{
            q.bond === "covenant"
              ? "已经双方明确同意，结为道侣。"
              : q.bond === "promised"
                ? "已经表达意愿，仍待你明确答应；可以暂缓。"
                : "结契是可选关系，不增加境界数值。朋友也可以共同准备。"
          }}
        </p>
        <p>
          联系：{{
            { none: "尚未约定", letters: "药队递信", station: "旅亭留信" }[
              q.contact
            ]
          }}。闭关与现实离线不会损害关系。
        </p></template
      >
      <JourneyResult v-if="q.last" :text="q.last" />
      <div class="foundation-options">
        <article v-for="option in options" :key="JSON.stringify(option.action)">
          <button
            :disabled="busy || !!option.error"
            @click="act(option.action)"
          >
            {{ option.label }}</button
          ><small v-if="option.error">{{ option.error }}</small>
        </article>
      </div>
    </template>
  </section>
</template>
<style scoped>
.foundation-panel {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #827348;
  border-radius: 10px;
  background: #172225;
  color: #f1e5c9;
}
.foundation-panel p {
  line-height: 1.7;
  margin: 0.3em 0;
}
.foundation-panel .next-goal {
  background: #e8eadc;
  color: #203b31;
}
.foundation-panel small {
  display: block;
  color: #d6d2bb;
  line-height: 1.6;
}
.foundation-panel button {
  white-space: normal;
  height: auto;
  min-height: 44px;
  line-height: 1.6;
}
.foundation-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
.foundation-options article {
  display: grid;
  gap: 4px;
}
.foundation-result {
  padding: 14px;
  background: #283d37;
  border-left: 3px solid #d8b96b;
  border-radius: 4px;
}
.foundation-ranks {
  padding-left: 24px;
  display: grid;
  gap: 12px;
}
.foundation-ranks li {
  padding: 12px;
  border: 1px solid #536460;
  border-radius: 8px;
}
.foundation-ranks .current {
  border-color: #ddbe75;
  background: #253b35;
}
.foundation-ranks .won {
  background: #24322c;
}
.foundation-duel {
  display: grid;
  grid-template-columns: minmax(90px, 30%) minmax(0, 1fr);
  align-items: center;
  gap: 18px;
}
.foundation-duel img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
}
@media (max-width: 550px) {
  .foundation-duel {
    grid-template-columns: 100px 1fr;
    gap: 10px;
  }
  .foundation-panel {
    padding: 12px;
  }
  .foundation-duel h3 {
    font-size: 1rem;
  }
}
</style>
<style scoped>
.foundation-panel button {
  background: #e8eadc;
  color: #203b31;
  border: 1px solid #a7b4a6;
  border-radius: 6px;
  padding: 8px 12px;
}
.foundation-panel button small {
  color: #385244;
}
</style>
