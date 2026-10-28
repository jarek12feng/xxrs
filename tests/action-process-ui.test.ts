// @vitest-environment happy-dom
import { createApp, nextTick, type App } from "vue";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ActionFeedback from "../src/ActionFeedback.vue";
import { actionProcess } from "../src/action-process";
import type { ActionReceipt } from "../src/action-feedback";
let app: App;
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function mount(kind: "healPass" | "cutPass" | "restorePass") {
  const receipt: ActionReceipt = {
    title: "归路已成",
    process: actionProcess({ type: "road", action: kind }),
    ritual: null,
    tone: "success",
    months: 0,
    changes: [{ label: "灵石", before: 20, after: 12, good: false }],
    notes: ["青嶂收起木杖。"],
    cost: "灵石 −8",
    next: "继续行路",
  };
  const original = JSON.stringify(receipt);
  app = createApp(ActionFeedback, { receipt, expanded: true });
  app.mount(document.body.appendChild(document.createElement("div")));
  return { receipt, original };
}
it.each(["healPass", "cutPass", "restorePass"] as const)(
  "%s shows three beats before revealing costs and outcome",
  async (action) => {
    const { receipt, original } = mount(action);
    await nextTick();
    expect(document.body.textContent).toContain(receipt.process!.beats[0]);
    expect(document.body.textContent).not.toContain("归路已成");
    expect(document.querySelector(".receipt-changes")).toBeNull();
    await vi.advanceTimersByTimeAsync(900);
    expect(document.body.textContent).toContain(receipt.process!.beats[1]);
    await vi.advanceTimersByTimeAsync(900);
    expect(document.body.textContent).toContain(receipt.process!.beats[2]);
    await vi.advanceTimersByTimeAsync(900);
    expect(document.body.textContent).toContain("归路已成");
    expect(document.querySelector(".receipt-changes")?.textContent).toContain(
      "−8",
    );
    expect(JSON.stringify(receipt)).toBe(original);
  },
);
it("Escape reveals once and cancels remaining process timers", async () => {
  mount("cutPass");
  await nextTick();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await nextTick();
  expect(document.body.textContent).toContain("归路已成");
  await vi.advanceTimersByTimeAsync(4000);
  expect(document.querySelector(".playing")).toBeNull();
  expect(document.activeElement?.id).toBe("feedback-title");
});
it("reduced motion skips the process without losing the result", async () => {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
  } as MediaQueryList);
  mount("restorePass");
  await nextTick();
  expect(document.body.textContent).toContain("归路已成");
  expect(document.querySelector(".playing")).toBeNull();
});
