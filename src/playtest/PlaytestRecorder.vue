<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import type { State } from "../world";
import {
  startRecord,
  appendRecord,
  milestones,
  type PlaytestRecord,
} from "./record";
const props = defineProps<{ game: State | null }>();
const record = ref<PlaytestRecord | null>(null),
  active = ref(false),
  message = ref("");
const build = ref("开发构建（不可用于冻结版盲测）");
function mark(kind: string) {
  if (record.value && active.value)
    appendRecord(record.value, kind, props.game, Date.now());
}
function start() {
  record.value = startRecord(build.value, props.game, Date.now());
  active.value = true;
  mark("开始观察");
  message.value = "正在本机内存记录；离开或刷新前请导出。";
}
function stop() {
  mark("结束观察");
  active.value = false;
  message.value = "记录已结束，可导出保存。";
}
function download() {
  if (!record.value) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(record.value, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `xxrs-playtest-${record.value.startedAt.replace(/[:.]/g, "-")}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
watch(
  () => props.game,
  (after, before) => {
    if (!active.value || !after || after === before) return;
    mark("已保存行动");
    for (const name of milestones(before ?? null, after)) mark(name);
  },
);
const visibility = () =>
  mark(document.hidden ? "页面转入后台" : "页面回到前台");
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (active.value) {
    e.preventDefault();
    e.returnValue = "";
  }
};
onMounted(async () => {
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("beforeunload", beforeUnload);
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}playtest-build.json`,
    );
    if (response.ok) {
      const data = await response.json();
      if (typeof data.id === "string") build.value = data.id;
    }
  } catch {
    /* A development preview has no manifest. */
  }
});
onUnmounted(() => {
  document.removeEventListener("visibilitychange", visibility);
  window.removeEventListener("beforeunload", beforeUnload);
});
</script>
<template>
  <aside class="playtest-recorder" aria-label="自愿试玩记录">
    <details>
      <summary>试玩观察工具 · 本机记录，不上传</summary>
      <p>
        仅记录操作时间、游戏月份和进度节点，不记录角色姓名、剧情正文或存档。记录不能判断是否看懂、是否求助、是否愿意继续；这些由观察者另记。刷新会清空记录，请先导出。
      </p>
      <p>版本：{{ build }}</p>
      <button v-if="!record" @click="start">同意并开始记录</button>
      <template v-if="record">
        <button v-if="active" @click="mark('收到提示（详记观察表）')">
          标记求助
        </button>
        <button v-if="active" @click="mark('外部中断开始')">
          外部中断开始
        </button>
        <button v-if="active" @click="mark('外部中断结束')">
          外部中断结束
        </button>
        <button
          v-if="active"
          @click="mark('30 分钟观察结束，已告知可自由退出')"
        >
          标记 30 分钟
        </button>
        <button v-if="active" @click="stop">结束记录</button>
        <button @click="download">导出本机记录</button>
        <p>
          已记录 {{ record.entries.length }} 条{{
            record.truncated ? "（已达上限，后续未记录）" : ""
          }}。{{ message }}
        </p>
      </template>
    </details>
  </aside>
</template>
<style scoped>
.playtest-recorder {
  padding: 12px;
  margin: 8px;
  background: #20382e;
  color: #f1e5c9;
  border: 1px solid #c3a772;
  border-radius: 8px;
}
button {
  margin: 4px;
  min-height: 44px;
}
</style>
