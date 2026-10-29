import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { existsSync, readdirSync, statSync } from "node:fs";
import {
  characterArt,
  heroArt,
  itemArt,
  rivalArt,
} from "../src/presentation/art";
import PracticeStage from "../src/PracticeStage.vue";
import InventoryPanel from "../src/InventoryPanel.vue";
import BattleStage from "../src/expedition/BattleStage.vue";
import SocialPanel from "../src/SocialPanel.vue";
import { rivals } from "../src/social";
import { createGame } from "../src/core";

it("renders female practice and combat art without mutating the save", async () => {
  const game = createGame("美术测试", "wood", 42);
  game.social.gender = "female";
  game.expedition.effect = "strike";
  const before = JSON.stringify(game);
  const practice = await renderToString(
    createSSRApp(PracticeStage, {
      activity: "cultivate",
      playing: false,
      gender: game.social.gender,
    }),
  );
  const combat = await renderToString(
    createSSRApp(BattleStage, {
      quest: game.expedition,
      foe: "蚀阵傀儡",
      gender: game.social.gender,
    }),
  );
  expect(practice).toContain(characterArt(heroArt("female"), "meditate"));
  expect(combat).toContain(characterArt(heroArt("female"), "attack"));
  expect(combat).toContain(characterArt("golem", "hurt"));
  expect(JSON.stringify(game)).toBe(before);
});

it("shows refined equipment only at its existing refined tier", async () => {
  const game = createGame("美术测试", "wood", 42);
  game.journey.relics.sword = 2;
  game.journey.relics.vial = 1;
  const page = await renderToString(
    createSSRApp(InventoryPanel, { game, busy: false }),
  );
  expect(page).toContain(itemArt("sword", 2));
  expect(page).toContain(itemArt("vial", 1));
  expect(page).not.toContain(itemArt("vial", 2));
});

it("ships every mapped pose and item within a 2 MiB art budget", () => {
  for (const id of [
    "hero-male",
    "hero-female",
    "luchi",
    "yuqing",
    "qingzhang",
    "raider",
    "golem",
    "gongyan",
    "peizhufeng",
    "qiuxingluo",
  ] as const)
    for (const pose of ["idle", "meditate", "attack", "hurt"] as const)
      expect(existsSync("public" + characterArt(id, pose))).toBe(true);
  for (const id of [
    "stones",
    "herbs",
    "pills",
    "healing",
    "clarity",
    "sword",
    "vial",
    "spring",
    "blade",
    "breath",
    "herb",
    "guard",
    "lantern",
    "map",
    "tag",
    "letter",
    "lamp",
  ])
    for (const tier of [0, 1, 2])
      expect(existsSync("public" + itemArt(id, tier))).toBe(true);
  expect(itemArt("unknown")).toBeUndefined();
  expect(characterArt("luchi", "attack")).toBe(characterArt("luchi"));
  const files = ["characters", "items"].flatMap((dir) =>
    readdirSync("public/art/" + dir).map(
      (file) => "public/art/" + dir + "/" + file,
    ),
  );
  expect(files).toHaveLength(37);
  expect(
    files.reduce((total, file) => total + statSync(file).size, 0),
  ).toBeLessThan(2 * 1024 * 1024);
});

it("keeps each human rival identity in the list and their own duel", async () => {
  const game = createGame("对手检查", "wood", 42);
  const list = await renderToString(
    createSSRApp(SocialPanel, {
      game,
      busy: false,
      running: false,
      mode: "arena",
    }),
  );
  for (const [opponent, rival] of rivals.entries()) {
    const art = characterArt(rivalArt[rival.name]!);
    expect(list).toContain(art);
    game.social.arena.duel = {
      opponent,
      turn: 0,
      hp: 40,
      maxHp: 40,
      enemyHp: rival.hp,
      log: [],
    };
    const before = JSON.stringify(game);
    const duel = await renderToString(
      createSSRApp(SocialPanel, {
        game,
        busy: false,
        running: false,
        mode: "arena",
      }),
    );
    expect(duel).toContain(art);
    expect(duel).not.toContain(characterArt("raider"));
    expect(JSON.stringify(game)).toBe(before);
  }
});
