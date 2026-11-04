<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { motiveText } from "./narrative";
import { qiError } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const motive = computed(
  () => props.game.qiJourney.narrative?.motive ?? "unspoken",
);
</script>
<template>
  <section aria-label="药乡来物与入道心意">
    <p>
      药囊是家里缝的，缝边还留着晒药的草屑。你出身听松山外的药乡，随队遇险时由老药师教过调息；温蘅发现你能引气，劝你上山求教。你自己辞别了长辈和同龄旧友，来到渡口。
    </p>
    <template v-if="motive === 'unspoken'"
      ><p>这一趟，你想求什么？</p>
      <div class="origin-choices">
        <button
          v-for="(label, key) in motiveText"
          :key="key"
          :disabled="busy || !!qiError(game, `origin:${key}`)"
          @click="emit('act', { type: 'qiJourney', action: `origin:${key}` })"
        >
          {{ label }}
        </button>
      </div>
      <small
        >只记下此刻的心意，不影响功法或突破把握；也可以先去救人。</small
      ></template
    >
    <p v-else>你记得启程时的心意：{{ motiveText[motive] }}。</p>
  </section>
</template>
<style scoped>
p {
  line-height: 1.7;
}
.origin-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.origin-choices button {
  padding: 10px 14px;
  border: 1px solid #b8a373;
  background: #264338;
  color: #f4ead4;
  cursor: pointer;
}
.origin-choices button:focus-visible {
  outline: 2px solid #f4d395;
}
</style>
