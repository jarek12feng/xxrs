<script setup lang="ts">
import { computed } from "vue";
import { opponentRealmName } from "../realm-pressure";
import type { State, Intent } from "../world";
import type { JourneyAction } from "./state";
import { challenges, destinations } from "./content";
import { moves } from "../expedition/content";
import {
  foundationExchange,
  foundationPower,
  foundationBattleReadiness,
} from "./combat";
import {
  journeyActionError,
  foundationGoal,
  cultivationStage,
} from "./progression";
import { foundationBoard, journeyOptions, journeyPresentation } from "./view";
import JourneyResult from "./JourneyResult.vue";
import { chapterEnding } from "./aftermath";
import { journeyPreparation } from "./preparation";
import { foundationBattleCue, foundationMoveSetup } from "./battle-cues";
import SceneBackdrop from "../SceneBackdrop.vue";
import CultivationOutlook from "../CultivationOutlook.vue";
const props = withDefaults(
  defineProps<{
    game: State;
    busy: boolean;
    mode?: "journey" | "board" | "relationship";
  }>(),
  { mode: "journey" },
);
const emit = defineEmits<{ act: [intent: Intent]; equipment: [] }>();
const preparation = computed(() =>
  journeyPreparation(props.game, props.mode === "board"),
);
const ending = computed(() => chapterEnding(props.game));
const q = computed(() => props.game.foundationJourney);
const board = computed(() => foundationBoard(props.game));
const options = computed(() =>
  journeyOptions(
    props.game,
    props.mode === "relationship" ? "relationship" : "journey",
  ),
);
const battlePreparation = computed(() =>
  q.value.duel ? foundationBattleReadiness(props.game, q.value.duel.id) : null,
);
const foe = computed(() => (q.value.duel ? challenges[q.value.duel.id] : null));
const moveOptions = computed(() =>
  Object.entries(moves).map(([move, label]) => ({
    move: move as keyof typeof moves,
    label,
    preview: foundationExchange(props.game, move as keyof typeof moves),
    setup: foundationMoveSetup(props.game, move as keyof typeof moves),
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
    <aside
      v-if="
        preparation &&
        mode !== 'relationship' &&
        (preparation.missing || preparation.injury || preparation.needsFunds)
      "
      class="foundation-preparation"
      aria-label="当前挑战准备"
    >
      <p v-if="preparation.missing">
        {{ preparation.optionalBattle ? "同阶应战参考修行" : "下一段需要修行" }}
        {{ preparation.target }}，还差 {{ preparation.missing }}。{{
          preparation.optionalBattle ? "也可凭机缘直接越阶挑战。" : ""
        }}本次最多吐纳 {{ preparation.months }} 月，剧情出现时会停下。
      </p>
      <CultivationOutlook
        v-if="preparation.missing"
        :game="game"
        :target="preparation.target"
        :months="preparation.months"
      />
      <button
        v-if="preparation.missing"
        :disabled="busy || preparation.months < 1"
        @click="
          emit('act', {
            type: 'advance',
            activity: 'cultivate',
            months: preparation.months,
          })
        "
      >
        积累修行 · 最多 {{ preparation.months }} 月
      </button>
      <button
        v-if="preparation.injury"
        :disabled="busy"
        @click="
          emit('act', {
            type: 'advance',
            activity: 'rest',
            months: preparation.injury,
          })
        "
      >
        免费静养 · 最多 {{ preparation.injury }} 月
      </button>
      <button
        v-if="preparation.needsFunds"
        :disabled="busy"
        @click="emit('act', { type: 'advance', activity: 'work', months: 1 })"
      >
        劳作一月 · 灵石 +5
      </button>
    </aside>
    <article
      v-if="
        q.epilogue && mode === 'journey' && q.location === 'home' && !q.duel
      "
      class="chapter-ending"
      aria-label="筑基篇尾声"
    >
      <small>你的道途 · 已完成筑基篇</small>
      <h2>{{ ending[0] }}</h2>
      <p v-for="line in ending.slice(1)" :key="line">{{ line }}</p>
      <p class="ending-scope">
        本篇到此完成，角色与存档继续保留。可自由回访、补完支线和榜单；金丹突破与后续篇章尚未开放。
      </p>
    </article>
    <template v-if="q.duel && foe">
      <div class="foundation-duel">
        <img :src="foe.image" :alt="foe.foe" />
        <div>
          <small>第 {{ q.duel.turn + 1 }} 合 / 最多 12 合</small>
          <h3>{{ foe.name }}</h3>
          <p>
            {{ foe.foe }} · {{ opponentRealmName(foe) }} · 气势
            {{ q.duel.enemy }}/{{ foe.hp }}<br />你的气势 {{ q.duel.hp }}/{{
              foundationPower(game).hp
            }}
          </p>
          <p v-if="battlePreparation">
            {{ battlePreparation.description }}
            {{ battlePreparation.cooperationNote }}
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
          <small v-if="m.preview && m.preview.incoming >= q.duel.hp"
            >此招承伤会耗尽气势，回春无法救回；可改招或撤退。</small
          >
          <small v-if="m.setup">{{ m.setup }}</small>
        </button>
        <button :disabled="busy" @click="act({ kind: 'withdraw' })">
          沿原路撤退 · 补给不退
        </button>
      </div>
      <details>
        <summary>查看本合效果明细</summary>
        <p v-for="m in moveOptions" :key="m.move">
          {{ m.label }}：{{ m.preview?.note || "无额外效果" }}
        </p>
      </details>
      <p>
        来招提示与连招收益需一起权衡。伤害、承伤已计入本合效果；连招不会自动替你出招。
      </p>
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
          <h3>{{ row.rank }} · {{ row.foe }} · {{ opponentRealmName(row) }}</h3>
          <p>{{ row.purpose }}</p>
          <p>
            {{ foundationBattleReadiness(game, row.id).description }}
            {{ foundationBattleReadiness(game, row.id).cooperationNote }}
          </p>
          <p>
            首胜奖励：灵石 {{ row.prize }}、筑基修行
            {{ Math.min(40, 600 - q.cultivation) }}（至多 600）{{
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
        <p>行旅之外，可随时回洞府修行；支线标有“可选”。</p>
        <button :disabled="busy" @click="emit('equipment')">
          装配传承与功法
        </button>
        <details>
          <summary>挑战吃力时，怎样准备？</summary>
          <p>
            高小境界敌人有真实的境界压制；修行到同阶或取得越阶机缘后，再衡量胜算。先静养伤势，再比较三招的承伤、蓄势与换招收益；一直重复同一套连招也可能撞上重击。
          </p>
          <p>
            护身诀可在功法页装配并研修，每级研修增加护体
            1；主修研修每级增加基础伤害 2。研修需心得 2、灵石 12、灵草
            2，筑基后可达二级。
          </p>
          <p>
            灵器可在灵器页精炼至二阶：灵瓶每阶减伤 1，灵剑每阶伤害
            +2；每次需心得 2、灵石 24、灵草
            4。根基未满时可在洞府固本，提高气势与基础伤害。
          </p>
          <p v-if="game.journey.main === 'spring'">
            长春守势需有灵草，且承伤后仍存活才会回气；储物袋有药也不能在交锋中起死回生。
          </p>
        </details>
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
              ? "已结为道侣。"
              : q.bond === "promised"
                ? "对方正等你的答复，也可以再想一想。"
                : "尚未结契。可以相约准备远行，也可以继续做朋友。"
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
      <JourneyResult
        v-if="
          q.last &&
          !(
            q.epilogue &&
            q.location === 'home' &&
            q.last.startsWith(ending[0]!)
          )
        "
        :text="q.last"
        expanded
      />
      <div class="foundation-options">
        <article v-for="option in options" :key="JSON.stringify(option.action)">
          <p v-if="option.action.kind === 'battle'">
            {{
              foundationBattleReadiness(game, option.action.battle).description
            }}
            {{
              foundationBattleReadiness(game, option.action.battle)
                .cooperationNote
            }}
          </p>
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
.chapter-ending {
  padding: 22px;
  border: 1px solid #d8b96b;
  border-radius: 12px;
  background: #20382e;
}
.chapter-ending h2 {
  color: #ffe5a5;
}
.ending-scope {
  border-top: 1px solid #788676;
  padding-top: 12px;
}
.foundation-preparation {
  padding: 12px;
  border: 1px solid #788676;
  border-radius: 8px;
}
.foundation-preparation button {
  margin: 4px;
}

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
.chapter-ending {
  padding: 22px;
  border: 1px solid #d8b96b;
  border-radius: 12px;
  background: #20382e;
}
.chapter-ending h2 {
  color: #ffe5a5;
}
.ending-scope {
  border-top: 1px solid #788676;
  padding-top: 12px;
}
.foundation-preparation {
  padding: 12px;
  border: 1px solid #788676;
  border-radius: 8px;
}
.foundation-preparation button {
  margin: 4px;
}

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
