<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
defineProps<{ from: string; to: string }>();
const emit = defineEmits<{ finish: [] }>();
const visible = ref(true);
let timer: ReturnType<typeof setTimeout>;
onMounted(() => {
  timer = setTimeout(() => {
    visible.value = false;
    emit("finish");
  }, 1800);
});
onUnmounted(() => clearTimeout(timer));
</script>
<template>
  <div v-if="visible" class="scene-arrival" role="status">
    <small>{{ from }} →</small><strong>抵达 · {{ to }}</strong>
  </div>
</template>
<style>
.scene-arrival {
  position: fixed;
  z-index: 46;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100vw - 32px);
  padding: 12px 22px;
  border: 1px solid #d0be8466;
  border-radius: 10px;
  background: #132c26ee;
  color: #efe5ca;
  pointer-events: none;
  box-shadow: 0 8px 30px #0004;
  animation: arrival-in 0.35s ease-out;
}
.scene-arrival small,
.scene-arrival strong {
  display: block;
}
.scene-arrival small {
  font-size: 11px;
  color: #afc1b7;
  margin-bottom: 5px;
}
.scene-arrival strong {
  font: 18px serif;
  letter-spacing: 2px;
}
@keyframes arrival-in {
  from {
    opacity: 0;
    translate: 0 -8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scene-arrival {
    animation: none;
  }
}
</style>
