// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive, type App } from "vue";
import RoadPanel from "../src/RoadPanel.vue";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import { passSolutions } from "../src/core";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("keyboard previews routes but never commits, and respects locks and input controls", async () => {
  const act = vi.fn();
  const props = reactive({
    game: mistCheckpoint(42, "wood", "male", true),
    busy: false,
    onAct: act,
  });
  app = createApp({ render: () => h(RoadPanel, props) });
  app.mount(document.body.appendChild(document.createElement("div")));
  await nextTick();
  const panel = document.querySelector(".road-panel")!;
  const key = (value: string, target = panel, repeat = false) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: value, bubbles: true, repeat }),
    );
  document.querySelector<HTMLButtonElement>('[data-hotspot="objects"]')!.click();
  await nextTick();
  key("1");
  expect(act).toHaveBeenLastCalledWith({
    type: "road",
    action: passSolutions.medicine.prepare,
  });
  props.game.adventure.road.prepared = "medicine";
  key("1");
  key("2", panel, true);
  const input = document.createElement("input"); panel.append(input);
  key("2", input);
  panel.setAttribute("inert", "");
  key("2");
  panel.removeAttribute("inert");
  props.busy = true;
  await nextTick();
  key("2");
  expect(act).toHaveBeenCalledTimes(1);
  props.busy = false;
  props.game.status = "dead";
  await nextTick();
  key("2");
  expect(act).toHaveBeenCalledTimes(1);
});
it("Escape closes reading disclosures without dispatching a game command", async () => {
  const act = vi.fn();
  app = createApp(RoadPanel, {
    game: mistCheckpoint(42, "wood", "male", true),
    busy: false,
    onAct: act,
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await nextTick();
  const panel = document.querySelector(".road-panel")!;
  const details = document.createElement("details");
  details.open = true;
  panel.append(details);
  panel.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  expect(details.open).toBe(false);
  expect(act).not.toHaveBeenCalled();
});
it("route preview has a real keyboard focus entry", async () => {
  app = createApp(RoadPanel, {
    game: mistCheckpoint(42, "wood", "male", true),
    busy: false,
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await nextTick();
  const panel = document.querySelector<HTMLElement>(".road-panel")!;
  expect(panel.tabIndex).toBeGreaterThanOrEqual(0);
  panel.focus();
  expect(document.activeElement).toBe(panel);
});
