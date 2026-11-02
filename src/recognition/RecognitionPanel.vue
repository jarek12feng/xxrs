<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { recognitionView } from "./view";
import {
  recognitionQuote,
  currentOffice,
  officeName,
  eligibleOffice,
  jobName,
  type RecognitionAction,
} from "./rules";
import type { DeedTier, Method } from "./state";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const view = computed(() => recognitionView(props.game));
const quote = (action: RecognitionAction) =>
  recognitionQuote(props.game, action);
const send = (action: RecognitionAction) =>
  emit("act", { type: "recognition", action });
const blocked = (action: RecognitionAction) =>
  props.busy || !!quote(action).error;
const tiers: DeedTier[] = [0, 1, 2];
const methods: Method[] = ["supplies", "skill"];
const done = (tier: DeedTier) =>
  props.game.recognition.deeds.some((d) => d.tier === tier);
const task = (tier: DeedTier, method: Method): RecognitionAction => ({
  kind: done(tier) ? "routine" : "undertake",
  tier,
  method,
});
</script>
<template>
  <section class="recognition" aria-label="亲历与任用">
    <h3>亲历与任用 · {{ view.title }}</h3>
    <p>{{ view.quote }}</p>
    <p>{{ view.next }}</p>
    <p v-if="view.invitation" class="invitation">
      有人请你担任{{
        officeName(game, eligibleOffice(game))
      }}，可受任，也可暂缓。
    </p>
    <div class="recognition-actions">
      <button
        v-if="
          game.journey.branch !== 'none' && game.recognition.innerMonth === null
        "
        :disabled="blocked({ kind: 'inner' })"
        :title="quote({ kind: 'inner' }).error"
        @click="send({ kind: 'inner' })"
      >
        回山受录内门<small>{{
          quote({ kind: "inner" }).error || "凭青嶂亲历受录；不耗贡献"
        }}</small>
      </button>
      <button
        v-if="eligibleOffice(game) > currentOffice(game)"
        :disabled="blocked({ kind: 'appoint' })"
        :title="quote({ kind: 'appoint' }).error"
        @click="send({ kind: 'appoint' })"
      >
        接受{{ officeName(game, eligibleOffice(game)) }}之职
      </button>
      <button
        v-if="view.invitation"
        :disabled="blocked({ kind: 'defer' })"
        @click="send({ kind: 'defer' })"
      >
        暂缓，先去修行
      </button>
      <button
        v-if="currentOffice(game)"
        :disabled="blocked({ kind: 'resign' })"
        @click="send({ kind: 'resign' })"
      >
        交还行牌，专心修行
      </button>
    </div>
    <p v-if="game.recognition.last" role="status">
      {{ game.recognition.last }}
    </p>
    <details :open="currentOffice(game) > 0">
      <summary>可受托的事 · {{ view.realm }}</summary>
      <article v-for="tier in tiers" :key="tier">
        <h4>
          {{ jobName(game, tier) }} · {{ done(tier) ? "旧路已熟" : "初次主持" }}
        </h4>
        <p>
          {{
            tier === 0
              ? "中期与亲历实战后可领队；后期灵力足以替代药物。"
              : tier === 1
                ? "筑基后亲自走通青嶂旧路；门内弟子须先受录内门。"
                : "中期取材炼元、办过筑基药运并受任主事后，可主持远路。"
          }}
        </p>
        <div class="recognition-actions">
          <button
            v-for="method in methods"
            :key="method"
            :disabled="blocked(task(tier, method))"
            @click="send(task(tier, method))"
          >
            {{ method === "supplies" ? "备药稳行" : "凭所学护路"
            }}{{ done(tier) ? " · 熟路简办" : "" }}
            <small
              >一月 · 灵草 −{{ quote(task(tier, method)).herbs }} · 灵石 +{{
                quote(task(tier, method)).stones
              }}{{
                quote(task(tier, method)).contribution ? " · 贡献 +1" : ""
              }}</small
            >
            <small>{{
              quote(task(tier, method)).error || "此行无新增伤势；确认后出发"
            }}</small>
          </button>
        </div>
      </article>
    </details>
    <p class="muted">
      任用可暂缓、可辞去，不影响修行与取材。熟路差事仍耗一月；未亲历的险境须亲自闯过。
    </p>
  </section>
</template>
<style scoped>
.recognition {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #9a866d;
  border-radius: 8px;
}
.recognition-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.recognition-actions button {
  flex: 1 1 210px;
  white-space: normal;
  text-align: left;
  min-height: 44px;
}
small {
  display: block;
  margin-top: 4px;
}
article {
  padding: 12px 0;
  border-top: 1px solid #9a866d55;
}
p {
  line-height: 1.7;
}
.invitation {
  font-weight: 600;
}
</style>
