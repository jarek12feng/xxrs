import { onMounted, onUnmounted, ref } from "vue";

// Only presentation loops pause here; this hook never advances game time.
export function usePageVisible() {
  const visible = ref(true);
  const update = () => {
    visible.value = !document.hidden;
  };
  onMounted(() => {
    update();
    document.addEventListener("visibilitychange", update);
  });
  onUnmounted(() => document.removeEventListener("visibilitychange", update));
  return visible;
}
