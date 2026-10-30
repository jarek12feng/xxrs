<script setup lang="ts">
import { realmPressure, opponentRealmName } from "./realm-pressure";
import FoundationPanel from "./foundation-journey/FoundationPanel.vue";
import { companionPresent } from "./foundation-journey/progression";
import CompanionshipPanel from "./companionship/CompanionshipPanel.vue";
import OriginNotes from "./OriginNotes.vue";
import { trialBoard } from "./world-ambition";
import CharacterSprite from "./presentation/CharacterSprite.vue";
import { heroArt, rivalArt } from "./presentation/art";
import { computed, ref, watch, nextTick, onUnmounted } from "vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import {
  companion,
  relationship,
  relationshipGoal,
  outingError,
  rivals,
  stances,
  duelIntent,
  turnPreview,
  arenaError,
  type State,
  type Intent,
  type Stance,
} from "./core";
const props = defineProps<{
  game: State;
  busy: boolean;
  running: boolean;
  mode: "relationship" | "arena";
}>();
const emit = defineEmits<{ act: [intent: Intent]; equipment: [] }>();
const stanceChoices = computed(() =>
  (Object.entries(stances) as [Stance, string][]).map(([stance, label]) => ({
    stance,
    label,
    preview: turnPreview(props.game, stance),
  })),
);
const ranking = computed(() => trialBoard(props.game));
const who = computed(() => companion(props.game));
const patternLabel = (pattern: Stance[]) =>
  pattern.map((p) => stances[p]).join(" → ");
const locked = computed(
  () =>
    props.busy ||
    props.running ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.foundationJourney.duel,
);
const boardRealm = ref(
  props.game.social.arena.duel || props.game.realm === 0 ? "qi" : "foundation",
);
watch(
  () => props.game.foundationJourney.duel,
  (d) => {
    if (d) boardRealm.value = "foundation";
  },
);
const duel = computed(() => props.game.social.arena.duel);
const board = ref<HTMLElement>();
const resolving = ref(false);
let impactTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => duel.value?.turn,
  async (turn, old) => {
    clearTimeout(impactTimer);
    if (turn === undefined) {
      resolving.value = false;
      return;
    }
    resolving.value = true;
    impactTimer = setTimeout(
      () => (resolving.value = false),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
    );
    await nextTick();
    board.value?.scrollIntoView({ block: "start", behavior: "instant" });
  },
);
onUnmounted(() => clearTimeout(impactTimer));
const mood = computed(() =>
  props.mode === "arena"
    ? "arena"
    : props.game.social.memories.includes("night") || props.game.social.bonded
      ? "moon"
      : "day",
);
const backdrop = computed(() =>
  mood.value === "arena"
    ? "/scenes/sect-arena.png"
    : mood.value === "moon"
      ? "/scenes/moon-terrace.png"
      : "/scenes/mist-path.jpg",
);
const intentText: Record<Stance, string> = {
  break: "对手沉肩收势，护住中路，正在等你先动。",
  endure: "对手气息上扬，剑尖逼近，连攻后的换气很短。",
  discern: "对手脚下阵纹游走，身形与影子错开了半步。",
};
</script>
<template>
  <div class="social-content desktop-scene" :data-mood="mood">
    <nav v-if="mode === 'arena'" aria-label="试剑榜境界分组">
      <button :aria-pressed="boardRealm === 'qi'" @click="boardRealm = 'qi'">
        炼气组</button
      ><button
        :aria-pressed="boardRealm === 'foundation'"
        @click="boardRealm = 'foundation'"
      >
        筑基组</button
      ><button
        :aria-pressed="boardRealm === 'gold'"
        @click="boardRealm = 'gold'"
      >
        金丹组 · 未开放
      </button>
    </nav>
    <FoundationPanel
      v-if="mode === 'arena' && boardRealm === 'foundation'"
      mode="board"
      :game="game"
      :busy="busy || running"
      @act="emit('act', $event)"
      @equipment="emit('equipment')"
    />
    <p v-else-if="mode === 'arena' && boardRealm === 'gold'">
      金丹组尚未开放。未来按境界独立记名，现有炼气与筑基成绩分别保留。
    </p>
    <template v-else>
      <SceneBackdrop
        v-if="mode === 'arena' || companionPresent(game)"
        :key="mood"
        :image="backdrop"
        :title="
          mode === 'arena'
            ? '听松试剑榜'
            : mood === 'moon'
              ? '灯下，有人等你'
              : '山路上的相逢'
        "
        :eyebrow="
          mode === 'arena' ? '擂台交锋 · 胜负之外' : '一段缘分 · 一起走过的路'
        "
        :body="
          mode === 'arena'
            ? duel
              ? intentText[duelIntent(game)!]
              : '松声越过擂台，台边有人低声议论上一场的剑势。你可以先观摩，也可以准备好之后，再报上自己的名字。'
            : who?.goal ||
              '暮色沿着山路落下。旅人的故事，往往从一次愿意停下来的相逢开始。'
        "
        :speaker="
          mode === 'relationship'
            ? who?.name
            : duel
              ? rivals[duel.opponent].name
              : undefined
        "
        :portrait="mode === 'relationship' ? who?.portrait : undefined"
        :quote="mode === 'relationship' ? who?.title : undefined"
      >
        <p
          v-if="
            mode === 'relationship' &&
            game.adventure.mist.settled &&
            game.adventure.mist.partner === 'companion'
          "
          class="scene-result"
        >
          雾海同行 ·
          {{
            game.adventure.mist.vow === "steady"
              ? "那一次，你先系好大家的归绳，才决定往前走。"
              : "那一次，你追查来信，也记得回应约好的撤退信号。"
          }}
          {{ who?.name }}记得你们一起走过的路；下一次的远行，也想与你一起商量。
        </p>
        <p
          v-if="mode === 'arena' && duel?.log.length"
          class="scene-result"
          role="status"
        >
          {{ duel.log.at(-1) }}
        </p>
        <p
          v-else-if="mode === 'arena' && !duel && game.social.arena.last"
          class="scene-result"
          role="status"
        >
          {{ game.social.arena.last }}
        </p>
      </SceneBackdrop>
      <section
        class="scene-controls"
        :aria-label="mode === 'arena' ? '擂台操作区' : '人物互动操作区'"
      >
        <h3 class="controls-heading">
          {{ mode === "arena" ? "观摩与交锋" : "相识与相处" }}
        </h3>
        <template v-if="mode === 'relationship'">
          <FoundationPanel
            v-if="
              game.social.met &&
              game.realm >= 1 &&
              game.companionship.stage === 'done'
            "
            mode="relationship"
            :game="game"
            :busy="busy || running"
            @act="emit('act', $event)"
            @equipment="emit('equipment')"
          />
          <p v-if="companionPresent(game)" class="next-goal">
            {{ relationshipGoal(game) }}
          </p>
          <CompanionshipPanel
            v-if="game.social.met && game.realm >= 1 && companionPresent(game)"
            :game="game"
            :busy="locked || !!duel"
            @act="emit('act', $event)"
            @equipment="emit('equipment')"
          />
          <OriginNotes
            :game="game"
            :busy="locked || !!duel"
            journal
            @act="emit('act', $event)"
          />
          <div v-if="!game.social.gender" class="identity-choice">
            <p>
              旧档未设定角色性别。请选择后开启对应的异性人物线；此角色确认后不再更换，不改变任何修行数值。
            </p>
            <button
              :disabled="locked || !!duel"
              @click="emit('act', { type: 'identity', gender: 'male' })"
            >
              男修 · 结识沈听澜</button
            ><button
              :disabled="locked || !!duel"
              @click="emit('act', { type: 'identity', gender: 'female' })"
            >
              女修 · 结识尹照川
            </button>
          </div>
          <template v-else-if="who && companionPresent(game)">
            <article>
              <span class="eyebrow"
                >{{ who.gender }}修 · 相识时 {{ who.age }} 岁</span
              >
              <strong
                >{{ relationship(game) }} · 好感 {{ game.social.affection }} /
                100</strong
              >
              <p class="muted">
                共同历险与相处可以增进好感，同一段经历只增加一次。
              </p>
            </article>
            <button
              v-if="!game.social.met"
              :disabled="locked || !!duel || game.age < 216 || game.realm < 1"
              @click="emit('act', { type: 'visit' })"
            >
              去山门外相识 · 一月 / 成年且筑基后开放
            </button>
            <div v-else class="relationship-steps">
              <button
                :disabled="locked || !!duel"
                @click="emit('act', { type: 'background' })"
              >
                聊聊家人与学艺的经历 · 不耗月份
              </button>
              <article
                v-for="(label, outing) in {
                  walk: '共勘旧路',
                  night: '灯下谈心',
                  watch: '赛后相叙',
                }"
                :key="outing"
              >
                <div>
                  <h4>{{ label }}</h4>
                  <p class="muted">
                    {{
                      outingError(game, outing) ||
                      "对方愿与你相约，共同经历将留下记忆。"
                    }}
                  </p>
                </div>
                <button
                  :disabled="locked || !!duel || !!outingError(game, outing)"
                  @click="emit('act', { type: 'outing', outing })"
                >
                  {{
                    game.social.memories.includes(outing)
                      ? "已珍藏"
                      : "赴约 · 一月"
                  }}
                </button>
              </article>
              <button
                class="pledge-button"
                :disabled="
                  locked ||
                  !!duel ||
                  game.social.memories.length !== 3 ||
                  game.social.affection < 50 ||
                  game.social.bonded
                "
                @click="emit('act', { type: 'confess' })"
              >
                {{
                  game.social.bonded
                    ? "两心相许 · 已定情"
                    : "月下表明心意 · 三段经历 / 好感 50"
                }}
              </button>
            </div>
            <div v-if="game.social.bonded" class="keepsake">
              <h3>珍藏：{{ who.keepsake }}</h3>
              <p>“愿与你同行，也愿我们都不辜负各自的远方。”</p>
              <p class="muted">
                {{
                  game.foundationJourney.bond === "covenant"
                    ? "已结为道侣。"
                    : "已定情；完成职业同行并商定联系后，可以另行商议结契。"
                }}共同洞府与长期生活事件尚未开放。
              </p>
            </div>
            <details v-if="game.social.met" class="memory-review">
              <summary>回看共同记忆</summary>
              <p v-if="game.social.answers.meet">
                山门初逢：{{
                  {
                    help: "你用灵草帮忙辨路。",
                    share: "你分享了识路心得。",
                    listen: "你认真听完了对方的故事。",
                  }[game.social.answers.meet as "help" | "share" | "listen"]
                }}
              </p>
              <p v-if="game.social.answers.walk">
                雨中旧路：{{
                  {
                    care: "你照料受伤药工，让对方安心记路。",
                    mark: "你与对方标出安全通路。",
                    stay: "你留下来陪大家走回去。",
                  }[game.social.answers.walk as "care" | "mark" | "stay"]
                }}
              </p>
              <p v-if="game.social.answers.night">
                灯下谈心：你们说出了各自的心愿与担忧。
              </p>
              <p v-if="game.social.answers.watch">
                胜负之外：你愿让对方看到认真准备、也会失误的自己。
              </p>
            </details>
          </template>
        </template>
        <template v-else>
          <p class="muted">
            三位具名 NPC 的本届比试，散修也可报名。每场一月、灵石
            4，最多交锋六合；第四合起对手承接上一轮招式、伤害
            +2。先将对手气势归零且自身仍站稳才获胜，同归或六合未破均判负。
          </p>
          <section v-if="!duel" class="trial-board" aria-label="本届试剑榜">
            <h3>{{ game.name }} · {{ ranking.title }}</h3>
            <p>听松山本届炼气组试剑记名。</p>
            <p>{{ ranking.response }}</p>
            <p v-if="ranking.next">
              下一位对手：{{ ranking.next }} · {{ ranking.requirement }}
            </p>
            <p v-else>{{ ranking.requirement }}</p>
          </section>
          <p>
            胜场 {{ game.social.arena.wins }} / 3 · 败场
            {{ game.social.arena.losses }}
            <strong v-if="game.social.arena.wins === 3"
              >· 听松炼气组魁首</strong
            >
          </p>
          <div
            v-if="duel"
            ref="board"
            class="duel-board"
            :class="{ 'duel-resolving': resolving }"
            aria-live="polite"
          >
            <span class="eyebrow"
              >交锋中 · 时间暂停 · 灵草 {{ game.herbs }}</span
            >
            <h3>
              {{ rivals[duel.opponent].name }} ·
              {{ opponentRealmName(rivals[duel.opponent]!) }} · 第
              {{ duel.turn + 1 }} 合
            </h3>
            <div class="combatants">
              <div>
                <CharacterSprite
                  style="height: 150px"
                  :character="heroArt(game.social.gender)"
                  pose="attack"
                  :label="game.name"
                /><span
                  >你的气势
                  <strong>{{ duel.hp }} / {{ duel.maxHp }}</strong></span
                >
                <div
                  class="vital-track"
                  role="meter"
                  aria-label="你的气势"
                  :aria-valuenow="duel.hp"
                  :aria-valuemax="duel.maxHp"
                  aria-valuemin="0"
                >
                  <i :style="{ width: (100 * duel.hp) / duel.maxHp + '%' }"></i>
                </div>
              </div>
              <b class="clash-mark" aria-hidden="true">交锋</b>
              <div>
                <CharacterSprite
                  v-if="rivalArt[rivals[duel.opponent].name]"
                  style="height: 150px"
                  :character="rivalArt[rivals[duel.opponent].name]!"
                  :label="rivals[duel.opponent].name"
                /><span
                  >对手气势
                  <strong
                    >{{ duel.enemyHp }} / {{ rivals[duel.opponent].hp }}</strong
                  ></span
                >
                <div
                  class="vital-track enemy"
                  role="meter"
                  aria-label="对手气势"
                  :aria-valuenow="duel.enemyHp"
                  :aria-valuemax="rivals[duel.opponent].hp"
                  aria-valuemin="0"
                >
                  <i
                    :style="{
                      width:
                        (100 * duel.enemyHp) / rivals[duel.opponent].hp + '%',
                    }"
                  ></i>
                </div>
              </div>
            </div>
            <p>
              {{ realmPressure(game, rivals[duel.opponent]!).description }}
              本场独自应战。
            </p>
            <p v-if="!duel.turn" class="combat-receipt">
              已付灵石 4 · 当月收入 1。 本场不再扣费，不推进月份。
            </p>
            <p
              v-else
              :key="duel.turn"
              class="combat-receipt combat-impact"
              role="status"
            >
              {{ duel.log.at(-1) }}
            </p>
            <p class="combat-intent">
              <strong>下一合 · 看清对手</strong
              >{{ intentText[duelIntent(game)!] }}
            </p>
            <p class="combat-phase">
              {{ resolving ? "招式落定，稳住气息……" : "轮到你 · 选择应对" }}
            </p>
            <div class="stance-options">
              <button
                v-for="{ stance, label, preview } in stanceChoices"
                :key="stance"
                :disabled="locked || resolving"
                @click="emit('act', { type: 'arenaTurn', stance })"
              >
                <strong>{{ label }}</strong>
                <small v-if="preview" class="combat-numbers">
                  <span
                    >伤敌 {{ preview.damage }}–{{ preview.damage + 2 }}</span
                  >
                  <span
                    >承伤 {{ preview.incomingMin }}–{{
                      preview.incomingMax
                    }}</span
                  >
                  <span v-if="preview.firstStrike"
                    >抢先收势：击倒则免反击，未击倒承伤 +2</span
                  >
                  <span v-if="preview.heal" class="combat-heal"
                    >存活后回气 ≤{{ preview.heal
                    }}<template v-if="preview.herbs"> · 耗草 1</template></span
                  >
                </small>
              </button>
            </div>
            <details v-if="duel.log.length">
              <summary>回看本场交锋</summary>
              <p v-for="(line, index) in duel.log" :key="index">{{ line }}</p>
            </details>
            <button
              :disabled="locked || resolving"
              @click="emit('act', { type: 'arenaWithdraw' })"
            >
              主动认负 · 不新增伤势 / 费用不退
            </button>
          </div>
          <template v-else
            ><article
              v-for="(rival, index) in rivals"
              :key="rival.name"
              class="rival-card"
              :class="{ 'rival-current': game.social.arena.wins === index }"
            >
              <div class="panel-heading">
                <h3>{{ rival.name }} · {{ opponentRealmName(rival) }}</h3>
                <span>{{
                  index < game.social.arena.wins
                    ? "已胜"
                    : index === game.social.arena.wins
                      ? "当前对手"
                      : "后续对手"
                }}</span>
              </div>
              <CharacterSprite
                v-if="rivalArt[rival.name]"
                style="height: 180px"
                :character="rivalArt[rival.name]!"
                :label="rival.name"
              />
              <p>{{ rival.style }} · {{ rival.story }}</p>
              <p>{{ realmPressure(game, rival).description }} 本场独自应战。</p>
              <small>首次胜利：{{ rival.prize }}</small
              ><template v-if="game.social.arena.wins === index"
                ><button
                  :disabled="
                    locked || game.social.arena.scouted.includes(index)
                  "
                  @click="emit('act', { type: 'arenaScout' })"
                >
                  {{
                    game.social.arena.scouted.includes(index)
                      ? "已观摩"
                      : "观摩招式 · 不耗时间"
                  }}
                </button>
                <p
                  v-if="game.social.arena.scouted.includes(index)"
                  class="intent-hint"
                >
                  来招循环：{{
                    patternLabel(rival.pattern)
                  }}。胜负还取决于气势与装配，开战前准备好。
                </p>
                <p class="muted">
                  {{
                    arenaError(game) ||
                    "可登台。气势不足时，先凝神、研读、固本或准备灵器。"
                  }}
                </p>
                <button
                  :disabled="locked || !!arenaError(game)"
                  @click="emit('act', { type: 'arenaStart' })"
                >
                  登台挑战 · 一月 / 灵石 4
                </button></template
              >
            </article></template
          >
          <details class="arena-builds">
            <summary>怎样调整功法与灵器？</summary>
            <p>
              听松剑经：破势伤害 +4；若本合击倒对手，不受反击，否则承伤
              +2；长春诀：守息存活后耗灵草 1、恢复最多 6 气势；归元息：识阵伤害
              +3、承伤 −2。
            </p>
            <p>
              护身诀：每合承伤 −2；辨草录：每合存活后回复 1；照夜篇：识阵伤害
              +3。
            </p>
            <p>
              灵剑每阶伤害 +2；灵瓶每阶承伤
              −1。根骨与根基提高自身气势，根骨、神识、心得和剑意共同提高伤害。比赛中不能换装，准备阶段可自由调整。
            </p>
          </details>
          <p
            v-if="!duel && game.social.arena.last"
            class="match-result"
            role="status"
          >
            {{ game.social.arena.last }}
          </p>
          <p
            v-if="
              game.social.arena.invited &&
              !game.social.memories.includes('watch')
            "
            class="next-goal"
          >
            {{
              who?.name
            }}在台下等你。完成前面的相处后，可在「人物缘分」赴赛后邀约。
          </p>
        </template>
      </section>
    </template>
  </div>
</template>
<style>
.duel-board {
  color: #f4eedc;
  background: #172923;
  scroll-margin-top: 64px;
}
.combatants {
  display: grid;
  grid-template-columns: 1fr 36px 1fr;
  gap: 8px;
  align-items: center;
  margin: 18px 0;
}
.combatants > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: center;
}
.fighter-seal {
  display: grid;
  place-items: center;
  align-self: center;
  border: 1px solid #5e8272;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  background: #284d41;
  color: #f1e5c4;
  font: 28px serif;
}
.fighter-seal.enemy {
  background: #664439;
  border-color: #9d705a;
}
.clash-mark {
  font: 12px serif;
  color: #8d7a53;
  text-align: center;
}
.combatants > div > span:not(.fighter-seal) {
  font-size: 12px;
}
.combatants strong {
  display: block;
  margin-top: 4px;
  font-size: 17px;
}
.vital-track {
  height: 8px;
  border-radius: 9px;
  background: #284d4120;
  overflow: hidden;
}
.vital-track i {
  display: block;
  height: 100%;
  background: #52775b;
  transition: width 0.6s ease-out;
}
.vital-track.enemy i {
  background: #ab7860;
}
.combat-receipt {
  padding: 12px;
  background: #263b30;
  color: #f4eedc;
  border-left: 3px solid #6c8464;
  line-height: 1.8;
  font-size: 14px;
}
.combat-intent {
  padding: 12px;
  border: 1px solid #c5c5ab;
  background: #26352e;
  color: #f4eedc;
  line-height: 1.7;
  font-size: 14px;
}
.combat-intent strong {
  display: block;
  color: #cbe0b8;
  margin-bottom: 6px;
}
.combat-phase {
  font-size: 12px;
  color: #cbe0b8;
}
.combat-impact {
  animation: combat-impact 0.6s ease-out;
}
.duel-resolving .fighter-seal {
  animation: combat-lunge 0.6s ease-out;
}
.duel-resolving .fighter-seal.enemy {
  animation-direction: reverse;
}
.duel-board .stance-options button {
  min-height: 58px;
}
.duel-board .stance-options {
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.duel-board .stance-options button {
  padding: 12px 6px;
  min-height: 88px;
  min-width: 0;
  font-size: 15px;
}
.duel-board .stance-options small {
  font-size: 12px;
  line-height: 1.5;
  display: block;
  margin-top: 6px;
}
@keyframes combat-impact {
  from {
    box-shadow: 0 0 0 4px #c3ad7655;
    opacity: 0.4;
  }
  to {
    box-shadow: 0 0 0 0 transparent;
    opacity: 1;
  }
}
@keyframes combat-lunge {
  35% {
    transform: translateX(7px);
  }
  70% {
    transform: translateX(-3px);
  }
  to {
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .combat-impact,
  .duel-resolving .fighter-seal {
    animation: none;
  }
  .vital-track i {
    transition: none;
  }
}
</style>

<style>
.social-content .duel-board {
  color: #f4eedc;
  background: #172923;
}
@media (max-width: 650px) {
  .social-content .duel-board {
    padding: 10px;
    margin: 8px 0;
  }
  .social-content .duel-board .stance-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .social-content .duel-board .stance-options button {
    padding: 8px 3px;
    min-height: 90px;
    font-size: 13px;
  }
  .social-content .duel-board .combatants {
    margin: 8px 0;
  }
  .social-content .duel-board .fighter-seal {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
  .social-content .duel-board .combat-intent,
  .social-content .duel-board .combat-receipt {
    padding: 8px;
    line-height: 1.5;
  }
}
</style>

<style scoped>
.social-content > nav,
.social-content > .foundation-panel {
  grid-column: 1 / -1;
}
.social-content > nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #e5e7db;
}
.social-content > nav button {
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 6px;
  color: #18372e;
  background: #f7f6ed;
}
.social-content > nav button[aria-pressed="true"] {
  background: #234e41;
  color: #fff9e9;
}
</style>
