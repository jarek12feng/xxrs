<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { State } from "./core";
import { listSlots, readSlot, writeSlot } from "./save-slots";
const props = defineProps<{ game: State | null; busy: boolean }>();
const emit = defineEmits<{ restore: [state: State] }>();
const rows = ref<Awaited<ReturnType<typeof listSlots>>>([]),
  working = ref(false),
  message = ref("");
const confirmation = ref<{ kind: "save" | "load"; id: string } | null>(null);
async function refresh() {
  rows.value = await listSlots();
}
onMounted(() => refresh().catch((e) => (message.value = String(e))));
function request(kind: "save" | "load", id: string) {
  confirmation.value = { kind, id };
}
async function execute() {
  const choice = confirmation.value;
  if (!choice || working.value || props.busy) return;
  working.value = true;
  message.value = "";
  try {
    if (choice.kind === "save" && props.game) {
      await writeSlot(choice.id, props.game);
      message.value = "进度已保存";
      await refresh();
    } else if (choice.kind === "load") {
      const state = await readSlot(choice.id);
      emit("restore", state);
    }
    confirmation.value = null;
  } catch (e) {
    message.value = String(e);
  } finally {
    working.value = false;
  }
}
const find = (id: string) => rows.value.find((r) => r.id === id);
</script>
<template>
  <p>行动会自动保存。手动存档保留到你明确覆盖为止。</p>
  <p v-if="message" role="status">{{ message }}</p>
  <div v-if="confirmation" class="save-confirm" role="alert">
    <p>
      {{
        confirmation.kind === "load"
          ? "读取后将替换当前进度。尚未保留的分支，请先手动保存。"
          : "将当前进度写入此位置，已有存档会被覆盖。"
      }}
    </p>
    <button :disabled="working || busy" @click="execute">
      确认{{ confirmation.kind === "load" ? "读取" : "保存" }}
    </button>
    <button :disabled="working" @click="confirmation = null">取消</button>
  </div>
  <article
    v-for="id in [
      'manual-1',
      'manual-2',
      'manual-3',
      ...rows.filter((r) => r.id.startsWith('archive-')).map((r) => r.id),
    ]"
    :key="id"
    class="save-card"
  >
    <div class="save-seal" aria-hidden="true">
      {{ find(id)?.slot?.state.name.slice(0, 1) || "空" }}
    </div>
    <div>
      <h3>
        {{ id.startsWith("manual-") ? "存档 " + id.slice(-1) : "旅程备份" }} ·
        {{
          find(id)?.slot?.state.name ||
          (find(id) ? "无法识别，请保留原档" : "空位置")
        }}
      </h3>
      <p v-if="find(id)?.slot">
        {{ find(id)!.slot!.state.realm ? "筑基" : "炼气" }} · 第
        {{ find(id)!.slot!.state.month }} 月 ·
        {{ new Date(find(id)!.slot!.savedAt).toLocaleString() }}
      </p>
    </div>
    <button
      v-if="id.startsWith('manual-')"
      :disabled="!game || busy || working || (!!find(id) && !find(id)?.slot)"
      @click="request('save', id)"
    >
      保存
    </button>
    <button
      :disabled="!find(id)?.slot || busy || working"
      @click="request('load', id)"
    >
      读取
    </button>
  </article>
</template>
