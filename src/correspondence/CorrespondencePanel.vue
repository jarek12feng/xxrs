<script setup lang="ts">
import { messageLead } from "./leads";
import PersonalContacts from "./PersonalContacts.vue";
import { computed, onMounted, ref, watch } from "vue";
import type { Intent, State } from "../world";
import {
  correspondenceQuote,
  messageStatus,
  type CorrespondenceAction,
} from "./rules";
import { messageThreads, correspondenceThread, commitments } from "./view";
import { messageSources } from "./sources";
import { messageKinds, type Letter, type MessageKind } from "./state";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{
  act: [intent: Intent];
  navigate: [destination: Letter["destination"]];
}>();
const names: Record<MessageKind, string> = {
  rumor: "坊间传闻",
  news: "人物与世事",
  opportunity: "机缘风声",
  notice: "会讯通知",
  invitation: "邀约",
  request: "求助",
  reply: "往来回音",
};
const filter = ref<"all" | "unread" | "read" | "followed" | MessageKind>("all");
const page = ref(0);
const selected = ref("");
const letters = computed(() => props.game.correspondence.letters);
const filtered = computed(() =>
  messageThreads(letters.value).filter((group) =>
    group.letters.some(
      (l) =>
        filter.value === "all" ||
        (filter.value === "unread"
          ? !l.read
          : filter.value === "read"
            ? l.read
            : filter.value === "followed"
              ? l.followed
              : l.kind === filter.value),
    ),
  ),
);
const pages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / 12)),
);
const visible = computed(() =>
  filtered.value.slice(page.value * 12, (page.value + 1) * 12),
);
const appointments = computed(() => commitments(props.game));
const threadLetters = computed(() =>
  letters.value.filter(
    (l) => correspondenceThread(l.id) === correspondenceThread(selected.value),
  ),
);
function openThread(group: ReturnType<typeof messageThreads>[number]) {
  const matching = group.letters.filter((l) =>
    filter.value === "unread"
      ? !l.read
      : filter.value === "read"
        ? l.read
        : filter.value === "followed"
          ? l.followed
          : filter.value === "all" || l.kind === filter.value,
  );
  open(
    matching.find((l) => !l.read) ??
      matching[matching.length - 1] ??
      group.latest,
  );
}
const lead = computed(() =>
  current.value ? messageLead(props.game, current.value) : "",
);
const current = computed(() =>
  letters.value.find((l) => l.id === selected.value),
);
watch(filter, () => {
  page.value = 0;
});
watch(pages, (n) => {
  page.value = Math.min(page.value, n - 1);
});
function act(action: CorrespondenceAction) {
  emit("act", { type: "correspondence", action });
}
function open(l: Letter) {
  selected.value = l.id;
  if (!l.read) act({ kind: "read", letter: l.id });
}
function error(kind: "accept" | "decline" | "confirm") {
  return current.value
    ? correspondenceQuote(props.game, { kind, letter: current.value.id })
    : "";
}
onMounted(() => {
  const known = new Set(letters.value.map((l) => l.id));
  if (
    !correspondenceQuote(props.game, { kind: "collect" }) &&
    messageSources(props.game).some((l) => !known.has(l.id))
  )
    act({ kind: "collect" });
});
</script>
<template>
  <section class="correspondence" aria-label="传讯与旧信">
    <p class="mail-intro">
      驿路捎信，洞府留笺。这里留着已经送到你手中的消息；回信与赴约由你决定。
    </p>
    <PersonalContacts :game="game" :busy="busy" @act="emit('act', $event)" />
    <details v-if="appointments.length" class="mail-appointments">
      <summary>我的约定与关注会期 · {{ appointments.length }}</summary>
      <article v-for="a in appointments" :key="a.id">
        <h3>{{ a.title }}</h3>
        <p>
          {{ a.place }} ·
          {{ a.deadline === null ? "无硬性截止" : `第${a.deadline}月截止` }}
        </p>
        <p>{{ a.preparation }}</p>
        <p>
          {{
            a.travelMonths === null
              ? "完整行程尚不可确认，请在地图核对。"
              : a.travelMonths === 0
                ? "已在目的地。"
                : `按当前可用路线，至少需${a.travelMonths}月；出发前仍须核对现场条件。`
          }}
        </p>
        <button :disabled="busy" @click="emit('navigate', a.destination)">
          查看去路与安排
        </button>
      </article>
    </details>
    <div class="mail-toolbar">
      <label
        >查阅
        <select v-model="filter">
          <option value="all">全部往来</option>
          <option value="unread">未读来信</option>
          <option value="read">已读来信</option>
          <option value="followed">我关注的</option>
          <option v-for="kind in messageKinds" :key="kind" :value="kind">
            {{ names[kind] }}
          </option>
        </select></label
      >
      <span
        >{{ letters.filter((l) => !l.read).length }} 封未读 ·
        {{ letters.length }} 封留存</span
      >
    </div>
    <div class="mail-read-filters" aria-label="按阅读状态查阅">
      <button :aria-pressed="filter === 'all'" @click="filter = 'all'">
        全部 {{ letters.length }}
      </button>
      <button :aria-pressed="filter === 'unread'" @click="filter = 'unread'">
        未读 {{ letters.filter((l) => !l.read).length }}
      </button>
      <button :aria-pressed="filter === 'read'" @click="filter = 'read'">
        已读 {{ letters.filter((l) => l.read).length }}
      </button>
    </div>
    <p v-if="!letters.length" class="mail-empty">
      尚无来信。结识同道、留下信路，或在拍卖行领过目录后，消息会沿旧路送来。
    </p>
    <div v-else class="mail-layout">
      <div class="mail-list">
        <p v-if="!visible.length">此类暂无消息。</p>
        <button
          v-for="group in visible"
          :key="group.id"
          class="mail-card"
          :class="{
            selected: correspondenceThread(selected) === group.id,
            unread: group.unread > 0,
          }"
          :disabled="busy"
          @click="openThread(group)"
        >
          <small
            >{{ names[group.latest.kind] }} · {{ group.latest.sender }}
            {{ group.letters.some((l) => l.followed) ? "· 已关注" : "" }}</small
          >
          <span class="mail-heading"
            ><strong>{{ group.title }}</strong
            ><span
              class="mail-read-badge"
              :class="{ fresh: group.unread > 0 }"
              >{{ group.unread ? `未读 ${group.unread}` : "已读" }}</span
            ></span
          >
          <small
            >{{ group.letters.length }} 封往来 · 最近第
            {{ group.latest.received }} 月 ·
            {{ messageStatus(game, group.latest) }}</small
          >
        </button>
        <div class="mail-pages">
          <button :disabled="page === 0" @click="page--">上一页</button
          ><span>{{ page + 1 }} / {{ pages }}</span
          ><button :disabled="page + 1 >= pages" @click="page++">下一页</button>
        </div>
      </div>
      <article v-if="current" class="mail-letter" aria-live="polite">
        <nav
          v-if="threadLetters.length > 1"
          class="mail-thread"
          aria-label="此事往来"
        >
          <button
            v-for="letter in threadLetters"
            :key="letter.id"
            :disabled="busy"
            :aria-current="selected === letter.id ? 'true' : undefined"
            @click="open(letter)"
          >
            {{ letter.read ? "已读" : "未读" }} · 第{{ letter.received }}月 ·
            {{ letter.title }}
          </button>
        </nav>
        <p class="mail-origin">
          {{ current.sender }} ·
          {{
            {
              personal: "本人来信／亲历记录",
              public: "公开告知",
              hearsay: "转述传闻",
            }[current.reliability]
          }}
        </p>
        <h3>
          {{ current.title }}
          <span class="mail-read-badge" :class="{ fresh: !current.read }">{{
            current.read ? "已读" : "未读"
          }}</span>
        </h3>
        <p class="mail-body">{{ current.body }}</p>
        <p class="mail-state">现况：{{ messageStatus(game, current) }}</p>
        <p v-if="lead" class="mail-lead">相关线索：{{ lead }}</p>
        <p v-if="current.response !== 'none'">
          你的回信：{{
            {
              accepted: "愿意同行",
              declined: "暂且谢绝",
              confirmed: "已核验来信",
              none: "",
            }[current.response]
          }}
        </p>
        <div class="mail-actions">
          <button
            :disabled="
              busy ||
              !!correspondenceQuote(game, {
                kind: 'follow',
                letter: current.id,
              })
            "
            @click="act({ kind: 'follow', letter: current.id })"
          >
            {{ current.followed ? "取消关注" : "记下此事" }}
          </button>
          <button
            :disabled="busy"
            @click="emit('navigate', current.id.startsWith('friend:su:') ? 'world' : current.destination)"
          >
            {{
              current.id.startsWith("friend:su:") ? "查看古渡去路" : current.destination === "story"
                ? "回到现场"
                : current.destination === "arena"
                  ? "查看擂台与榜单"
                  : current.destination === "relationship"
                    ? "查看人物"
                    : current.destination === "sect"
                      ? "查看师门"
                      : "查看地图与去路"
            }}
          </button>
        </div>
        <template v-if="current.id === 'pact:invitation'">
          <div class="mail-actions">
            <button
              :disabled="busy || !!error('accept')"
              @click="act({ kind: 'accept', letter: current.id })"
            >
              回信 · 愿意同行</button
            ><button
              :disabled="busy || !!error('decline')"
              @click="act({ kind: 'decline', letter: current.id })"
            >
              回信 · 暂且谢绝
            </button>
          </div>
          <p>
            {{
              error("accept") ||
              "回信只定约，不扣年月、不直接赴府。照玄去路仍须满足原有条件。"
            }}
          </p>
        </template>
        <template v-if="current.id === 'reunion:invitation'">
          <button
            :disabled="busy || !!error('accept')"
            @click="act({ kind: 'accept', letter: current.id })"
          >
            回信 · 约在古渡相见
          </button>
          <p>
            {{
              error("accept") ||
              "只定约，不代替旅行。到外海古渡寻找侧堤故人之约；手头的事可先做妥。"
            }}
          </p>
        </template>
        <template v-if="current.id.startsWith('companion:') || current.id.startsWith('friend:su:')">
          <button
            :disabled="busy || !!error('confirm')"
            @click="act({ kind: 'confirm', letter: current.id })"
          >
            核验来信，记入人物经历
          </button>
          <p>
            {{
              error("confirm") ||
              "核验后按这封可靠来信更新已知近况，不替对方推进修行。"
            }}
          </p>
        </template>
        <small v-if="current.followed"
          >已留在“我关注的”。普通来信不会打断闭关；赴会前请核对日期和路程。</small
        >
      </article>
      <div v-else class="mail-empty">展开一封信，看看故人和世间的近况。</div>
    </div>
  </section>
</template>
<style scoped>
.mail-appointments {
  border: 1px solid #8e8062;
  padding: 12px;
  margin-bottom: 18px;
}
.mail-appointments article + article {
  border-top: 1px solid #536064;
}
.mail-thread {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}
.mail-thread button {
  text-align: left;
}
.mail-thread button[aria-current="true"] {
  border-color: #f0d7a4;
}
.correspondence {
  color: #e7dfc9;
}
.mail-intro,
.mail-origin {
  color: #bfb7a4;
}
.mail-toolbar,
.mail-pages,
.mail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.mail-toolbar {
  justify-content: space-between;
  margin-bottom: 18px;
}
.mail-toolbar select {
  background: #17262b;
  color: #f1e4c6;
  padding: 8px;
  border: 1px solid #8e8062;
  border-radius: 4px;
}
.mail-layout {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(300px, 1.7fr);
  gap: 24px;
  align-items: start;
}
.mail-list {
  display: grid;
  gap: 8px;
}
.mail-card {
  display: grid;
  gap: 7px;
  text-align: left;
  width: 100%;
  padding: 12px;
  background: #17292dcc;
  border: 1px solid #566467;
  color: #d8d5c9;
  border-radius: 5px;
}
.mail-read-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.mail-read-filters button[aria-pressed="true"] {
  background: #d4b16a;
  color: #14231f;
  border-color: #ecd49e;
}
.mail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mail-read-badge {
  display: inline-block;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  padding: 2px 7px;
  border-radius: 4px;
  background: #293f3c;
  color: #c5d3ce;
  border: 1px solid #718a80;
}
.mail-read-badge.fresh {
  background: #e0be79;
  color: #202a22;
  border-color: #f5dc9d;
}
.mail-card.unread {
  border-left: 3px solid #d4b16a;
}
.mail-card.selected {
  background: #304348;
  border-color: #e0bc74;
}
.mail-card strong {
  font-size: 1rem;
  color: #f3dfae;
}
.mail-card small {
  line-height: 1.5;
}
.mail-letter {
  padding: 22px;
  border: 1px solid #8f805a;
  background: #1c292deb;
  border-radius: 6px;
  position: sticky;
  top: 0;
}
.mail-letter h3 {
  font-size: 1.4rem;
  color: #efd59d;
}
.mail-body {
  white-space: pre-line;
  line-height: 1.95;
}
.mail-state {
  border-top: 1px solid #536064;
  padding-top: 15px;
  color: #d5c49c;
}
.mail-actions {
  margin: 16px 0;
}
.mail-empty {
  padding: 35px 18px;
  text-align: center;
  color: #bfb7a4;
}
.mail-pages {
  justify-content: space-between;
}
.mail-letter small {
  display: block;
  line-height: 1.7;
}
@media (max-width: 700px) {
  .mail-layout {
    grid-template-columns: 1fr;
  }
  .mail-letter {
    position: static;
  }
  .mail-list {
    max-height: 300px;
    overflow: auto;
  }
}
</style>
