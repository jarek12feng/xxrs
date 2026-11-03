import { nextTick, onMounted, onUnmounted, ref } from "vue";
/** Focus stays in an open map; returning to the scene preserves its original control. */
export function useMapFocus(close: () => void) {
  const root = ref<HTMLElement | null>(null);
  let origin: HTMLElement | null = null;
  onMounted(() => {
    origin = document.activeElement as HTMLElement;
    root.value?.focus({ preventScroll: true });
  });
  onUnmounted(() => {
    void nextTick(() => {
      if (origin?.isConnected && origin.getClientRects().length)
        origin.focus({ preventScroll: true });
    });
  });
  function keyboard(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = [
      ...(root.value?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),select:not(:disabled),summary,[tabindex="0"]',
      ) ?? []),
    ].filter(
      (n) =>
        n.getClientRects().length > 0 &&
        !n.closest("details:not([open]) :not(summary)"),
    );
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    if (
      index === -1 ||
      (!e.shiftKey && index === nodes.length - 1) ||
      (e.shiftKey && index === 0)
    ) {
      e.preventDefault();
      (e.shiftKey ? nodes.at(-1) : nodes[0])?.focus();
    }
  }
  return { root, keyboard };
}
