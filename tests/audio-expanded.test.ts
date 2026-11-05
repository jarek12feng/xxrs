import { expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createCultivator } from "../tools/cultivator-fixture";
import { gameAudioScene } from "../src/audio-scene";
import { actionSound, breakthroughMusic } from "../src/action-sound";
import { journeySound } from "../src/journey-sound";
import { audioUrl } from "../src/foundation-audio";
import type { Intent } from "../src/core";

const fresh = () => createCultivator("听潮", "wood", 42);
it("uses the visible late-game place, clears old locations on cultivation and death", () => {
  const s = fresh();
  s.realm = 2;
  s.foundationJourney.location = "snow";
  s.outerSea.location = "ruins";
  expect(gameAudioScene(s, "", "山居", "sea")).toEqual({
    music: "sunken",
    ambient: "waterside",
  });
  expect(gameAudioScene(s, "", "山居").music).toBe("vista");
  s.lizhao.location = "chamber";
  expect(gameAudioScene(s, "", "山居", "lizhao").music).toBe("lamps");
  s.lizhao.location = "inner";
  expect(gameAudioScene(s, "", "山居", "lizhao").music).toBe("mystery");
  s.realm = 3;
  expect(gameAudioScene(s, "", "山居", "nascent").music).toBe("vista");
  s.status = "dead";
  expect(gameAudioScene(s, "", "山居", "nascent").music).toBe("last-lamp");
  expect(gameAudioScene(null, "", "山居", "lizhao").music).toBe("home");
});
it("late-game combat interrupts exploration; withdrawal restores the place", () => {
  const s = fresh();
  s.realm = 2;
  s.outerSea.location = "ruins";
  s.outerSea.duel = { depth: 1, hp: 10, enemy: 10, turn: 0, effect: "" };
  expect(gameAudioScene(s, "", "山居", "sea").music).toBe("trial");
  const before = structuredClone(s);
  s.outerSea.duel = null;
  expect(gameAudioScene(s, "", "山居", "sea").music).toBe("sunken");
  expect(
    actionSound(before, s, { type: "outerSea", action: { kind: "withdraw" } }),
  ).toBe("rest");
  expect(
    actionSound(before, s, {
      type: "outerSea",
      action: { kind: "move", move: "guard" },
    }),
  ).toBe("hurt");
  s.outerSea.cleared = 1;
  expect(
    actionSound(before, s, {
      type: "outerSea",
      action: { kind: "move", move: "guard" },
    }),
  ).toBe("victory");
});
it("earned learning, medicine and rescue sound once; identical reloads do not celebrate", () => {
  const a = fresh();
  const cases: [Intent, (s: typeof a) => void, string][] = [
    [
      { type: "outerSea", action: { kind: "attune" } },
      (s) => {
        s.outerSea.attuned = true;
      },
      "upgrade",
    ],
    [
      { type: "goldenStory", action: { kind: "practice", move: "confirm" } },
      (s) => {
        s.goldenStory.teachings.push("spirit");
      },
      "ward-learn",
    ],
    [
      { type: "lizhao", action: { kind: "verify" } },
      (s) => {
        s.lizhao.recipeVerified = true;
      },
      "ward-test",
    ],
    [
      {
        type: "nascentSoul",
        action: { kind: "brew", method: "self", fire: "steady" },
      },
      (s) => {
        s.nascentSoul.pills = 1;
      },
      "medicine",
    ],
    [
      { type: "nascentSoul", action: { kind: "crossing", move: "advance" } },
      (s) => {
        s.nascentSoul.ability = "done";
      },
      "rescue-clear",
    ],
  ];
  for (const [intent, change, cue] of cases) {
    const b = structuredClone(a);
    change(b);
    expect(actionSound(a, b, intent)).toBe(cue);
    expect(journeySound(b, structuredClone(b), intent)).toBeNull();
  }
});
it("separates failed assay and practice from success, and death overrides all rewards", () => {
  const a = fresh(),
    b = structuredClone(a);
  b.lizhao.assay.mistakes++;
  expect(
    actionSound(a, b, {
      type: "lizhao",
      action: { kind: "assay", move: "bind" },
    }),
  ).toBe("failure");
  b.status = "dead";
  b.outerSea.cleared = 1;
  expect(
    actionSound(a, b, {
      type: "outerSea",
      action: { kind: "move", move: "guard" },
    }),
  ).toBe("death");
});
it("nascent advancement has its own original non-silent score and accent", () => {
  const a = fresh();
  a.realm = 2;
  const b = structuredClone(a);
  b.realm = 3;
  expect(breakthroughMusic(a, b)).toBe("nascent-rise");
  expect(
    actionSound(a, b, {
      type: "nascentSoul",
      action: { kind: "step", move: "unite" },
    }),
  ).toBe("nascent-breakthrough");
  for (const cue of ["nascent-rise", "nascent-breakthrough"]) {
    const path = `public${audioUrl(cue)}`;
    expect(existsSync(path)).toBe(true);
    const wav = readFileSync(path);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    let peak = 0;
    for (let i = 44; i + 1 < wav.length; i += 2)
      peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    expect(peak).toBeGreaterThan(1000);
    expect(peak).toBeLessThan(30000);
  }
});

it("distinguishes earned artifact growth from spirit injury and repeated results", () => {
  const a=fresh();
  const cases:[Intent,(s:typeof a)=>void,string][]=[
    [{type:"artifactGrowth",action:{kind:"attune"}},s=>{s.itemGrowth.golden.blade="attuned";},"upgrade"],
    [{type:"itemGrowth",action:{kind:"reforge",relic:"sword"}},s=>{s.itemGrowth.reforged.sword=true;},"upgrade"],
    [{type:"spirit",action:{kind:"study"}},s=>{s.spirit.manual="learned";},"upgrade"],
    [{type:"spirit",action:{kind:"move",move:"reach"}},s=>{s.spirit.trauma=1;},"hurt"],
  ];
  for(const [intent,change,cue] of cases){
    const b=structuredClone(a);change(b);
    expect(actionSound(a,b,intent)).toBe(cue);
    expect(journeySound(b,structuredClone(b),intent)).toBeNull();
  }
});

it("tolerates the previous rendered chapter during advancement before Vue updates it", () => {
  const s=fresh();s.realm=2;
  expect(gameAudioScene(s,"","山居","foundation").music).toBe("vista");
});
