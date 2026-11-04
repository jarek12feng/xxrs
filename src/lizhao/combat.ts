import type { State } from "../world";
import type { Move, CombatEncounter } from "../combat";
import { tacticalPreview } from "../combat/game";
import { foundationPower } from "../foundation-journey/combat";
export type LizhaoEncounter = "outer" | "inner" | "han";
export function lizhaoFoe(
  kind: LizhaoEncounter,
): CombatEncounter & { name: string } {
  return kind === "han"
    ? {
        name: "韩砺舟 · 金丹后期",
        realm: 2,
        stage: 2,
        hp: 450,
        attack: 52,
        pattern: ["guard", "discern", "strike"],
      }
    : kind === "outer"
      ? {
          name: "离照分潮禁阵",
          realm: 2,
          stage: 2,
          hp: 360,
          attack: 42,
          pattern: ["discern", "guard", "strike"],
        }
      : {
          name: "药池守炉傀儡",
          realm: 2,
          stage: 2,
          hp: 420,
          attack: 44,
          pattern: ["guard", "strike", "discern"],
        };
}
/** Derived only from saved turn/effect/toxin: no new save fields or private power formula. */
export function lizhaoWindow(s: State) {
  const d = s.lizhao.duel;
  if (!d || d.kind === "han") return null;
  const tide = lizhaoFoe(d.kind).pattern[d.turn % 3]!;
  const opening =
    tide === "strike" ||
    d.effect === "discern" ||
    (d.effect === "guard" && tide !== "guard");
  return {
    tide,
    opening,
    source:
      d.effect === "discern"
        ? "probe"
        : d.effect === "guard" && tide !== "guard"
          ? "counter"
          : tide === "strike"
            ? "exposed"
            : "closed",
  };
}
export function lizhaoTell(s: State) {
  const d = s.lizhao.duel;
  if (!d) return "";
  if (d.kind === "han")
    return {
      guard: "韩砺舟横刀压近，可守势卸力或辨清步法。",
      discern: "韩砺舟借浪换位，可辨影截路或抢先反击。",
      strike: "韩砺舟收刀换气，可反击，也可稳守等下一合。",
    }[lizhaoFoe(d.kind).pattern[d.turn % 3]!];
  const w = lizhaoWindow(s)!;
  const tide = {
    guard: "毒潮压来",
    discern: "分流交错",
    strike: "阵枢自行换息",
  }[w.tide];
  return `${tide}。${w.source === "probe" ? "上一合辨出的药路尚未闭合，可反击破枢。" : w.source === "counter" ? "上一合守势蓄力，潮压已退，可反击。" : w.opening ? "阵枢露出，可直接反击。" : "阵枢闭合，抢攻易遭反震；辨影可为下一合开路，守势可候潮蓄力。"}辨影排毒、守势卸力均只少量削阵；一直探路或守势难以在十八合内破阵。`;
}
export function lizhaoExchange(s: State, move: Move) {
  const l = s.lizhao,
    d = l.duel;
  if (!d) return null;
  const foe = lizhaoFoe(d.kind),
    expected = foe.pattern[d.turn % 3];
  const w = lizhaoWindow(s);
  const responses: Move[] =
    d.kind === "han"
      ? expected === "guard"
        ? ["guard", "discern"]
        : expected === "discern"
          ? ["discern", "strike"]
          : ["strike", "guard"]
      : [
          ...(expected !== "strike" ? ["guard" as const] : []),
          ...(expected === "discern" || d.toxin > 0
            ? ["discern" as const]
            : []),
          ...(w!.opening ? ["strike" as const] : []),
        ];
  // Natural exposure always supplies at least strike; other tides always allow guard.
  const toxin =
    d.kind === "han"
      ? 0
      : Math.max(
          0,
          d.toxin +
            (move === "strike" ? 29 : move === "guard" ? 13 : -24) -
            (l.preparation === "purify" ? 10 : 0),
        );
  const p = tacticalPreview(s, {
    move,
    encounter: { ...foe, responses },
    battle: d,
    effect: d.effect,
    arrayCore: false,
    retaliateOnDefeat: !!w,
    power: foundationPower(s),
    adjustments: [
      {
        phase: "exchange",
        damage: l.route === "cooperate" ? 3 : 0,
        incoming:
          -(l.preparation === "ward" ? 8 : 0) -
          (d.kind === "han" && l.response === "company" ? 6 : 0),
        note:
          l.preparation === "ward"
            ? "护潮符卸力，承伤 −8。"
            : "净药囊每合降低毒息10。",
      },
      {
        phase: "exchange",
        damage:
          d.kind === "han" && l.response === "ambush" && d.turn < 2 ? 14 : 0,
        incoming: Math.floor(d.toxin / 12),
        note: d.toxin ? "积毒压迫丹元，排毒可减轻下一合负担。" : "",
      },
      ...(w
        ? [
            {
              phase: "exchange" as const,
              damage: 0,
              incoming:
                move === "guard"
                  ? -8
                  : move === "discern" && responses.includes(move)
                    ? -8
                    : move === "strike"
                      ? w.opening
                        ? -10
                        : 8
                      : 0,
              note:
                move === "guard"
                  ? "守势卸力，承伤 −8；潮压退后可借势反击。"
                  : move === "discern"
                    ? "辨明药路，下一合可破枢；本合以排毒为主。" +
                      (responses.includes(move)
                        ? "顺流排毒，承伤 −8。"
                        : "平潮探路，没有卸力加成。")
                    : w.opening
                      ? "顺开口反击，反震 −10。"
                      : "闭枢抢攻，反震 +8。",
            },
          ]
        : []),
    ],
  });
  if (!p) return null;
  if (!w) return { ...p, toxin };
  // Domain-specific allocation of the shared combat output. Supporting a ritual is
  // not a full attack; all main-technique/equipment power still comes from the adapter.
  const factor =
    move === "discern"
      ? 0.12
      : move === "guard"
        ? 0.18
        : !w.opening
          ? 0.35
          : w.source === "probe"
            ? 1.25
            : w.source === "counter"
              ? 1.15
              : 1;
  const damage = Math.max(1, Math.floor(p.damage * factor));
  const won = damage >= d.enemy;
  return {
    ...p,
    damage,
    incoming: won ? 0 : p.incoming,
    healing: won ? 0 : p.healing,
    herbs: won ? 0 : p.herbs,
    toxin,
    note:
      p.note +
      `离照分流：本合用于${move === "discern" ? "探路排毒" : move === "guard" ? "稳炉蓄势" : "破枢"}，削阵为战力输出的${Math.round(factor * 100)}%。`,
  };
}
