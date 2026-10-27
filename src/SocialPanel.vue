<script setup lang="ts">
import { computed } from "vue";
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
const emit = defineEmits<{ act: [intent: Intent] }>();
const who = computed(() => companion(props.game));
const patternLabel = (pattern: Stance[]) =>
  pattern.map((p) => stances[p]).join(" → ");
const locked = computed(
  () =>
    props.busy ||
    props.running ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene,
);
const duel = computed(() => props.game.social.arena.duel);
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
  break: "对手沉肩收势，护住中路。寻找空隙，以破势击穿守势。",
  endure: "对手气息上扬，准备连攻。守息稳住阵脚，等其换气。",
  discern: "对手脚下阵纹游走，虚实难辨。先识阵眼，再出手。",
};
</script>
<template>
  <div class="social-content" :data-mood="mood">
    <SceneBackdrop
      :key="mood"
      :image="backdrop"
      :title="
        mode === 'arena'
          ? '听松试剑'
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
        v-else-if="mode === 'arena' && game.social.arena.last"
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
        <p class="next-goal">{{ relationshipGoal(game) }}</p>
        <div v-if="!game.social.gender" class="identity-choice">
          <p>
            旧档未设定角色性别。请选择后开启对应的异性人物线；本世确认后不再更换，不改变任何修行数值。
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
        <template v-else-if="who">
          <article>
            <span class="eyebrow"
              >{{ who.gender }}修 · 相识时 {{ who.age }} 岁</span
            >
            <strong
              >{{ relationship(game) }} · 好感 {{ game.social.affection }} /
              100</strong
            >
            <p class="muted">
              好感不是战力。通过不同的共同经历培养，不能重复送礼或重复剧情刷满。
            </p>
          </article>
          <button
            v-if="!game.social.met"
            :disabled="locked || !!duel || game.age < 216"
            @click="emit('act', { type: 'visit' })"
          >
            去山门外相识 · 一月 / 年满十八岁开放
          </button>
          <div v-else class="relationship-steps">
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
              已定情，不等于已经结婚。婚礼、共同洞府与婚后事件留待后续版本。
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
          三位具名 NPC
          的单机擂台，不是真实玩家排行榜。不入宗门、不发展恋情也能参赛。每场一月、灵石
          4，最多交锋三合；先将对手气势归零且自身仍站稳才获胜，同归或三合未破均判负。
        </p>
        <p>
          胜场 {{ game.social.arena.wins }} / 3 · 败场
          {{ game.social.arena.losses }}
          <strong v-if="game.social.arena.wins === 3">· 听松试剑魁首</strong>
        </p>
        <div v-if="duel" class="duel-board" aria-live="polite">
          <span class="eyebrow">交锋中 · 时间暂停 / 装配锁定</span>
          <h3>{{ rivals[duel.opponent].name }} · 第 {{ duel.turn + 1 }} 合</h3>
          <div class="duel-vitals">
            <span
              >你的气势 <strong>{{ duel.hp }} / {{ duel.maxHp }}</strong></span
            ><span
              >对手气势
              <strong
                >{{ duel.enemyHp }} / {{ rivals[duel.opponent].hp }}</strong
              ></span
            >
          </div>
          <div class="stance-options">
            <button
              v-for="(label, stance) in stances"
              :key="stance"
              :disabled="locked"
              @click="emit('act', { type: 'arenaTurn', stance })"
            >
              <strong>{{ label }}</strong
              ><small
                >造成 {{ turnPreview(game, stance)!.damage }}–{{
                  turnPreview(game, stance)!.damage + 2
                }}
                / 承受 {{ turnPreview(game, stance)!.incoming }}–{{
                  turnPreview(game, stance)!.incoming + 2
                }}<template v-if="turnPreview(game, stance)!.heal">
                  / 调息 +{{ turnPreview(game, stance)!.heal }}</template
                ></small
              >
            </button>
          </div>
          <details v-if="duel.log.length">
            <summary>回看本场交锋</summary>
            <p v-for="(line, index) in duel.log" :key="index">{{ line }}</p>
          </details>
          <button
            :disabled="locked"
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
              <h3>{{ rival.name }}</h3>
              <span>{{
                index < game.social.arena.wins
                  ? "已胜"
                  : index === game.social.arena.wins
                    ? "当前对手"
                    : "后续对手"
              }}</span>
            </div>
            <p>{{ rival.style }} · {{ rival.story }}</p>
            <small>首次胜利：{{ rival.prize }}</small
            ><template v-if="game.social.arena.wins === index"
              ><button
                :disabled="locked || game.social.arena.scouted.includes(index)"
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
                三合应对：{{
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
            听松剑经：破势伤害 +4；长春诀：守息回复气势 2；归元息：识阵伤害 +3。
          </p>
          <p>
            护身诀：每合承伤 −2；辨草录：每合存活后回复 1；照夜篇：识阵伤害 +3。
          </p>
          <p>
            灵剑每阶伤害 +2；灵瓶每阶承伤
            −1。根骨与根基提高自身气势，根骨、神识、心得和剑意共同提高伤害。比赛中不能换装，准备阶段可自由调整。
          </p>
        </details>
        <p v-if="game.social.arena.last" class="match-result" role="status">
          {{ game.social.arena.last }}
        </p>
        <p
          v-if="
            game.social.arena.invited && !game.social.memories.includes('watch')
          "
          class="next-goal"
        >
          {{
            who?.name
          }}在台下等你。完成前面的相处后，可在「人物缘分」赴赛后邀约。
        </p>
      </template>
    </section>
  </div>
</template>
