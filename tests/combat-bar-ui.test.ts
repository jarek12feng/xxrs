// @vitest-environment happy-dom
import { createApp } from "vue";
import { expect, it } from "vitest";
import CombatBar from "../src/scene2d/combat/CombatBar.vue";
it("shows exact previews and emits only requested commands, busy disables both move and retreat", () => {
  for (const busy of [false, true]) {
    const moves: string[] = [];
    let retreat = 0;
    const host = document.createElement("div");
    const app = createApp(CombatBar, {
      turn: 2,
      player: 73,
      playerMax: 100,
      enemy: 40,
      enemyMax: 76,
      enemyName: "赤背岩獾",
      tell: "背甲绷紧",
      options: [
        { id: "guard", label: "守势", detail: "伤敌 12 · 承伤 4 · 耗草 1" },
      ],
      busy,
      onMove: (id: string) => moves.push(id),
      onRetreat: () => retreat++,
    });
    app.mount(host);
    try {
      expect(host.textContent).toContain("伤敌 12 · 承伤 4 · 耗草 1");
      expect(host.textContent).toContain("第 3 合");
      const buttons = host.querySelectorAll("button");
      buttons[0]!.click();
      buttons[1]!.click();
      expect(moves).toEqual(busy ? [] : ["guard"]);
      expect(retreat).toBe(busy ? 0 : 1);
    } finally {
      app.unmount();
    }
  }
});
it("retreat rule lock and disabled options cannot emit commands, and held Enter is suppressed", () => {
  const commands: string[] = [];
  const host = document.createElement("div");
  const app = createApp(CombatBar, {
    turn: 0,
    player: 50,
    playerMax: 50,
    enemy: 50,
    enemyMax: 50,
    enemyName: "守关者",
    tell: "准备出招",
    retreatDisabled: true,
    options: [{ id: "guard", label: "守势", disabled: true }],
    onMove: (id: string) => commands.push(id),
    onRetreat: () => commands.push("withdraw"),
  });
  app.mount(host);
  try {
    const buttons = host.querySelectorAll("button");
    expect(buttons[1]!.disabled).toBe(true);
    // Guard handlers too, not just the DOM disabled attribute.
    buttons[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    buttons[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(commands).toEqual([]);
    const held = new KeyboardEvent("keydown", {
      key: "Enter",
      repeat: true,
      bubbles: true,
      cancelable: true,
    });
    buttons[0]!.dispatchEvent(held);
    expect(held.defaultPrevented).toBe(true);
    const single = new KeyboardEvent("keydown", {
      key: "Enter",
      repeat: false,
      bubbles: true,
      cancelable: true,
    });
    buttons[0]!.dispatchEvent(single);
    expect(single.defaultPrevented).toBe(false);
    const tab = new KeyboardEvent("keydown", {
      key: "Tab",
      repeat: true,
      bubbles: true,
      cancelable: true,
    });
    buttons[0]!.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  } finally {
    app.unmount();
  }
});
