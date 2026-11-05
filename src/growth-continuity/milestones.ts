import type { State } from "../world";
import type { ActionReceipt } from "../action-feedback";
import { controlCosts, getEquipment, type EquipmentId } from "../equipment";
import { reforgeEffect } from "../item-growth/rules";

/** Saved transitions only: failed/interrupted work must never play a success scene. */
export function equipmentMilestone(before: State, after: State) {
  if (before.life !== after.life || after.status !== "alive") return null;
  const a = before.itemGrowth.golden,
    b = after.itemGrowth.golden;
  const milestone = (
    id: EquipmentId,
    stage: string,
    body: string,
    next: string,
  ) => ({
    title: `${getEquipment(id).name} · ${stage}`,
    equipment: { id, stage },
    body,
    next,
  });
  const ready = (id: "tideSeal" | "spiritPearl" | "tideBlade", next: string) =>
    milestone(
      id,
      "温养已成",
      `灵息收回，器纹仍沿原路缓缓明灭。${after.treasures.artifacts.includes(id) ? "此宝已经出战。" : `此宝尚未出战；需在行囊自行装配，占用御器容量${controlCosts[id]}。`}`,
      next,
    );
  if (a.blade === "none" && b.blade === "embryo")
    return milestone(
      "tideBlade",
      "剑胚入手",
      "匣口的余潮散去，你收起尚未驯服的剑胚。它还不能出战。",
      "回古渡或离照港温养：需有效神识24、灵石24、六月；也可先继续其他行旅。",
    );
  if (a.blade === "embryo" && b.blade === "attuned")
    return ready(
      "tideBlade",
      "装配后可赴试罡石台，检验潮纹剑能否破开罡衣。石台是实战，可撤回重备。",
    );
  if (!a.proven && b.proven)
    return milestone(
      "tideBlade",
      "试罡已过",
      "石偶的罡衣已经破开，这柄剑的蓄势连招由你亲手试成。",
      "你已掌握潮纹剑的蓄势破罡。离照药池仍有取药实战，可按阵势选用所得。",
    );
  if (!before.outerSea.seal && after.outerSea.seal)
    return milestone(
      "tideSeal",
      "镇潮印入囊",
      "印底潮纹尚未与丹元相合。宝物已经取得，护体之力还须温养后自行出战。",
      "可在安全处先温养，再备行装深入退潮内府；继续修行也不会失去宝物。",
    );
  if (!before.outerSea.attuned && after.outerSea.attuned)
    return ready(
      "tideSeal",
      "镇潮印可护持内府潮压，是否出战由你在行囊决定；行装与修为要求可在入口查看。",
    );
  if (before.conclave.depth === 0 && after.conclave.depth >= 1)
    return milestone(
      "spiritPearl",
      "定神珠入囊",
      "外殿的震荡渐息，珠中仍留着一缕紊乱回声。先退到安全处温养。",
      "温养定神珠后再入归潮深处；常规交锋的护体效果还需在行囊自行出战。",
    );
  if (!before.conclave.attuned && after.conclave.attuned)
    return ready(
      "spiritPearl",
      "可准备归潮深处的行装。温养已护住入境所需识海，常规交锋的器物效果仍以实际出战搭配为准。",
    );
  for (const id of ["sword", "vial"] as const)
    if (!before.itemGrowth.reforged[id] && after.itemGrowth.reforged[id])
      return milestone(
        id,
        "重铸已成",
        reforgeEffect[id],
        "原器纹仍保留。下一场交锋可按主器特点选择反击、守势或辨影，不必重打已通的旧关。",
      );
  for (const [key, id] of [
    ["seal", "tideSeal"],
    ["pearl", "spiritPearl"],
  ] as const)
    if (!a[key] && b[key])
      return milestone(
        id,
        "续炼已成",
        "原有器纹已经接续。法宝是否生效仍取决于出战搭配，续炼不会替你换下其他器物。",
        "可带回离照药池：镇潮印配合守势，定神珠配合辨影；先看清来势再出招。",
      );
  return null;
}
export function enrichEquipmentMilestone(
  before: State,
  after: State,
  receipt: ActionReceipt,
): ActionReceipt {
  const m = equipmentMilestone(before, after);
  if (!m) return receipt;
  return {
    ...receipt,
    title: m.title,
    equipment: m.equipment,
    spotlight: true,
    tone: "success",
    next: m.next,
    notes: [
      ...new Set([m.body, after.log[0]?.text ?? "", ...(receipt.payoff ?? [])]),
    ].filter(Boolean),
  };
}
