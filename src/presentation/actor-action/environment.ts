/** Browser adapter shared by Vue and Phaser. Hidden pages cancel, never auto-complete actions. */
export function observeActionEnvironment(interrupt: () => void,
  observe?: (state: { hidden: boolean; reduced: boolean }) => void,
) {
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const reduced = () => !!media?.matches;
  const publish = () => observe?.({ hidden: document.hidden, reduced: reduced() });
  const changed = () => {
    publish();
    if (document.hidden || reduced()) interrupt();
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") interrupt();
  };
  publish();
  media?.addEventListener?.("change", changed);
  document.addEventListener("visibilitychange", changed);
  window.addEventListener("keydown", key);
  return {
    reduced,
    dispose() {
      media?.removeEventListener?.("change", changed);
      document.removeEventListener("visibilitychange", changed);
      window.removeEventListener("keydown", key);
    },
  };
}
