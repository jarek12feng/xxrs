import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { existsSync, readdirSync, statSync } from "node:fs";
import { characterArt, heroArt, heroBattlePose } from "../src/presentation/art";
import PracticeStage from "../src/PracticeStage.vue";
import BattleStage from "../src/expedition/BattleStage.vue";
import { freshExpedition } from "../src/expedition/rules";

it("ships both male outfits with all five poses and preserves female fallback", () => {
  const poses = ["idle", "meditate", "attack", "guard", "hurt"] as const;
  for (const realm of [0, 1])
    for (const pose of poses) {
      expect(
        existsSync("public" + characterArt(heroArt("male", realm), pose)),
      ).toBe(true);
      expect(heroArt("female", realm)).toBe("hero-female");
    }
  expect(characterArt(heroArt("male", 0))).not.toBe(
    characterArt(heroArt("male", 1)),
  );
  expect(characterArt("hero-female", "guard")).toBe(
    characterArt("hero-female"),
  );
  const bytes = readdirSync("public/art/hero-male").reduce(
    (n, f) => n + statSync("public/art/hero-male/" + f).size,
    0,
  );
  expect(bytes).toBeLessThan(1024 * 1024);
});

it("renders the current realm in practice and settled combat without changing the input", async () => {
  for (const realm of [0, 1]) {
    const practice = await renderToString(
      createSSRApp(PracticeStage, {
        gender: "male",
        realm,
        activity: "cultivate",
        playing: false,
      }),
    );
    expect(practice).toContain(
      characterArt(heroArt("male", realm), "meditate"),
    );
    for (const effect of [
      "none",
      "strike",
      "guard",
      "discern",
      "hurt",
      "loss",
    ] as const) {
      const quest = { ...freshExpedition(), effect };
      const before = JSON.stringify(quest);
      const html = await renderToString(
        createSSRApp(BattleStage, {
          gender: "male",
          realm,
          quest,
          foe: "蚀阵傀儡",
          telegraph: "strike",
        }),
      );
      expect(html).toContain(
        characterArt(heroArt("male", realm), "idle"),
      );
      expect(JSON.stringify(quest)).toBe(before);
    }
  }
  expect(heroBattlePose("none")).toBe("idle");
  expect(heroBattlePose("hurt")).toBe("hurt");
  expect(heroBattlePose("discern")).toBe("guard");
});

it("keeps the stopped player facing the approached person for each pose", async () => {
  const { default: WalkingActor } = await import('../src/scene2d/WalkingActor.vue');
  for (const facing of [1, -1]) {
    for (const pose of ['idle', 'attack', 'hurt'] as const) {
      const html = await renderToString(createSSRApp(WalkingActor, {
        character: 'hero-male-qi', label: '行者', position: { x: 30, y: 84 },
        moving: false, frame: 0, facing, pose,
      }));
      const native = pose === 'idle' ? -1 : 1;
      expect(html).toMatch(new RegExp(`src="/art/hero-male/qi-${pose}.webp" style="transform:scaleX\\(${facing * native}\\)`));
    }
  }
});

it("faces the opponent on the right while waiting in combat", async () => {
  const { default: CombatField } = await import('../src/scene2d/combat/CombatField.vue');
  const html = await renderToString(createSSRApp(CombatField, {
    hero: 'hero-male-qi', heroName: '行者',
    snapshot: { enemyName: '对手', enemyImage: '', id: 'duel', turn: 0, effect: 'none', player: 60, enemy: 60 },
  }));
  expect(html).toContain('scaleX(-1)');
});
