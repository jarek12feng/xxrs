// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, nextTick, type App } from "vue";
import InventoryPanel from "../src/InventoryPanel.vue";
import { createGame } from "../src/core";
import {
  equipmentCategories,
  listEquipment,
  getEquipment,
} from "../src/equipment";
import {
  medicineCategories,
  listMedicines,
  getMedicine,
} from "../src/medicines";
let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("classifies equipment by purpose independently of shape, tier and slot", () => {
  expect(equipmentCategories).toEqual({
    attack: "攻击",
    defense: "防御",
    speed: "速度",
  });
  expect(listEquipment("attack")).toEqual(["sword", "mirror", "tideSeal"]);
  expect(listEquipment("defense")).toContain("tideSeal");
  expect(listEquipment("defense")).toContain("vial");
  expect(listEquipment("speed")).toEqual([]);
  expect(getEquipment("tideSeal")).toMatchObject({
    shape: "seal",
    tier: "artifact",
    slot: "attuned",
  });
});
it("supports multiple medicine purposes without advertising nonexistent medicines", () => {
  expect(Object.values(medicineCategories)).toEqual([
    "疗伤",
    "回气",
    "修炼",
    "突破",
    "解毒",
    "神识",
    "护脉",
  ]);
  expect(listMedicines("energy")).toContain("ward");
  expect(listMedicines("meridian")).toContain("ward");
  expect(listMedicines("healing")).toEqual(["healing"]);
  expect(listMedicines("spirit")).toEqual(["clarity"]);
  expect(listMedicines("breakthrough")).toEqual(["foundation", "goldenCore"]);
  expect(listMedicines("detox")).toEqual([]);
  expect(listMedicines("cultivation")).toEqual([]);
  expect(getMedicine("ward").categories).toEqual(["energy", "meridian"]);
});
it("shows the same purpose labels in inventory details and auxiliary cards", async () => {
  const game = createGame("分类验收", "wood", 123);
  game.journey.relics.sword = 1;
  game.journey.relics.vial = 1;
  const saved = structuredClone(game);
  app = createApp(InventoryPanel, { game, busy: false });
  app.mount(document.body.appendChild(document.createElement("div")));
  for (const [name, label] of [
    ["听松灵剑", "攻击"],
    ["归元灵瓶", "防御"],
    ["清心丹", "神识"],
    ["护脉丹", "回气 / 护脉"],
    ["筑基丹", "突破"],
  ]) {
    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".item-grid button"),
    ].find((b) => b.textContent?.includes(name));
    expect(button).toBeDefined();
    button!.click();
    await nextTick();
    expect(document.querySelector(".item-detail small")?.textContent).toContain(
      label,
    );
  }
  const bell = [...document.querySelectorAll(".treasure-grid article")].find(
    (el) => el.textContent?.includes("镇岳钟"),
  );
  expect(bell?.textContent).toContain("防御");
  expect(game).toEqual(saved);
});
