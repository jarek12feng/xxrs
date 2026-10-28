<script setup lang="ts">
import { computed } from "vue";
import { presences } from "./landmarks";
const props = defineProps<{ title: string }>();
const presence = computed(() => presences[props.title]);
</script>
<template>
  <aside
    v-if="presence"
    class="landmark-presence"
    :data-weather="presence.weather"
    aria-label="身边景象"
  >
    <span class="presence-seal" aria-hidden="true">此<br />间</span>
    <div>
      <p>{{ presence.detail }}</p>
      <small>环境意象 · {{ presence.sound }}</small>
    </div>
  </aside>
</template>
<style>
.landmark-presence {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0;
  padding: 14px 16px;
  border-left: 2px solid #c5a76b;
  background: linear-gradient(90deg, #152e29e6, #152e2930);
  color: #e8dfc9;
}
.presence-seal {
  font: 12px/1.5 serif;
  letter-spacing: 2px;
  color: #d8bb83;
  flex: none;
}
.landmark-presence p {
  font-size: 14px;
  line-height: 1.85;
  margin: 0 0 5px !important;
  max-width: 65ch;
}
.landmark-presence small {
  font-size: 11px;
  color: #aebeb1;
  letter-spacing: 0.06em;
}
@media (prefers-reduced-motion: no-preference) {
  .landmark-presence {
    animation: presence-in 0.7s ease-out;
  }
  @keyframes presence-in {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
