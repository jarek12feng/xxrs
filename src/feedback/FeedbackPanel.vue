<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { State } from "../world";
import { build, playableScope } from "./build";
import { feedbackSummary } from "./feedback";
const props = defineProps<{ game: State | null }>();
const emit = defineEmits<{ recording: [] }>();
const runtime = window.location.protocol === "xxrs:" ? "桌面版" : "网页版";
const answers = reactive({ problem: "", steps: "", expected: "" });
const summary = computed(() => feedbackSummary(props.game, runtime, answers));
const note = ref("");
const details = ref<HTMLTextAreaElement>();
async function copy() {
  try {
    await navigator.clipboard.writeText(summary.value);
    note.value = "已复制填写内容和版本信息，请检查后自行发送给开发者。";
  } catch {
    details.value?.focus();
    details.value?.select();
    note.value = "无法自动复制，已选中文本，可手动复制或导出。";
  }
}
function download() {
  const url = URL.createObjectURL(
    new Blob([summary.value], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `长生未央反馈-${build.id}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  note.value = "已生成包含填写内容的本机反馈文件，请检查后自行发送给开发者。";
}
</script>
<template>
  <p>{{ playableScope }}</p>
  <p>版本 {{ build.version }} · 构建 {{ build.id }}</p>
  <p>
    填写后可复制或导出反馈，不会自动上传。反馈邮箱：
    <span class="feedback-email">jarek840713@gmail.com</span>。
    请将反馈文本粘贴到邮件正文，或将导出的文件作为附件发送。
  </p>
  <p>关闭面板前请复制或导出，填写内容不会自动保存。请勿填写密码等隐私信息。</p>
  <label for="feedback-problem">遇到的问题或建议</label>
  <textarea id="feedback-problem" v-model="answers.problem" rows="3" />
  <label for="feedback-steps">发生前做了什么</label>
  <textarea id="feedback-steps" v-model="answers.steps" rows="3" />
  <label for="feedback-expected">希望怎样改善</label>
  <textarea id="feedback-expected" v-model="answers.expected" rows="2" />
  <label for="feedback-summary">导出预览（自动信息不含姓名或完整存档）</label>
  <textarea
    id="feedback-summary"
    ref="details"
    :value="summary"
    readonly
    rows="9"
  />
  <div class="feedback-actions">
    <button @click="copy">复制反馈信息</button>
    <button @click="download">导出反馈文本</button>
  </div>
  <p role="status">{{ note }}</p>
  <details>
    <summary>自愿记录试玩过程</summary>
    <p>
      仅记录本次会话的行动时间、游戏月份和进度节点。需另外点击同意才开始，刷新前请导出；不会上传。
    </p>
    <button @click="emit('recording')">打开本机记录工具</button>
  </details>
</template>
<style scoped>
textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  padding: 12px;
  background: #152d25;
  color: #f3ead4;
  border: 1px solid #b9a779;
  font: inherit;
  line-height: 1.6;
}
.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
