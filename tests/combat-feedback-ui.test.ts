// @vitest-environment happy-dom
import { createApp, h, shallowRef, nextTick } from "vue";
import { expect, it, vi } from "vitest";
import CombatFeedbackView from "../src/foundation-journey/CombatFeedback.vue";
import { foundationCombatFixture } from "../tools/foundation-combat-fixture";
import {
  combatFeedback,
  type CombatFeedback,
} from "../src/foundation-journey/feedback";
import { dispatch } from "../src/core";

it.each([false, true])(
  "saved result animation replaces earlier floats and respects reduced motion %s",
  async (reduced) => {
    vi.useFakeTimers();
    const clear = vi.spyOn(globalThis, "clearTimeout");
    const media = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: reduced } as MediaQueryList);
    const game = shallowRef(foundationCombatFixture("exit", "spring", "vial"));
    const result = shallowRef<CombatFeedback | null>(null);
    const host = document.body.appendChild(document.createElement("div"));
    const app = createApp({
      render: () =>
        h(CombatFeedbackView, { game: game.value, result: result.value }),
    });
    app.mount(host);
    try {
      for (let i = 0; i < 2; i++) {
        const before = game.value;
        const c = {
          id: `round-${i}`,
          type: "foundationJourney",
          action: { kind: "move", move: "guard" },
        } as const;
        game.value = dispatch(before, c);
        result.value = combatFeedback(before, game.value, c);
        await nextTick();
        expect(host.querySelectorAll(".combat-float").length).toBe(
          reduced ? 0 : 2,
        );
        expect(host.textContent).toContain(`第 ${i + 1} 合`);
        expect(
          host
            .querySelector('[aria-label="你的气势"]')
            ?.getAttribute("aria-valuenow"),
        ).toBe(String(result.value!.player.after));
      }
      vi.advanceTimersByTime(500);
      await nextTick();
      expect(host.querySelectorAll(".combat-float")).toHaveLength(0);
      expect(host.textContent).toContain("第 2 合");
    } finally {
      const calls = clear.mock.calls.length;
      app.unmount();
      host.remove();
      expect(clear.mock.calls.length - calls).toBeGreaterThanOrEqual(2);
      clear.mockRestore();
      media.mockRestore();
      vi.useRealTimers();
    }
  },
);
