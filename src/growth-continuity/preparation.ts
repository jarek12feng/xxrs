import type { State, Intent } from "../world";
import { itemGrowthQuote, reforgeEffect } from "../item-growth/rules";
import { artifactQuote } from "../artifact-growth/rules";
import { seaQuote } from "../outer-sea/rules";
import { conclaveQuote } from "../conclave/rules";
import { treasureQuote } from "../treasures/rules";
import { artifactReady, controlCosts, getEquipment } from "../equipment";
import { activityInterruption } from "../scene-activity";

export interface PreparationOpportunity {
  id: string;
  title: string;
  purpose: string;
  intent: Intent;
  error: string;
  months: number;
  stones: number;
  herbs?: number;
  iron?: number;
}
/** Only unfinished, already-earned opportunities. Quotes remain owned by their domains. */
export function preparationOpportunities(s: State): PreparationOpportunity[] {
  if (![1, 2].includes(s.realm) || activityInterruption(s) || s.ascension)
    return [];
  const rows: PreparationOpportunity[] = [];
  const add = (
    id: string,
    title: string,
    purpose: string,
    intent: Intent,
    q: {
      error: string;
      months: number;
      stones: number;
      herbs?: number;
      iron?: number;
    },
  ) => rows.push({ id, title, purpose, intent, ...q });
  const p = s.itemGrowth;
  if (s.realm === 1 && p.ore + p.packedOre > 0) {
    for (const relic of ["sword", "vial"] as const) {
      if (s.journey.relics[relic] !== 2 || p.reforged[relic]) continue;
      const action = { kind: "reforge", relic } as const;
      add(
        `reforge-${relic}`,
        `重铸${getEquipment(relic).name}`,
        `器髓已带回，可在行前居重铸。${reforgeEffect[relic]}`,
        { type: "itemGrowth", action },
        itemGrowthQuote(s, action),
      );
    }
  }
  if (s.realm === 2) {
    if (s.outerSea.seal && !s.outerSea.attuned) {
      const action = { kind: "attune" } as const;
      add(
        "seal-attune",
        "温养镇潮印",
        "印已入囊，尚未温养；完成后可自行出战，带入退潮内府应对潮压。",
        { type: "outerSea", action },
        seaQuote(s, action),
      );
    }
    if (s.conclave.depth > 0 && !s.conclave.attuned) {
      const action = { kind: "attune" } as const;
      add(
        "pearl-attune",
        "温养定神珠",
        "外殿所得尚未温养；护住识海后，再准备深入归潮。",
        { type: "conclave", action },
        conclaveQuote(s, action),
      );
    }
    if (p.golden.blade === "embryo") {
      const action = { kind: "attune" } as const;
      add(
        "blade-attune",
        "温养潮纹剑胚",
        "剑胚已争得。回古渡或离照港温养后，可装配并赴石台亲试破罡。",
        { type: "artifactGrowth", action },
        artifactQuote(s, action),
      );
    }
    for (const item of ["tideSeal", "spiritPearl", "tideBlade"] as const) {
      if (!artifactReady(s, item) || s.treasures.artifacts.includes(item))
        continue;
      const action = { kind: "deploy", item } as const;
      const q = treasureQuote(s, action);
      add(
        `deploy-${item}`,
        `出战${getEquipment(item).name}`,
        `已温养，尚未出战；占用御器容量${controlCosts[item]}。可在行囊调整搭配，不会自动替换其他器物。`,
        { type: "treasure", action },
        { ...q, months: 0, stones: 0 },
      );
    }
    if (
      p.golden.blade === "attuned" &&
      !p.golden.proven &&
      s.treasures.artifacts.includes("tideBlade")
    ) {
      const action = { kind: "prove" } as const;
      add(
        "blade-proof",
        "赴试罡石台",
        "潮纹剑已出战。回古渡或离照港，亲试辨影、守势后反击的破罡连招；这是实战，可撤回重备。",
        { type: "artifactGrowth", action },
        artifactQuote(s, action),
      );
    }
  }
  return rows;
}
