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
        characterArt(heroArt("male", realm), heroBattlePose(effect)),
      );
      expect(JSON.stringify(quest)).toBe(before);
    }
  }
  expect(heroBattlePose("none")).toBe("idle");
  expect(heroBattlePose("hurt")).toBe("hurt");
  expect(heroBattlePose("discern")).toBe("guard");
});
