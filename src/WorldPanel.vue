<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  places,
  opponents,
  techniques,
  relics,
  forgeError,
  explorationError,
  promotionError,
  queueActions,
  actionError,
  preparationError,
  type State,
  type Intent,
  type QueueAction,
} from "./core";
import ChallengeCard from "./ChallengeCard.vue";
import SocialPanel from "./SocialPanel.vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import SceneResponse from "./SceneResponse.vue";
import type { ActionReceipt } from "./action-feedback";
const props = defineProps<{
  game: State;
  busy: boolean;
  running: boolean;
  receipt?: ActionReceipt | null;
}>();
const emit = defineEmits<{ act: [intent: Intent]; runQueue: [] }>();
const tab = ref<
  "world" | "sect" | "skills" | "queue" | "gear" | "relationship" | "arena"
>("world");
watch(
  () => !!props.game.social.arena.duel,
  (active) => {
    if (active) tab.value = "arena";
  },
  { immediate: true },
);
const job = ref<QueueAction>("gather"),
  repeat = ref(3);
const locked = computed(
  () =>
    props.busy ||
    props.running ||
    props.game.status !== "alive" ||
    !!props.game.pending ||
    !!props.game.social.scene ||
    !!props.game.social.arena.duel,
);
const mentors = {
  dan: {
    name: "温蘅",
    hall: "丹堂",
    image: "/characters/wenheng.png",
    quote: "学会救人，才算读懂丹方。",
    story:
      "曾为寻找救治师父的药方远行，如今留在山门教人辨草。她记得每一位病人的名字。",
    gift: "辨草录 → 长春诀",
  },
  jian: {
    name: "季衡",
    hall: "剑院",
    image: "/characters/jiheng.png",
    quote: "守得住身后的人，再谈剑锋。",
    story:
      "年轻时只求争胜，一次护送失利后，才明白剑锋的分量。如今亲自守每一班夜路。",
    gift: "护身诀 → 听松剑经",
  },
};
const queueError = computed(() => {
  const q = props.game.journey.queue[0];
  return !q
    ? "先添加修行安排"
    : q.action === "refine"
      ? preparationError(props.game, "refine")
      : actionError(props.game, q.action);
});
const rooms = {
  gear: {
    title: "灯下炼器",
    image: "/scenes/apothecary.jpg",
    body: "炉火映着瓶身与剑纹。你把一路遇过的风瘴记在旁边，决定这一回要为哪一种险境准备。",
  },
  skills: {
    title: "藏经小阁",
    image: "/scenes/moon-terrace.png",
    body: "灯下翻过一页丹经，又听见院外的练剑声。学过的法门很多，真正带上旅途的，却要由你选择。",
  },
  queue: {
    title: "洞府长夜",
    image: "/scenes/moon-terrace.png",
    body: "你将接下来的修行写成笺札，放在灯旁。若有故人来访，便先停下手中的事，听他把话说完。",
  },
};
const room = computed(() =>
  tab.value === "gear" || tab.value === "skills" || tab.value === "queue"
    ? rooms[tab.value]
    : null,
);
const mapImages = {
  valley: "/scenes/apothecary.jpg",
  peak: "/scenes/mist-path.jpg",
  sea: "/characters/luchi-relic.png",
};
</script>

<template>
  <section class="world-panel" :class="{ 'desktop-room': !!room }">
    <div class="panel-heading">
      <h2>山外有天地</h2>
      <span class="muted">修行，是为了赴一场约</span>
    </div>
    <nav aria-label="山外功能">
      <button :class="{ active: tab === 'world' }" @click="tab = 'world'">
        山河见闻
      </button>
      <button
        :class="{ active: tab === 'relationship' }"
        @click="tab = 'relationship'"
      >
        人物缘分
      </button>
      <button :class="{ active: tab === 'arena' }" @click="tab = 'arena'">
        听松擂台
      </button>
      <button :class="{ active: tab === 'sect' }" @click="tab = 'sect'">
        宗门师承
      </button>
      <button :class="{ active: tab === 'skills' }" @click="tab = 'skills'">
        功法装配
      </button>
      <button :class="{ active: tab === 'gear' }" @click="tab = 'gear'">
        灵器准备
      </button>
      <button :class="{ active: tab === 'queue' }" @click="tab = 'queue'">
        修行安排
      </button>
    </nav>
    <SceneBackdrop
      v-if="room"
      :key="tab"
      :image="room.image"
      :title="room.title"
      :body="room.body"
      eyebrow="听松山居 · 行前准备"
      compact
    />
    <SocialPanel
      v-if="tab === 'relationship' || tab === 'arena'"
      :key="tab"
      :game="game"
      :mode="tab"
      :busy="busy"
      :running="running"
      @act="emit('act', $event)"
    />
    <div v-else-if="tab === 'world'" class="world-content">
      <p class="muted">
        回春谷 → 筑基后的雾岭 →
        雾海孤灯。每次探索用时一月；先处理待决事件，伤势不超过 2。
      </p>
      <article
        v-for="(place, id) in places"
        :key="id"
        class="map-card scene-map desktop-scene"
        :class="{ finished: game.journey.maps[id] === 3 }"
      >
        <SceneBackdrop
          :image="mapImages[id]"
          :title="place.name"
          eyebrow="山河见闻"
          :body="
            id === 'valley' && game.journey.maps.valley === 1
              ? '崖边有人呼救，雨水正冲淡另一侧的足迹。你先做什么？'
              : id !== 'valley' &&
                  game.journey.maps[id] === 1 &&
                  game.journey.encounters[id]
                ? opponents[game.journey.encounters[id]!.kind].description
                : place.goal
          "
          compact
          ><SceneResponse
            text=""
            :receipt="receipt?.scene?.place === id ? receipt : null"
        /></SceneBackdrop>
        <section class="scene-controls" :aria-label="place.name + '探索操作区'">
          <div class="panel-heading">
            <h3 class="controls-heading">探索与应对</h3>
            <span
              >{{ game.journey.maps[id] }} / 3 ·
              {{ place.realm ? "筑基" : "炼气" }}</span
            >
          </div>
          <small>{{ place.reward }}</small>
          <p v-if="explorationError(game, id)" class="muted">
            {{ explorationError(game, id) }}
          </p>
          <ChallengeCard
            v-if="id !== 'valley' && game.journey.maps[id] === 1"
            :game="game"
            :place="id"
            :locked="locked"
            @act="emit('act', $event)"
          />
          <template
            v-else-if="id === 'valley' && game.journey.maps.valley === 1"
          >
            <button
              :disabled="
                locked || !!explorationError(game, id) || game.herbs < 2
              "
              @click="
                emit('act', { type: 'explore', place: id, approach: 'rescue' })
              "
            >
              先救人 · 灵草 −2 / 陆迟信任 +1
            </button>
            <button
              :disabled="locked || !!explorationError(game, id)"
              @click="
                emit('act', { type: 'explore', place: id, approach: 'trace' })
              "
            >
              先追查笔记 · 灵石 +8 / 错过见闻
            </button>
          </template>
          <button
            v-else
            :disabled="locked || !!explorationError(game, id)"
            @click="emit('act', { type: 'explore', place: id })"
          >
            {{ game.journey.maps[id] === 0 ? "动身探访" : "继续追寻" }} · 一月
          </button>
        </section>
      </article>
      <details v-if="game.journey.settled" class="retirement">
        <summary>另一种人生：主动轮回</summary>
        <p>
          不会强制结束此世。封存后仍可选择继续探索，或携一项传承重开；阅历不重复发放。
        </p>
        <button :disabled="locked" @click="emit('act', { type: 'retire' })">
          封存此世，查看轮回选择
        </button>
      </details>
    </div>
    <div
      v-else-if="tab === 'gear'"
      class="world-content scene-controls"
      aria-label="灵器操作区"
    >
      <h3 class="controls-heading">炼制与装配</h3>
      <p>
        当前灵器：{{
          game.journey.equipped ? relics[game.journey.equipped].name : "未装配"
        }}
      </p>
      <p class="muted">
        灵器可炼制、装配，筑基后可精炼一次。普通灵器闯关 +10%，精炼
        +20%；针对不同敌人另有作用。一次只装配一件。法宝、灵宝、通天灵宝留待后续境界，不在本版开放。
      </p>
      <article v-for="(r, id) in relics" :key="id" class="map-card">
        <h3>
          {{ r.name }} ·
          {{ ["未炼制", "灵器", "精炼灵器"][game.journey.relics[id]] }}
        </h3>
        <p>{{ r.hint }}</p>
        <p class="muted">
          {{
            forgeError(game, id) || "本次炼制消耗灵石 24、灵草 4；需心得 2。"
          }}
        </p>
        <button
          :disabled="locked || !!forgeError(game, id)"
          @click="emit('act', { type: 'forge', relic: id })"
        >
          {{ game.journey.relics[id] ? "精炼" : "炼制" }} · 灵石 24 / 灵草 4</button
        ><button
          :disabled="
            locked || !game.journey.relics[id] || game.journey.equipped === id
          "
          @click="emit('act', { type: 'equipRelic', relic: id })"
        >
          {{ game.journey.equipped === id ? "已装配" : "装配灵器" }}
        </button>
      </article>
      <button
        :disabled="locked || game.stones < 8"
        @click="emit('act', { type: 'supplies' })"
      >
        坊市购药 · 灵石 −8 / 灵草 +4
      </button>
    </div>
    <div v-else-if="tab === 'sect'" class="world-content">
      <p class="muted">
        宗门提供师承与通行资格，不是唯一道路。散修也可在坊市学同样的功法，以神识
        8、心得 2 识路入山。每世暂可选择一个堂口。
      </p>
      <article
        v-for="(mentor, branch) in mentors"
        :key="branch"
        v-show="
          game.journey.branch === 'none' || game.journey.branch === branch
        "
        class="map-card scene-map desktop-scene"
      >
        <SceneBackdrop
          :image="
            branch === 'dan'
              ? '/scenes/apothecary.jpg'
              : '/scenes/sect-arena.png'
          "
          :title="mentor.hall"
          eyebrow="听松门 · 师承"
          :body="mentor.story"
          :portrait="mentor.image"
          :speaker="mentor.name"
          :quote="mentor.quote"
          compact
        />
        <div class="scene-controls" :aria-label="mentor.hall + '拜师操作区'">
          <h3 class="controls-heading">师门机缘</h3>
          <small>师承功法：{{ mentor.gift }}</small>
          <button
            v-if="game.journey.branch === 'none'"
            :disabled="locked || game.story.stage === 'unmet'"
            @click="emit('act', { type: 'join', branch })"
          >
            拜入{{ mentor.hall }} · 渡口初逢后开放
          </button>
        </div>
      </article>
      <section
        v-if="game.journey.branch !== 'none'"
        class="scene-controls"
        aria-label="宗门事务操作区"
      >
        <h3 class="controls-heading">宗门事务与晋升</h3>
        <p>
          身份：{{ game.journey.rank ? "外门弟子" : "记名弟子" }} · 贡献
          {{ game.journey.contribution }} · 亲历事务
          {{ game.journey.duties }} 次
        </p>
        <div class="world-actions">
          <button
            :disabled="locked || game.herbs < 2"
            @click="emit('act', { type: 'duty', duty: 'herbs' })"
          >
            送药济人<small>一月 / 灵草 −2 / 根基 +1 / 贡献 +2</small>
          </button>
          <button
            :disabled="locked"
            @click="emit('act', { type: 'duty', duty: 'watch' })"
          >
            守护夜路<small>一月 / 伤势 +1 / 炼气修为 +8 / 贡献 +2</small>
          </button>
          <button
            :disabled="locked || game.stones < 3"
            @click="emit('act', { type: 'duty', duty: 'copy' })"
          >
            整理旧卷<small>一月 / 灵石 −3 / 心得 +1 / 贡献 +2</small>
          </button>
        </div>
        <div
          v-if="game.journey.duties >= 3 && !game.journey.mentor"
          class="mentor-question"
        >
          <h3>执事问：你为何修行？</h3>
          <p>几次事务之后，执事终于放下手中的卷宗，认真等你的答案。</p>
          <button
            :disabled="locked"
            @click="emit('act', { type: 'mentor', answer: 'care' })"
          >
            为护住身边的人 · 获赠灵草 4</button
          ><button
            :disabled="locked"
            @click="emit('act', { type: 'mentor', answer: 'seek' })"
          >
            为亲眼看看山外 · 心得 +1
          </button>
        </div>
        <p class="muted">
          {{
            promotionError(game) || "执事认可了你的亲历与心得，可以晋升外门。"
          }}
        </p>
        <button
          :disabled="locked || !!promotionError(game)"
          @click="emit('act', { type: 'promote' })"
        >
          晋升外门 · 贡献 −6 / 主修功法 / 雾岭资格
        </button>
      </section>
    </div>
    <div
      v-else-if="tab === 'skills'"
      class="world-content scene-controls"
      aria-label="功法操作区"
    >
      <h3 class="controls-heading">功法研习与装配</h3>
      <p>
        主修：{{
          game.journey.main ? techniques[game.journey.main].name : "未装配"
        }}
        · 辅修：{{
          game.journey.support
            ? techniques[game.journey.support].name
            : "未装配"
        }}
      </p>
      <p class="muted">
        每类同时生效一本。宗门与探索可授予功法；坊市也出售全部六本，需心得
        2，每本灵石 20。修为加成只在炼气阶段生效。
      </p>
      <article v-for="(t, id) in techniques" :key="id" class="technique-card">
        <div>
          <h3>
            {{ t.name }}
            <small>{{ t.slot === "main" ? "主修" : "辅修" }}</small>
          </h3>
          <p>{{ t.hint }}</p>
        </div>
        <button
          v-if="game.journey.known.includes(id)"
          :disabled="locked || game.journey[t.slot] === id"
          @click="emit('act', { type: 'equip', technique: id })"
        >
          {{ game.journey[t.slot] === id ? "已装配" : "装配" }}
        </button>
        <button
          v-else
          :disabled="locked || game.study < 2 || game.stones < 20"
          @click="emit('act', { type: 'learn', technique: id })"
        >
          坊市求教 · 20 灵石
        </button>
      </article>
    </div>
    <div
      v-else
      class="world-content scene-controls"
      aria-label="修行安排操作区"
    >
      <h3 class="controls-heading">安排接下来的修行</h3>
      <p class="muted">
        仅在线执行，刷新或离开页面后暂停。遇剧情、修为满、材料不足时停下；不自动选择剧情或突破。养伤次数是上限，痊愈即完成。
      </p>
      <div class="queue-form">
        <label
          >行动<select v-model="job">
            <option
              v-for="(label, action) in queueActions"
              :key="action"
              :value="action"
            >
              {{ label }}
            </option>
          </select></label
        ><label
          >次数<input
            v-model.number="repeat"
            type="number"
            min="1"
            max="12" /></label
        ><button
          :disabled="
            locked ||
            game.journey.queue.length >= 8 ||
            !Number.isInteger(repeat) ||
            repeat < 1 ||
            repeat > 12
          "
          @click="emit('act', { type: 'enqueue', action: job, repeat })"
        >
          加入安排
        </button>
      </div>
      <ol>
        <li v-for="(q, i) in game.journey.queue" :key="i">
          {{ queueActions[q.action] }} · 剩余 {{ q.remaining }} 次
        </li>
      </ol>
      <p v-if="queueError" class="muted">{{ queueError }}</p>
      <button :disabled="locked || !!queueError" @click="emit('runQueue')">
        执行安排</button
      ><button
        :disabled="busy || !game.journey.queue.length"
        @click="emit('act', { type: 'clearQueue' })"
      >
        清空安排
      </button>
    </div>
  </section>
</template>
