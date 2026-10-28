<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from "vue";
import ExpeditionPanel from "./expedition/ExpeditionPanel.vue";
import RoadEpilogue from "./RoadEpilogue.vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import SceneResponse from "./SceneResponse.vue";
import type { ActionReceipt } from "./action-feedback";
import {
  roadScenes,
  passSolutions,
  passEcho,
  type PassSolution,
  roadGoal,
  roadDetails,
  roadError,
  roadClues,
  hasShelteredRoute,
  forgeError,
  actionError,
  preparationError,
  breakthroughDetails,
  type RoadAction,
  type RoadClue,
  type State,
  type Intent,
} from "./core";
const props = defineProps<{
  game: State;
  busy: boolean;
  receipt?: ActionReceipt | null;
}>();
const emit = defineEmits<{
  act: [intent: Intent];
  cultivate: [];
  map: [];
  breakthrough: [];
  mist: [];
}>();
const panel = ref<HTMLElement>();
const reveal = async () => {
  await nextTick();
  const stage = panel.value?.closest<HTMLElement>(".game-layout");
  if (stage) stage.scrollTop = 0;
  else panel.value?.scrollIntoView({ block: "start", behavior: "instant" });
};
onMounted(reveal);
watch(() => props.game.adventure.road.stage, reveal);
const showLegacy = ref(false);
const epilogueDismissed = ref(false);
const showEpilogue = computed(
  () =>
    road.value.surveyed &&
    road.value.stage === "lookout" &&
    !epilogueDismissed.value,
);
const readingSize = ref("standard");
function keyboard(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    target.closest("input, textarea, select, [contenteditable], [inert]")
  )
    return;
  if (event.key === "Escape") {
    showLegacy.value = false;
    panel.value
      ?.querySelectorAll("details[open]")
      .forEach((node) => node.removeAttribute("open"));
    return;
  }
  if (
    locked.value ||
    road.value.stage !== "pass" ||
    road.value.obstacle === "none" ||
    road.value.passed
  )
    return;
  const key = solutionKeys[Number(event.key) - 1];
  if (!/^[123]$/.test(event.key) || !key || road.value.prepared === key) return;
  const action = passSolutions[key].prepare;
  if (!roadError(props.game, action)) {
    event.preventDefault();
    emit("act", { type: "road", action });
  }
}
const solutionKeys = Object.keys(passSolutions) as PassSolution[];
const echo = computed(() => passEcho(props.game));
const road = computed(() => props.game.adventure.road);
const scene = computed(() => {
  const r = road.value,
    base = roadScenes[r.stage];
  if (echo.value) return { ...base, body: echo.value.body };
  if (r.stage === "beyond" && r.surveyed)
    return {
      ...base,
      body: "再次越过山口，云海依旧辽阔。你认得那段背风的石阶，也看见旅人沿着你标出的方向前行。远处旅亭的灯，已经不再陌生。",
    };
  if (r.stage === "market" && r.map)
    return {
      ...base,
      body: r.surveyed
        ? "药队顺着你画下的归路回来了。郁青在茶摊替你留了位子，摊上的航图多出一段熟悉的线。茶碗底下压着药队捎回来的字条。"
        : "送往山口的伤药已经装车。郁青收好图夹，在茶摊替你留着热茶。你手中的航图不再残缺，青嶂关的道路就在眼前。",
    };
  if (r.stage === "lookout" && r.surveyed)
    return {
      ...base,
      body: "路簿上多了你留下的石阶与雾障标记。旅人围过来核对行程，有人问起山下药队的近况。你不再只是路过这个世界的人。",
    };
  return base;
});
const locked = computed(
  () =>
    props.busy ||
    !!props.game.expedition.duel ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel,
);
const observations = computed(() =>
  (Object.keys(roadClues) as RoadClue[])
    .filter((key) => roadClues[key].stage === road.value.stage)
    .map((key) => ({ key, ...roadClues[key] })),
);
const choices = computed<{ action: RoadAction; label: string }[]>(
  () =>
    ({
      home: [
        { action: "thanks", label: "回访药工与温蘅 · 听听他们记住了什么" },
        { action: "market", label: "带上缺角航图，前往坊市" },
      ],
      market: [
        { action: "talk", label: "与行脚人郁青交谈" },
        { action: "accept", label: "接下伤药委托" },
        { action: "deliver", label: "交付灵草 4，换取图角" },
        { action: "verify", label: "帮忙辨药 · 神识 6 / 心得 2" },
        { action: "invite", label: "邀请郁青一起探路" },
        {
          action: "pass",
          label: road.value.passed ? "重访云外长路 · 免费" : "循图前往青嶂关",
        },
      ],
      pass: [
        { action: "inspect", label: "观察山风，询问守境妖修" },
        {
          action: "challenge",
          label: road.value.passed
            ? "已经过关"
            : `正面过关 · 把握 ${roadDetails(props.game).chance}% · 灵石 4 / 失败伤势 +1`,
        },
        {
          action: "shelteredChallenge",
          label: `循避风路过关 · 把握 ${roadDetails(props.game, "sheltered").chance}% · 灵石 6 / 失败安全撤回`,
        },
        { action: "camp", label: "退回行营，制定准备计划" },
        { action: "market", label: "回坊市找郁青" },
      ],
      camp: [
        { action: "art", label: "以功法稳住护体" },
        { action: "relic", label: "用灵器抵御山风" },
        { action: "friend", label: "与熟悉路况的人同行" },
        {
          action: "pass",
          label: road.value.passed
            ? "重走已打通的路 · 免费"
            : "按计划准备后，再赴青嶂关",
        },
        { action: "market", label: "返回坊市" },
      ],
      beyond: [{ action: "lookout", label: "走向云栈旅亭 · 看看山外的人" }],
      lookout: [
        { action: "survey", label: "将安全的归路记入路簿" },
        { action: "market", label: "回坊市告诉郁青旅亭的消息" },
        { action: "back", label: "沿归路返回行营" },
      ],
    })[road.value.stage] as { action: RoadAction; label: string }[],
);
const growth = computed(() => [
  {
    label: "凝神辨雾 · 最多三月",
    hint: `神识 ${props.game.sense}/12；迷雾中达到 8 更有利`,
    intent: { type: "advance", activity: "meditate", months: 3 } as Intent,
    error:
      props.game.sense >= 12 ? "神识已满" : actionError(props.game, "meditate"),
  },
  {
    label: "研读航图 · 最多两月",
    hint: `心得 ${props.game.study}/4；辨药委托需要 2`,
    intent: { type: "advance", activity: "study", months: 2 } as Intent,
    error:
      props.game.study >= 4 ? "心得已满" : actionError(props.game, "study"),
  },
  {
    label: "筹措盘缠 · 最多三月",
    hint: "劳作每月收入；用于灵草、功法与灵器",
    intent: { type: "advance", activity: "work", months: 3 } as Intent,
    error: actionError(props.game, "work"),
  },
  {
    label: "闭关固本 · 六月",
    hint: `根基 ${props.game.foundation}/24；消耗灵石 8，增加根基 6`,
    intent: { type: "prepare", kind: "retreat" } as Intent,
    error: preparationError(props.game, "retreat"),
  },
  {
    label: "修炼至下一段进展 · 最多十二月",
    hint: `修为 ${props.game.qi}/360；遇剧情立即停下，不替你做选择`,
    intent: { type: "advance", activity: "cultivate", months: 12 } as Intent,
    error: actionError(props.game, "cultivate"),
  },
  {
    label: "养伤休整 · 最多三月",
    hint: `当前伤势 ${props.game.injury}；伤势会降低过关把握`,
    intent: { type: "advance", activity: "rest", months: 3 } as Intent,
    error: actionError(props.game, "rest"),
  },
]);
const visibleChoices = computed(() =>
  choices.value.filter(({ action }) => {
    const r = road.value;
    if (
      ["challenge", "shelteredChallenge", "art", "relic", "friend"].includes(
        action,
      ) &&
      (!showLegacy.value || r.passed)
    )
      return false;
    if (action === "thanks") return !r.thanked;
    if (action === "talk") return !r.met;
    if (action === "accept") return r.met && !r.commission;
    if (action === "deliver" || action === "verify")
      return r.commission && !r.map;
    if (action === "invite") return r.map && !r.ally;
    if (action === "inspect") return r.obstacle === "none";
    if (action === "shelteredChallenge") return r.obstacle !== "none";
    if (action === "survey") return !r.surveyed;
    return true;
  }),
);
const person = computed(() =>
  echo.value
    ? { name: echo.value.name, image: echo.value.image, line: echo.value.quote }
    : road.value.stage === "home"
      ? {
          name: "温蘅",
          image: "/characters/wenheng.png",
          line:
            props.game.adventure.method === "medicine"
              ? "药气没走岔，伤口也收住了。那几味药的分量，你还记得吧？"
              : props.game.adventure.method === "guide"
                ? "陆迟来过了，说你们一路照应，没走散。锅里还有汤，自己盛。"
                : "肩上磨破了吧？袖子挽起来，我给你敷点药。",
        }
      : road.value.stage === "pass"
        ? {
            name: "青嶂",
            image: "/characters/qingzhang.jpg",
            line: road.value.discoveries.includes("marks")
              ? "那道刻痕通到背风处。脚踩石阶，别碰旁边的草根。"
              : "站住。听见石缝里那声响没有？下一阵风就要到了。",
          }
        : {
            name:
              road.value.stage === "market" ||
              (road.value.stage === "camp" && road.value.ally)
                ? "郁青"
                : "郁青留下的话",
            image: "/characters/yuqing.jpg",
            line:
              road.value.discoveries.includes("names") &&
              road.value.stage === "market"
                ? "原来这些年，是他替我们守着回来的路。"
                : road.value.surveyed && road.value.stage === "market"
                  ? "你留下的路，已经有人在走。"
                  : ["beyond", "lookout"].includes(road.value.stage)
                    ? "旅亭看见的，也替我记下来。"
                    : road.value.ally
                      ? "你护住气息，我替你辨路。遇到险处，先喊我。"
                      : "这张图沾过水，东边那条线花了。你若走到旅亭，替我核一核。",
          },
);
</script>
<template>
  <section
    ref="panel"
    class="adventure-panel road-panel desktop-scene"
    :data-weather="scene.mood"
    :data-reading-size="readingSize"
    @keydown="keyboard"
    aria-label="走出听松山主线"
  >
    <div class="road-toolbar">
      <span>第二卷 · 行路</span>
      <label
        >阅读字号
        <select v-model="readingSize" aria-label="阅读字号">
          <option value="standard">标准</option>
          <option value="large">大</option>
          <option value="largest">特大</option>
        </select>
      </label>
    </div>
    <RoadEpilogue
      v-if="showEpilogue"
      :game="game"
      :locked="locked"
      @return="epilogueDismissed = true"
      @continue="emit('mist')"
    />
    <template v-else>
      <SceneBackdrop
        :key="road.stage"
        :image="scene.image"
        :title="scene.name"
        eyebrow="第二卷 · 航图之外"
        :body="scene.body"
        :speaker="person.name"
        :portrait="person.image"
        :quote="person.line"
      >
        <SceneResponse
          v-if="receipt"
          :text="road.result"
          :receipt="
            receipt?.scene?.chapter === 'road' ||
            (receipt?.scene?.chapter === 'adventure' &&
              game.adventure.step === 'done')
              ? receipt
              : null
          "
        />
      </SceneBackdrop>
      <section class="scene-controls" aria-label="行路与准备操作区">
        <h3 class="controls-heading">行路与准备</h3>
        <ol class="chapter-track" aria-label="第二卷进度">
          <li :class="{ passed: road.thanked }">归家回访</li>
          <li :class="{ passed: road.map }">坊市补图</li>
          <li :class="{ passed: road.obstacle !== 'none' }">看清险阻</li>
          <li :class="{ passed: road.passed }">越过山口</li>
          <li :class="{ passed: road.surveyed }">为后来者记路</li>
        </ol>
        <div class="adventure-task">
          <span class="eyebrow">眼下要做的事</span>
          <h2>{{ roadGoal(game) }}</h2>
          <p>
            {{ game.realm ? "筑基" : "炼气" }} · 灵石 {{ game.stones }} · 灵草
            {{ game.herbs }} · 神识 {{ game.sense }} · 心得 {{ game.study }}
          </p>
        </div>
        <ExpeditionPanel
          v-if="
            ['pass', 'camp'].includes(road.stage) &&
            road.map &&
            (!road.passed || game.expedition.accepted)
          "
          :game="game"
          :busy="busy"
          @act="emit('act', $event)"
          @cultivate="emit('cultivate')"
        />
        <div class="adventure-actions">
          <button
            v-for="choice in visibleChoices"
            :key="choice.action"
            :disabled="locked || !!roadError(game, choice.action)"
            @click="emit('act', { type: 'road', action: choice.action })"
          >
            <span
              >{{ choice.label
              }}<small v-if="roadError(game, choice.action)">{{
                roadError(game, choice.action)
              }}</small></span
            ><span>→</span>
          </button>
        </div>
        <button
          v-if="road.surveyed && road.stage === 'lookout'"
          class="full"
          @click="epilogueDismissed = false"
        >
          回看青嶂关篇章结语
        </button>
        <section v-if="road.surveyed" class="mist-invitation">
          <span class="eyebrow">第三卷 · 雾海来信</span>
          <h3>
            {{
              game.adventure.mist.stage === "dormant"
                ? "失踪者寄来的新信"
                : "那封信的故事，还在这里"
            }}
          </h3>
          <p>
            {{
              game.adventure.mist.stage === "dormant"
                ? "归路重开后，旅亭收到陈渡的旧信。陆迟认出信上的护路印，与父亲的旧物有关。你想先找人问，还是先查信阵？"
                : "返回本章保留的地点、线索与同行约定。"
            }}
          </p>
          <button class="primary full" :disabled="locked" @click="emit('mist')">
            {{
              game.adventure.mist.stage === "dormant"
                ? "拆开来信 · 开启第三卷"
                : "继续雾海来信"
            }}
            →
          </button>
        </section>
        <section
          v-if="
            road.stage === 'pass' && road.obstacle !== 'none' && !road.passed
          "
          class="pass-solutions"
          aria-label="选择留给后来人的归路"
        >
          <h3>你要留下怎样的归路？</h3>
          <p class="keyboard-hint">
            在此面板内按 1 / 2 / 3 观察医道、剑道、识阵；实施请点击按钮。Esc
            收起手记与旧路。
          </p>
          <p>
            先观察，再决定。观察不扣资源，可以改看另一条路；真正实施后，本世的道路和人物回应会固定下来。满足条件即成功，不掷骰。
          </p>
          <article
            v-for="key in solutionKeys"
            :key="key"
            class="road-plan"
            :class="{ 'chosen-solution': road.prepared === key }"
          >
            <h4>{{ passSolutions[key].name }}</h4>
            <p>{{ passSolutions[key].consequence }}</p>
            <p class="fineprint">
              {{ passSolutions[key].requirement }}均需筑基、伤势低于
              3；不推进月份。
            </p>
            <button
              v-if="road.prepared !== key"
              :disabled="
                locked || !!roadError(game, passSolutions[key].prepare)
              "
              @click="
                emit('act', {
                  type: 'road',
                  action: passSolutions[key].prepare,
                })
              "
            >
              {{ passSolutions[key].observe }}
              <small>{{
                roadError(game, passSolutions[key].prepare) ||
                "只观察，暂不实施"
              }}</small>
            </button>
            <template v-else>
              <p>{{ passSolutions[key].finding }}</p>
              <button
                class="primary"
                :disabled="
                  locked || !!roadError(game, passSolutions[key].finish)
                "
                @click="
                  emit('act', {
                    type: 'road',
                    action: passSolutions[key].finish,
                  })
                "
              >
                {{ passSolutions[key].commit }}
                <small>{{
                  roadError(game, passSolutions[key].finish) ||
                  "按上述代价实施 · 本世无法改选"
                }}</small>
              </button>
            </template>
          </article>
        </section>
        <details
          v-if="observations.length"
          class="scene-investigation"
          aria-label="环顾四周调查区"
        >
          <summary>环顾四周 · 可选调查</summary>
          <p>
            可选调查，不推进月份。发现会留在手记里，也可能改变你过关的办法。
          </p>
          <button
            v-for="object in observations"
            :key="object.key"
            :disabled="locked || !!roadError(game, object.action)"
            @click="emit('act', { type: 'road', action: object.action })"
          >
            <span class="clue-symbol" aria-hidden="true">{{
              road.discoveries.includes(object.key) ? "✓" : "◇"
            }}</span>
            <span
              ><strong>{{ object.name }}</strong
              ><small>{{
                roadError(game, object.action) || object.hint
              }}</small></span
            ><span aria-hidden="true">→</span>
          </button>
        </details>
        <details v-if="road.discoveries.length" class="road-journal">
          <summary>
            行路手记 · {{ road.discoveries.length }} 处发现{{
              hasShelteredRoute(game) ? " · 已找到避风路" : ""
            }}
          </summary>
          <article v-for="clue in road.discoveries" :key="clue">
            <h4>{{ roadClues[clue].name }}</h4>
            <p>{{ roadClues[clue].text }}</p>
          </article>
        </details>
        <aside
          v-if="echo && road.solution !== 'none' && road.solution !== 'legacy'"
          class="road-plan"
          aria-label="本世归路"
        >
          <h3>{{ passSolutions[road.solution].name }} · 本世归路</h3>
          <p>{{ passSolutions[road.solution].consequence }}</p>
        </aside>
        <button
          v-if="['pass', 'camp'].includes(road.stage) && !road.passed"
          class="quiet"
          :aria-expanded="showLegacy"
          @click="showLegacy = !showLegacy"
        >
          {{ showLegacy ? "收起" : "展开" }}沿旧路自行过关 ·
          只求通行，不改变山口
        </button>
        <div
          v-if="
            showLegacy &&
            ['pass', 'camp'].includes(road.stage) &&
            road.obstacle !== 'none' &&
            !road.passed
          "
          class="road-plan"
        >
          <h3>
            {{
              road.obstacle === "mist"
                ? "已知危险：迷雾误导感知"
                : "已知危险：罡风连续冲击"
            }}
          </h3>
          <p>
            当前准备方向：{{
              {
                none: "尚未选择",
                art: "功法护体",
                relic: "灵器御风",
                friend: "同行辨路",
              }[road.route]
            }}
            · {{ road.ally ? "郁青已应约" : "尚未邀请同行" }}
          </p>
          <p>
            {{ game.realm ? "当前过关把握" : "筑基后按当前准备估计" }}：<strong
              >{{ roadDetails(game).chance }}%</strong
            >；充分准备可达 100%。正面过关失败增加 1
            伤势；两种过关方式都保留航图、装备与同行约定。
          </p>
          <p v-if="hasShelteredRoute(game)" class="sheltered-hint">
            你已串起两处线索：避风路把握
            {{ roadDetails(game, "sheltered").chance }}%，多用灵石
            2，失败不新增伤势。仍需筑基与实际准备。
          </p>
          <details>
            <summary>查看把握来自哪里</summary>
            <p v-for="term in roadDetails(game).terms" :key="term.name">
              {{ term.name }}：{{ term.value >= 0 ? "+" : "" }}{{ term.value }}
            </p>
            <p>
              每次有效挑战从存档种子抽取 1–100；不高于把握即成功。刷新不重抽。
            </p>
          </details>
        </div>

        <section
          v-if="road.stage === 'market' || road.stage === 'camp'"
          class="road-plan"
          aria-label="在场景中准备"
        >
          <h3>
            {{
              road.stage === "market"
                ? "坊市便民与委托准备"
                : "为眼前的山口安排修行"
            }}
          </h3>
          <p v-if="road.stage === 'camp' && !road.passed" class="camp-guidance">
            {{
              game.realm === 1
                ? "你已经筑基。返回青嶂关观察一种解法，再按它的条件准备；不必练满神识、剑意或炼制全部灵器。"
                : game.qi < 360
                  ? "先用「修炼至下一段进展」积累修为，遇到陆迟的故事会自动停下。修为达到 360 后可查看突破；固本和丹药用于提高把握，不必把所有准备项做完。"
                  : "修为已足，可以查看突破风险。若想提高把握，可闭关固本或准备筑基丹；突破成功后返回山口选择解法。"
            }}
          </p>
          <div class="road-preparations">
            <button
              v-if="road.stage === 'camp' && game.realm === 0"
              :disabled="locked || !!preparationError(game, 'refine')"
              @click="emit('act', { type: 'prepare', kind: 'refine' })"
            >
              炼制筑基丹 · 三月
              <small>{{
                preparationError(game, "refine") ||
                "提升突破把握；可先购药，突破前再决定是否服用"
              }}</small>
            </button>
            <button
              :disabled="locked || game.stones < 8"
              @click="emit('act', { type: 'supplies' })"
            >
              购灵草 4 · 灵石 −8<small>用于交药、炼丹或炼器</small>
            </button>
            <template v-if="road.stage === 'camp' && road.route === 'art'"
              ><button
                :disabled="
                  locked ||
                  game.journey.known.includes('guard') ||
                  game.study < 2 ||
                  game.stones < 20
                "
                @click="emit('act', { type: 'learn', technique: 'guard' })"
              >
                学习护身诀 · 心得 2 / 灵石 20<small
                  >心得不扣除；已有任意功法也可在完整面板装配</small
                ></button
              ><button
                :disabled="
                  locked ||
                  !game.journey.known.includes('guard') ||
                  game.journey.support === 'guard'
                "
                @click="emit('act', { type: 'equip', technique: 'guard' })"
              >
                装配护身诀
              </button></template
            >
            <template v-if="road.stage === 'camp' && road.route === 'relic'"
              ><button
                :disabled="locked || !!forgeError(game, 'vial')"
                @click="emit('act', { type: 'forge', relic: 'vial' })"
              >
                {{
                  game.journey.relics.vial ? "精炼" : "炼制"
                }}归元灵瓶<small>{{
                  forgeError(game, "vial") || "心得 2 / 灵石 −24 / 灵草 −4"
                }}</small></button
              ><button
                :disabled="
                  locked ||
                  !game.journey.relics.vial ||
                  game.journey.equipped === 'vial'
                "
                @click="emit('act', { type: 'equipRelic', relic: 'vial' })"
              >
                装配归元灵瓶
              </button></template
            >
            <button
              v-if="road.stage === 'camp' && road.route === 'friend'"
              :disabled="locked || !!roadError(game, 'invite')"
              @click="emit('act', { type: 'road', action: 'invite' })"
            >
              请郁青同行<small>{{
                roadError(game, "invite") || "朋友辨路，你仍需自己筑基"
              }}</small>
            </button>
            <template v-if="road.stage === 'camp' && !road.passed">
              <button
                :disabled="
                  locked ||
                  game.journey.known.includes('herb') ||
                  game.study < 2 ||
                  game.stones < 20
                "
                @click="emit('act', { type: 'learn', technique: 'herb' })"
              >
                求教辨草录 · 灵石 20 / 心得 2<small
                  >散修、剑修也可学会医道解法；医修无需另学</small
                >
              </button>
              <button
                :disabled="locked || !!actionError(game, 'train')"
                @click="
                  emit('act', { type: 'advance', activity: 'train', months: 3 })
                "
              >
                历练剑意 · 最多三月<small
                  >剑意 {{ game.mastery }}；剑道解法需要剑意 4 或装配灵剑，根基
                  12</small
                >
              </button>
            </template>
            <button
              v-for="item in growth.filter(
                (x) =>
                  road.stage === 'camp' ||
                  ['study', 'meditate', 'work'].includes(
                    x.intent.type === 'advance' ? x.intent.activity : '',
                  ),
              )"
              :key="item.label"
              :disabled="locked || !!item.error"
              @click="emit('act', item.intent)"
            >
              {{ item.label }}<small>{{ item.error || item.hint }}</small>
            </button>
          </div>
          <button
            v-if="road.stage === 'camp' && !road.passed"
            class="primary full"
            :disabled="locked || game.realm === 1 || game.qi < 360"
            @click="emit('breakthrough')"
          >
            {{
              game.realm === 1
                ? "筑基已成 · 可返回山口"
                : "准备突破筑基 · 查看丹药与把握"
            }}<small v-if="game.realm === 1"
              >三种解法不要求全部准备，按你选中的路线补齐条件即可。</small
            ><small v-else-if="game.qi < 360"
              >修为 {{ game.qi }}/360；先修炼至 360，遇到剧情先处理。</small
            ><small v-else
              >当前不服丹把握
              {{
                breakthroughDetails(game, false).chance
              }}%；先确认风险再尝试</small
            >
          </button>
        </section>
        <div class="adventure-actions">
          <button @click="road.surveyed ? emit('map') : emit('cultivate')">
            {{
              road.surveyed
                ? "展开山河见闻，寻访回春谷与雾海"
                : "查看完整功法、灵器与修行面板"
            }}
            →
          </button>
        </div>
        <p class="adventure-footnote">
          交谈、调查和实施解法不计修行月份；修炼按真实月份推进，遇剧情暂停。
          三种解法满足条件后必定成功，本世不能改选；也可沿旧路按把握过关。首次通过后可免费往返。
        </p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.road-panel {
  --road-reading: 16px;
}
.road-panel[data-reading-size="large"] {
  --road-reading: 18px;
}
.road-panel[data-reading-size="largest"] {
  --road-reading: 20px;
}
.road-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #ebe5d6;
  border-radius: 10px 10px 0 0;
}
.road-toolbar label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.road-toolbar select {
  padding: 6px 10px;
  color: inherit;
  background: #faf7ef;
  border: 1px solid #a9b5a2;
  border-radius: 6px;
}
.road-panel :deep(.scene-prose),
.road-panel :deep(.scene-speaker p),
.road-panel :deep(.scene-response p),
.scene-controls p,
.scene-controls button,
.scene-controls button small,
.scene-controls .fineprint {
  font-size: var(--road-reading);
  line-height: 1.8;
}
.pass-solutions > .road-plan {
  margin: 0;
}
.keyboard-hint {
  color: #52684f;
}
@media (min-width: 1100px) {
  .road-panel {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
    overflow: visible;
  }
  .road-toolbar {
    grid-column: 1 / -1;
  }
  .road-panel :deep(.scene-backdrop) {
    position: sticky;
    top: 16px;
    min-height: min(760px, calc(100dvh - 32px));
    border-radius: 0 0 0 10px;
  }
  .road-panel :deep(.scene-narrative) {
    padding: 64px 28px 28px;
  }
  .scene-controls {
    min-width: 0;
    border-top: 0;
    border-left: 1px solid #c6cbb9;
    border-radius: 0 0 10px 0;
  }
}
@media (max-width: 600px) {
  .keyboard-hint {
    display: none;
  }
  .road-toolbar {
    padding: 10px 12px;
  }
}

.pass-solutions {
  display: grid;
  gap: 12px;
}
.pass-solutions h4 {
  margin: 0;
  font-size: 1.1rem;
}
.pass-solutions button {
  width: 100%;
  min-height: 48px;
  white-space: normal;
  text-align: left;
}
.pass-solutions small {
  display: block;
  margin-top: 6px;
}
.chosen-solution {
  border-left: 3px solid #617c57;
}
</style>
